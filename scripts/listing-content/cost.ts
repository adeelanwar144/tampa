import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { PATHS } from "../article-gen/env";
import type { ClaudeUsage } from "./types";

const MODEL = "claude-haiku-5-5";

/** USD per million tokens for Haiku 5.5 prompts under 100k tokens. */
const STANDARD = { input: 0.1, output: 0.5, cacheWrite: 0.125, cacheRead: 0.01 };
const BATCH = { input: 0.05, output: 0.25, cacheWrite: 0.0625, cacheRead: 0.005 };

export const HAIKU_MODEL = MODEL;

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function estimateCostUsd(usage: ClaudeUsage, batch: boolean): number {
  const rates = batch ? BATCH : STANDARD;
  const million = 1_000_000;
  return (
    (usage.inputTokens / million) * rates.input +
    (usage.outputTokens / million) * rates.output +
    (usage.cacheCreationTokens / million) * rates.cacheWrite +
    (usage.cacheReadTokens / million) * rates.cacheRead
  );
}

export function formatMoney(value: number): string {
  if (value < 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(2)}`;
}

export function emptyUsage(): ClaudeUsage {
  return { inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0 };
}

export function addUsage(total: ClaudeUsage, next: ClaudeUsage): ClaudeUsage {
  return {
    inputTokens: total.inputTokens + next.inputTokens,
    outputTokens: total.outputTokens + next.outputTokens,
    cacheCreationTokens: total.cacheCreationTokens + next.cacheCreationTokens,
    cacheReadTokens: total.cacheReadTokens + next.cacheReadTokens,
  };
}

const RUN_COST_LIMIT_USD = 1;
const SPEND_PATH = join(PATHS.root, ".listing-content-cache", "claude-spend.json");
/** Listing-content spend before this run, plus the $0.06 retest already billed. */
const PRIOR_LIFETIME_USD = 0.241;
const PRIOR_RUN_USD = 0.06;

type SpendFile = { lifetimeUsd: number; runUsd: number; billedBatchIds?: string[] };

function loadSpend(): SpendFile {
  if (!existsSync(SPEND_PATH)) {
    return { lifetimeUsd: PRIOR_LIFETIME_USD + PRIOR_RUN_USD, runUsd: PRIOR_RUN_USD, billedBatchIds: [] };
  }
  try {
    const parsed = JSON.parse(readFileSync(SPEND_PATH, "utf8")) as Partial<SpendFile>;
    return {
      lifetimeUsd: typeof parsed.lifetimeUsd === "number" ? parsed.lifetimeUsd : PRIOR_LIFETIME_USD + PRIOR_RUN_USD,
      runUsd: typeof parsed.runUsd === "number" ? parsed.runUsd : PRIOR_RUN_USD,
      billedBatchIds: Array.isArray(parsed.billedBatchIds) ? parsed.billedBatchIds : [],
    };
  } catch {
    return { lifetimeUsd: PRIOR_LIFETIME_USD + PRIOR_RUN_USD, runUsd: PRIOR_RUN_USD, billedBatchIds: [] };
  }
}

function saveSpend(): void {
  mkdirSync(dirname(SPEND_PATH), { recursive: true });
  writeFileSync(SPEND_PATH, `${JSON.stringify({ lifetimeUsd, runUsd, billedBatchIds }, null, 2)}\n`, "utf8");
}

const initial = loadSpend();
let runUsd = initial.runUsd;
let lifetimeUsd = initial.lifetimeUsd;
let billedBatchIds = initial.billedBatchIds ?? [];
saveSpend();

export function addRunCost(usage: ClaudeUsage, batch: boolean, batchId?: string): number {
  if (batchId && billedBatchIds.includes(batchId)) return runUsd;
  const cost = estimateCostUsd(usage, batch);
  runUsd += cost;
  lifetimeUsd += cost;
  if (batchId) billedBatchIds = [...billedBatchIds, batchId];
  saveSpend();
  if (runUsd > RUN_COST_LIMIT_USD) {
    throw new Error(
      `STOP: Claude cost for this run is ${formatMoney(runUsd)}, which is above $1.`,
    );
  }
  return runUsd;
}

export function runCostUsd(): number {
  return runUsd;
}

export function lifetimeCostUsd(): number {
  return lifetimeUsd;
}

export function planCost(args: {
  listingCount: number;
  systemTokens: number;
  userTokens: number;
  outputTokens: number;
  batch: boolean;
}): { usage: ClaudeUsage; usd: number } {
  const n = args.listingCount;
  const usage: ClaudeUsage = {
    inputTokens: args.userTokens * n,
    outputTokens: args.outputTokens * n,
    cacheCreationTokens: n > 0 ? args.systemTokens : 0,
    cacheReadTokens: Math.max(0, n - 1) * args.systemTokens,
  };
  return { usage, usd: estimateCostUsd(usage, args.batch) };
}
