import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PATHS } from "./env";

export type FactEntry = {
  claim: string;
  value: string;
  sourceName: string;
  sourceUrl: string;
  checkedAt: string; // YYYY-MM-DD
};

export type FactPack = {
  slug: string;
  keyword: string;
  checkedAt: string;
  notes: string[];
  facts: FactEntry[];
  /** Free-text tokens (numbers, prices, dates, times) allowed in the article */
  allowedTokens: string[];
};

export function factPackDir(slug: string): string {
  return join(PATHS.outputDir, "remaining", slug);
}

export function factPackPath(slug: string): string {
  return join(factPackDir(slug), "fact-pack.json");
}

export function loadFactPack(slug: string): FactPack {
  const path = factPackPath(slug);
  if (!existsSync(path)) throw new Error(`Missing fact pack: ${path}`);
  return JSON.parse(readFileSync(path, "utf8")) as FactPack;
}

export function saveFactPack(pack: FactPack): void {
  const dir = factPackDir(pack.slug);
  mkdirSync(dir, { recursive: true });
  const withTokens: FactPack = {
    ...pack,
    allowedTokens: buildAllowedTokens(pack),
  };
  writeFileSync(factPackPath(pack.slug), `${JSON.stringify(withTokens, null, 2)}\n`, "utf8");
}

/** Extract comparable numeric/date/time/price tokens from note + fact pack values. */
export function extractClaimTokens(text: string): string[] {
  const tokens = new Set<string>();
  const patterns = [
    /\$\d[\d,]*(?:\.\d{1,2})?/g,
    /\b\d{1,2}:\d{2}\s*(?:a\.?m\.?|p\.?m\.?)/gi,
    /\b\d{1,2}\s*(?:a\.?m\.?|p\.?m\.?)/gi,
    /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,\s*\d{4})?\b/gi,
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
    /\b20\d{2}\b/g,
    /\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/g,
    /\b\d+\.\d+\b/g,
    /\b\d+\b/g,
  ];
  for (const re of patterns) {
    for (const match of text.matchAll(re)) {
      tokens.add(normalizeToken(match[0]));
    }
  }
  return [...tokens].filter(Boolean);
}

export function normalizeToken(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\$/g, "")
    .replace(/,/g, "")
    .replace(/\.(?=\s|$)/g, "")
    .trim();
}

export function buildAllowedTokens(pack: FactPack, noteText = ""): string[] {
  const blob = [
    noteText,
    ...pack.facts.map((f) => `${f.claim} ${f.value}`),
    ...pack.allowedTokens,
  ].join("\n");
  return [...new Set(extractClaimTokens(blob))];
}

export function formatFactPackForPrompt(pack: FactPack): string {
  const lines = pack.facts.map(
    (f, i) =>
      `${i + 1}. ${f.claim}: ${f.value}\n   Source: ${f.sourceName} — ${f.sourceUrl}\n   Checked: ${f.checkedAt}`,
  );
  return `FACT PACK for ${pack.slug} (keyword: ${pack.keyword})\nChecked: ${pack.checkedAt}\n\n${lines.join("\n\n")}`;
}
