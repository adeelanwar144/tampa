/**
 * Set places.updated_at from each listing essay's generatedAt.
 * Run after db/migrate-place-updated-at.sql. Rows with no essay keep imported_at.
 *
 * Usage: node scripts/backfill-place-updated-at.mjs [index.json]
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const indexPath = process.argv[2] ?? "tmp-listing-index.json";
const index = JSON.parse(readFileSync(indexPath, "utf8"));
if (!Array.isArray(index)) throw new Error("index is not an array");

const slugOk = /^[a-z0-9-]+$/;
const statements = [];
let skipped = 0;
for (const entry of index) {
  const slug = typeof entry.slug === "string" ? entry.slug : "";
  const time = Date.parse(entry.generatedAt);
  if (!slugOk.test(slug) || Number.isNaN(time)) {
    skipped += 1;
    continue;
  }
  const iso = new Date(time).toISOString();
  statements.push(`UPDATE places SET updated_at = '${iso}' WHERE slug = '${slug}';`);
}

const sqlPath = join(tmpdir(), `place-updated-at-${Date.now()}.sql`);
writeFileSync(sqlPath, `${statements.join("\n")}\n`, "utf8");
console.log(`updates ${statements.length}, skipped ${skipped}, file ${sqlPath}`);

execFileSync(
  process.execPath,
  ["node_modules/wrangler/bin/wrangler.js", "d1", "execute", "tampa-bay-guide", "--remote", "--file", sqlPath],
  { stdio: "inherit" },
);
