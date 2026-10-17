/**
 * Cut a Tampa Bay Protomaps extract (outside the repo) and put it in R2.
 *
 *   npx tsx scripts/extract-tampa-pmtiles.ts
 *   npx tsx scripts/extract-tampa-pmtiles.ts --remote
 *
 * Source: daily planet at build.protomaps.com. Bbox covers Tampa, St. Pete,
 * Brandon, Riverview, and Westchase.
 */
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import { R2_BUCKET_NAME, ROOT, parseCli } from "./lib";

const execFileAsync = promisify(execFile);
const PMTILES_BIN = "C:\\Users\\adeel\\AppData\\Local\\Temp\\tampa-pmtiles\\pmtiles.exe";
const OUT_FILE = "C:\\Users\\adeel\\AppData\\Local\\Temp\\tampa-pmtiles\\tampa.pmtiles";
const SOURCE = "https://build.protomaps.com/20261003.pmtiles";
const BBOX = "-82.78,27.62,-82.18,28.18";
const WRANGLER_BIN =
  process.platform === "win32"
    ? join(ROOT, "node_modules", ".bin", "wrangler.cmd")
    : join(ROOT, "node_modules", ".bin", "wrangler");

async function main() {
  const { flags } = parseCli(process.argv.slice(2));
  if (!existsSync(PMTILES_BIN)) {
    throw new Error(`go-pmtiles not found at ${PMTILES_BIN}`);
  }
  await execFileAsync(
    PMTILES_BIN,
    ["extract", SOURCE, OUT_FILE, `--bbox=${BBOX}`, "--download-threads=8", "--overfetch=0.15"],
    { windowsHide: true, maxBuffer: 10 * 1024 * 1024 },
  );
  const args = [
    "r2",
    "object",
    "put",
    `${R2_BUCKET_NAME}/maps/tampa.pmtiles`,
    "--file",
    OUT_FILE,
    "--content-type",
    "application/vnd.pmtiles",
    flags.has("remote") ? "--remote" : "--local",
  ];
  await execFileAsync(WRANGLER_BIN, args, { cwd: ROOT, windowsHide: true, shell: true });
  console.log(`Uploaded maps/tampa.pmtiles (${flags.has("remote") ? "remote" : "local"} R2)`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
