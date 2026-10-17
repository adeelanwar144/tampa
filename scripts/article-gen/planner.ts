import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { DROPPED_SLUGS, SLUG_MERGES } from "../../src/config/article-redirects";
import { resolveArticleType } from "./article-type";
import type { PlannerRow } from "./types";
import { PATHS } from "./env";

const SLUG_KEYS = ["slug"];
const TOPIC_KEYS = ["topic", "primary_keyword", "primary keyword"];
const LSI_KEYS = [
  "lsi_keywords",
  "lsi",
  "lsi keywords",
  "supporting keywords",
  "additional semantic keywords to include",
  "semantic keywords",
];
const TARGET_KEYS = ["target keywords (this post)", "target keywords"];
const LINKS_KEYS = ["internal_links", "internal links"];
const NOTES_KEYS = ["notes_file", "notes file", "notes"];
const STATUS_KEYS = ["status"];
const PILLAR_KEYS = ["pillar", "category", "content pillar"];
const TYPE_KEYS = ["article_type", "article type", "type", "post type"];

function norm(value: string): string {
  return value.trim().toLowerCase().replace(/[_/]+/g, " ").replace(/\s+/g, " ");
}

function normalizeSlug(raw: string): string {
  return raw.trim().replace(/^\/+|\/+$/g, "");
}

function splitList(value: string): string[] {
  return value
    .split(/[;,]/)
    .map((part) => part.replace(/\(\s*\d+(?:\.\d+)?\s*\)/g, "").trim())
    .filter(Boolean);
}

function pick(record: Record<string, string>, keys: string[]): string {
  const map = new Map(Object.keys(record).map((key) => [norm(key), record[key] ?? ""]));
  for (const key of keys) {
    const found = map.get(norm(key));
    if (found?.trim()) return found.trim();
  }
  return "";
}

function toRecord(headers: string[], values: unknown[]): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((header, index) => {
    const value = values[index];
    record[header] = value == null ? "" : String(value);
  });
  return record;
}

function rowFromRecord(record: Record<string, string>, rowNumber: number): PlannerRow | null {
  const slugRaw = pick(record, SLUG_KEYS);
  const slug = normalizeSlug(slugRaw);
  const primaryKeyword = pick(record, TOPIC_KEYS);
  const lsi = [...splitList(pick(record, LSI_KEYS)), ...splitList(pick(record, TARGET_KEYS))];
  const uniqueLsi = [...new Set(lsi.filter((word) => word.toLowerCase() !== primaryKeyword.toLowerCase()))];
  if (!slug || !primaryKeyword) return null;
  return {
    rowNumber,
    slug,
    slugRaw,
    primaryKeyword,
    lsiKeywords: uniqueLsi,
    internalLinks: splitList(pick(record, LINKS_KEYS)).map(normalizeSlug),
    notesFile: pick(record, NOTES_KEYS) || undefined,
    status: pick(record, STATUS_KEYS) || undefined,
    pillar: pick(record, PILLAR_KEYS) || undefined,
    articleType: resolveArticleType(
      pick(record, TYPE_KEYS),
      slug,
      primaryKeyword,
      pick(record, PILLAR_KEYS),
    ),
  };
}

export function defaultPlannerPath(): string {
  const csv = join(PATHS.plannerDir, "planner.csv");
  const xlsx = join(PATHS.plannerDir, "planner.xlsx");
  if (existsSync(csv)) return csv;
  if (existsSync(xlsx)) return xlsx;
  throw new Error(
    `No planner found. Put planner.csv or planner.xlsx in ${PATHS.plannerDir}, or pass --planner <path>.`,
  );
}

function loadCsv(path: string): PlannerRow[] {
  const text = readFileSync(path, "utf8");
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relax_column_count: true,
  }) as Record<string, string>[];
  return records
    .map((record, index) => rowFromRecord(record, index + 2))
    .filter((row): row is PlannerRow => Boolean(row));
}

function preferredSheet(names: string[], requested?: string): string {
  if (requested) {
    const match = names.find((name) => name.toLowerCase() === requested.toLowerCase());
    if (!match) throw new Error(`Sheet "${requested}" not found. Available: ${names.join(", ")}`);
    return match;
  }
  return names.find((name) => name.toLowerCase() === "content plan") ?? names[0];
}

function loadXlsx(path: string, sheetName?: string): PlannerRow[] {
  const workbook = XLSX.readFile(path);
  const name = preferredSheet(workbook.SheetNames, sheetName);
  const sheet = workbook.Sheets[name];
  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });
  if (rows.length < 2) return [];
  const headers = (rows[0] ?? []).map((cell) => String(cell ?? ""));
  const out: PlannerRow[] = [];
  rows.slice(1).forEach((values, index) => {
    const row = rowFromRecord(toRecord(headers, values), index + 2);
    if (row) out.push(row);
  });
  return out;
}

function applyMerges(rows: PlannerRow[]): PlannerRow[] {
  const bySlug = new Map(rows.map((row) => [row.slug, row]));
  for (const { keep, drop } of SLUG_MERGES) {
    const keeper = bySlug.get(keep);
    const dropped = bySlug.get(drop);
    if (keeper && dropped) {
      const extra = [dropped.primaryKeyword, ...dropped.lsiKeywords];
      for (const keyword of extra) {
        const exists = keeper.lsiKeywords.some((item) => item.toLowerCase() === keyword.toLowerCase());
        if (!exists && keyword.toLowerCase() !== keeper.primaryKeyword.toLowerCase()) {
          keeper.lsiKeywords.push(keyword);
        }
      }
      for (const link of dropped.internalLinks) {
        if (!keeper.internalLinks.includes(link) && link !== keep) keeper.internalLinks.push(link);
      }
    }
    bySlug.delete(drop);
  }
  return [...bySlug.values()].filter((row) => !DROPPED_SLUGS.has(row.slug));
}

export function loadPlanner(path: string, sheet?: string): PlannerRow[] {
  const resolved = resolve(path);
  if (!existsSync(resolved)) {
    throw new Error(`Planner file not found: ${resolved}`);
  }
  const lower = resolved.toLowerCase();
  let rows: PlannerRow[];
  if (lower.endsWith(".csv")) rows = loadCsv(resolved);
  else if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) rows = loadXlsx(resolved, sheet);
  else throw new Error(`Planner must be .csv or .xlsx: ${resolved}`);
  return applyMerges(rows);
}

function notesPathForSlug(slug: string, notesDir: string, notesFile?: string): string | null {
  if (notesFile) {
    const explicit = resolve(notesDir, notesFile);
    if (existsSync(explicit)) return explicit;
    if (existsSync(notesFile)) return notesFile;
  }
  for (const ext of [".txt", ".md"]) {
    const candidate = join(notesDir, `${slug}${ext}`);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

export function findNotesPath(row: PlannerRow, notesDir: string): string | null {
  return notesPathForSlug(row.slug, notesDir, row.notesFile);
}

export function combineMergedNotes(notesDir: string): void {
  mkdirSync(notesDir, { recursive: true });
  for (const { keep, drop } of SLUG_MERGES) {
    const keepPath = notesPathForSlug(keep, notesDir);
    const dropPath = notesPathForSlug(drop, notesDir);
    if (!dropPath) continue;
    const dropText = readFileSync(dropPath, "utf8").trim();
    if (!dropText) continue;
    const marker = `<!-- merged-from: ${drop} -->`;
    const keepText = keepPath && existsSync(keepPath) ? readFileSync(keepPath, "utf8") : "";
    if (keepText.includes(marker)) continue;
    const dest = keepPath ?? join(notesDir, `${keep}.md`);
    const combined = [keepText.trim(), "", marker, "", `## Notes merged from ${drop}`, "", dropText]
      .filter((part, index, all) => !(part === "" && all[index - 1] === ""))
      .join("\n")
      .trim();
    writeFileSync(dest, `${combined}\n`, "utf8");
  }
}

export function markGenerated(plannerPath: string, slugs: Set<string>): void {
  const resolved = resolve(plannerPath);
  const lower = resolved.toLowerCase();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = join(dirname(resolved), `${basename(resolved, lower.endsWith(".csv") ? ".csv" : ".xlsx")}.backup.${stamp}${lower.endsWith(".csv") ? ".csv" : ".xlsx"}`);
  copyFileSync(resolved, backup);

  if (lower.endsWith(".csv")) {
    const text = readFileSync(resolved, "utf8");
    const records = parse(text, { columns: true, skip_empty_lines: true, bom: true, relax_column_count: true }) as Record<string, string>[];
    const statusKey =
      Object.keys(records[0] ?? {}).find((key) => norm(key) === "status") ?? "status";
    for (const record of records) {
      const slug = normalizeSlug(pick(record, SLUG_KEYS));
      if (slugs.has(slug)) record[statusKey] = "generated";
    }
    const headers = Object.keys(records[0] ?? {});
    const lines = [
      headers.join(","),
      ...records.map((record) =>
        headers
          .map((header) => {
            const value = record[header] ?? "";
            return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
          })
          .join(","),
      ),
    ];
    writeFileSync(resolved, `${lines.join("\n")}\n`, "utf8");
    return;
  }

  const workbook = XLSX.readFile(resolved);
  const name = preferredSheet(workbook.SheetNames);
  const sheet = workbook.Sheets[name];
  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });
  const headers = (rows[0] ?? []).map((cell) => String(cell ?? ""));
  let statusIndex = headers.findIndex((header) => norm(header) === "status");
  if (statusIndex < 0) {
    headers.push("status");
    statusIndex = headers.length - 1;
    rows[0] = headers;
  }
  const slugIndex = headers.findIndex((header) => SLUG_KEYS.includes(norm(header).replaceAll(" ", "_")) || norm(header) === "slug");
  if (slugIndex < 0) return;
  for (const values of rows.slice(1)) {
    const slug = normalizeSlug(String(values[slugIndex] ?? ""));
    if (slugs.has(slug)) values[statusIndex] = "generated";
  }
  workbook.Sheets[name] = XLSX.utils.aoa_to_sheet(rows);
  XLSX.writeFile(workbook, resolved);
}
