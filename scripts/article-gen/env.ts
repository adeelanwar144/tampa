import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import type { ModelChoice } from "./types";

const ROOT = process.cwd();

config({ path: resolve(ROOT, ".env"), quiet: true });

export const PATHS = {
  root: ROOT,
  instructions: resolve(ROOT, "content/instructions/content-instructions.md"),
  plannerDir: resolve(ROOT, "content/planner"),
  notesDir: resolve(ROOT, "content/notes"),
  outputDir: resolve(ROOT, "output"),
};

const DEFAULT_SONNET = "claude-sonnet-5-5";
const DEFAULT_HAIKU = "claude-haiku-5-5";

export function requireUtf8(path: string, label: string): string {
  if (!existsSync(path)) {
    throw new Error(`Missing ${label}: ${path}`);
  }
  return readFileSync(path, "utf8");
}

export function claudeApiKey(): string {
  const key = process.env.Claude_API_KEY?.trim() || process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "Missing Claude API key. Set Claude_API_KEY (or ANTHROPIC_API_KEY) in .env at the project root.",
    );
  }
  return key;
}

export function pexelsApiKey(): string {
  const key = process.env.PEXELS_API_KEY?.trim();
  if (!key) {
    throw new Error("Missing Pexels API key. Set PEXELS_API_KEY in .env at the project root.");
  }
  return key;
}

export function modelId(choice: ModelChoice): string {
  if (choice === "haiku") return process.env.CLAUDE_MODEL_HAIKU?.trim() || DEFAULT_HAIKU;
  return process.env.CLAUDE_MODEL_SONNET?.trim() || DEFAULT_SONNET;
}

/** USD per million tokens. Cache write ≈ 1.25× input; Sonnet 5.5 cache reads are 5% of input. */
export function tokenRates(model: string): {
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
} {
  if (model.includes("haiku")) {
    return { input: 0.1, output: 0.5, cacheWrite: 0.125, cacheRead: 0.01 };
  }
  return { input: 2, output: 10, cacheWrite: 2.5, cacheRead: 0.1 };
}
