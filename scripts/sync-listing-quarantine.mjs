/**
 * Sync quarantined listing slugs into places.listing_quarantined.
 * Prefers local .listing-content-cache/quarantine; falls back to R2 S3 list if configured.
 */
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { config } from "dotenv";
import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";

const ROOT = process.cwd();
config({ path: join(ROOT, ".env"), quiet: true });
const WRANGLER = join(ROOT, "node_modules", "wrangler", "bin", "wrangler.js");
const LOCAL_Q = join(ROOT, ".listing-content-cache", "quarantine");

function wrangler(args) {
  const result = spawnSync(process.execPath, [WRANGLER, ...args], {
    cwd: ROOT,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `wrangler failed: ${args.join(" ")}`);
  }
  return result.stdout;
}

function localSlugs() {
  if (!existsSync(LOCAL_Q)) return [];
  return readdirSync(LOCAL_Q)
    .filter((name) => name.endsWith(".json"))
    .map((name) => name.slice(0, -".json".length));
}

async function remoteSlugs() {
  const accountId = (process.env.R2_ACCOUNT_ID ?? process.env.CLOUDFLARE_ACCOUNT_ID ?? "").trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  if (!accountId || !accessKeyId || !secretAccessKey) return [];
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  const slugs = [];
  let token;
  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: "listing-content",
        Prefix: "quarantine/",
        ContinuationToken: token,
      }),
    );
    for (const obj of page.Contents ?? []) {
      const key = obj.Key ?? "";
      if (!key.endsWith(".json")) continue;
      const slug = key.slice("quarantine/".length, -".json".length);
      if (slug && !slug.includes("/")) slugs.push(slug);
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return slugs;
}

const fromLocal = localSlugs();
const fromRemote = await remoteSlugs();
const slugs = [...new Set([...fromLocal, ...fromRemote])];
console.log(`quarantine slugs: local=${fromLocal.length} remote=${fromRemote.length} unique=${slugs.length}`);

wrangler([
  "d1",
  "execute",
  "tampa-bay-guide",
  "--remote",
  "--command",
  "UPDATE places SET listing_quarantined = 0",
]);

if (slugs.length === 0) {
  console.log("No quarantine keys to sync.");
  process.exit(0);
}

const chunkSize = 100;
for (let i = 0; i < slugs.length; i += chunkSize) {
  const chunk = slugs.slice(i, i + chunkSize);
  const values = chunk.map((slug) => `'${slug.replace(/'/g, "''")}'`).join(", ");
  const sql = `UPDATE places SET listing_quarantined = 1 WHERE slug IN (${values});`;
  const sqlPath = join(tmpdir(), `sync-quarantine-${Date.now()}-${i}.sql`);
  writeFileSync(sqlPath, `${sql}\n`, "utf8");
  wrangler(["d1", "execute", "tampa-bay-guide", "--remote", "--file", sqlPath]);
  console.log(`marked ${Math.min(i + chunkSize, slugs.length)}/${slugs.length}`);
}
