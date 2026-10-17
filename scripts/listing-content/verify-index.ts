import { readdirSync } from "node:fs";
import { join } from "node:path";
import { PATHS } from "../article-gen/env";
import { getIndex, getRecord } from "./r2";

async function main(): Promise<void> {
  const index = await getIndex();
  console.log(`Remote listings/_index.json: ${index.length} entries`);
  const missing: string[] = [];
  const review: string[] = [];
  const chunk = 8;
  for (let i = 0; i < index.length; i += chunk) {
    const slice = index.slice(i, i + chunk);
    const records = await Promise.all(slice.map((entry) => getRecord(entry.slug)));
    slice.forEach((entry, idx) => {
      const record = records[idx];
      if (!record) missing.push(entry.slug);
      else if (record.needsReview) review.push(entry.slug);
    });
    console.log(`checked ${Math.min(i + chunk, index.length)}/${index.length}`);
  }
  const qDir = join(PATHS.root, ".listing-content-cache", "quarantine");
  let quarantined = 0;
  try {
    quarantined = readdirSync(qDir).filter((name) => name.endsWith(".json")).length;
  } catch {
    quarantined = 0;
  }
  console.log(`missing from bucket: ${missing.length}`);
  if (missing.length) console.log(missing.join("\n"));
  console.log(`index needsReview: ${review.length}`);
  console.log(`local quarantine files: ${quarantined}`);
  if (missing.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
