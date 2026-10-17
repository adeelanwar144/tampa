import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { config } from "dotenv";
import { PATHS } from "../article-gen/env";
import { fixListingCopy } from "./fix-copy";
import { putIndex, putRecord, r2WriteMode, readLocalRecords, readQuarantineRecords } from "./r2";
import type { IndexEntry, ListingContentRecord } from "./types";
import { runWrangler } from "./wrangler-cli";

config({ path: resolve(PATHS.root, ".env"), quiet: true });

function toIndex(record: ListingContentRecord): IndexEntry {
  return {
    slug: record.slug,
    wordCount: record.wordCount,
    needsReview: record.needsReview,
    inputHash: record.inputHash,
    generatedAt: record.generatedAt,
  };
}

async function writeAll(records: ListingContentRecord[]): Promise<void> {
  let written = 0;
  await Promise.all(
    records.map(async (record) => {
      await putRecord(record);
      written += 1;
      if (written === 1 || written % 25 === 0 || written === records.length) {
        console.log(`  wrote ${written}/${records.length}`);
      }
    }),
  );
}

async function d1Json(args: string[]): Promise<unknown> {
  const { stdout } = await runWrangler(["d1", "execute", "tampa-bay-guide", ...args], {
    maxBuffer: 32 * 1024 * 1024,
  });
  const startArr = stdout.indexOf("[");
  const startObj = stdout.indexOf("{");
  const start = startArr === -1 ? startObj : startObj === -1 ? startArr : Math.min(startArr, startObj);
  if (start === -1) throw new Error("wrangler d1 execute returned no JSON");
  return JSON.parse(stdout.slice(start));
}

function countByStatus(payload: unknown): Record<string, number> {
  const counts: Record<string, number> = {};
  const walk = (value: unknown): void => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      const first = value[0];
      if (first && typeof first === "object" && "status" in first) {
        for (const row of value as Array<{ status?: string; n?: number | string }>) {
          const status = String(row.status ?? "unknown");
          counts[status] = Number(row.n ?? 0);
        }
        return;
      }
      for (const item of value) walk(item);
      return;
    }
    walk((value as { results?: unknown }).results);
  };
  walk(payload);
  return counts;
}

function slugSql(slugs: string[]): string {
  return slugs
    .filter((slug) => /^[a-z0-9-]+$/.test(slug))
    .map((slug) => `'${slug}'`)
    .join(", ");
}

async function backupPlaces(): Promise<string> {
  const payload = await d1Json(["--remote", "--json", "--command", "SELECT * FROM places"]);
  const dir = join(PATHS.root, ".listing-content-cache");
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `places-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return path;
}

function writeLaunchLog(records: ListingContentRecord[]): void {
  const lines = [
    "# Launch log",
    "",
    "## Published but needs review",
    "",
  ];
  const sorted = [...records].sort((a, b) => a.slug.localeCompare(b.slug));
  for (const record of sorted) {
    const reasons = record.reviewReasons.length
      ? record.reviewReasons.map((reason) => reason.replace(/\s+/g, " ").trim()).join(" | ")
      : "(no reason recorded)";
    lines.push(`- \`${record.slug}\` — ${reasons}`);
  }
  lines.push("");
  writeFileSync(join(PATHS.root, "LAUNCH-LOG.md"), `${lines.join("\n")}\n`, "utf8");
}

async function main(): Promise<void> {
  const quarantined = readQuarantineRecords();
  console.log(`Quarantine records: ${quarantined.length}`);
  writeLaunchLog(quarantined);

  const bySlug = new Map<string, ListingContentRecord>();
  for (const record of readLocalRecords()) bySlug.set(record.slug, record);
  for (const record of quarantined) {
    bySlug.set(record.slug, {
      ...record,
      needsReview: true,
      reviewReasons: record.reviewReasons.length ? record.reviewReasons : ["restored from quarantine"],
    });
  }

  const restored = [...bySlug.values()].filter((record) => record.contentMarkdown?.trim());
  console.log(`Listings with content: ${restored.length}. R2 writes: ${r2WriteMode()}`);
  const fixed = restored.map((record) => {
    const next = fixListingCopy(record);
    if (quarantined.some((item) => item.slug === record.slug)) {
      next.needsReview = true;
      next.reviewReasons = record.reviewReasons;
    }
    return next;
  });

  const arcade = fixed.find((record) => record.slug === "1983-restaurant-bar-and-arcade");
  if (arcade) {
    console.log("1983 headings:");
    for (const match of arcade.contentMarkdown.matchAll(/^##\s+(.+)$/gm)) console.log(`  ${match[1]}`);
    const hoursLine = arcade.contentMarkdown.split("\n").find((line) => /hours should/i.test(line));
    if (hoursLine) console.log(`1983 hours line: ${hoursLine}`);
    if (/\$\d/.test(arcade.contentMarkdown)) console.log("WARN 1983 still has $ prices");
  }

  console.log("Writing listings to R2...");
  await writeAll(fixed);
  const index = fixed.map(toIndex).sort((a, b) => a.slug.localeCompare(b.slug));
  await putIndex(index);
  console.log(`Index written: ${index.length} entries, needsReview ${index.filter((entry) => entry.needsReview).length}`);

  console.log("Backing up places...");
  const backupPath = await backupPlaces();
  console.log(`Backup: ${backupPath}`);

  const slugs = fixed.map((record) => record.slug);
  for (let i = 0; i < slugs.length; i += 40) {
    const chunk = slugs.slice(i, i + 40);
    const sql = `UPDATE places SET status = 'published' WHERE slug IN (${slugSql(chunk)})`;
    await d1Json(["--remote", "--json", "--command", sql]);
    console.log(`Published ${Math.min(i + 40, slugs.length)}/${slugs.length}`);
  }

  const counts = countByStatus(
    await d1Json(["--remote", "--json", "--command", "SELECT status, COUNT(*) AS n FROM places GROUP BY status"]),
  );
  console.log(`D1 status counts: ${JSON.stringify(counts)}`);
  console.log(
    `DONE published_content=${fixed.length} needs_review=${fixed.filter((record) => record.needsReview).length} d1_published=${counts.published ?? 0} d1_draft=${counts.draft ?? 0}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
