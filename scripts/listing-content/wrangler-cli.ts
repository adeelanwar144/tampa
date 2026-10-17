import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";
import { ROOT } from "../lib";

const execFileAsync = promisify(execFile);
const WRANGLER_JS = join(ROOT, "node_modules", "wrangler", "bin", "wrangler.js");

export async function runWrangler(
  args: string[],
  options: { maxBuffer?: number } = {},
): Promise<{ stdout: string; stderr: string }> {
  const next = [...args];
  if (
    next[0] === "r2" &&
    next[1] === "object" &&
    (next[2] === "put" || next[2] === "get" || next[2] === "delete") &&
    !next.includes("--remote")
  ) {
    next.push("--remote");
  }
  return execFileAsync(process.execPath, [WRANGLER_JS, ...next], {
    cwd: ROOT,
    windowsHide: true,
    maxBuffer: options.maxBuffer ?? 8 * 1024 * 1024,
  });
}
