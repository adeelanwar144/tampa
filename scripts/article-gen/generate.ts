import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { join } from "node:path";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { ClaudeClient, FORMAT_REMINDER, addUsage, estimateCostUsd, parseArticle } from "./claude_client";
import { PATHS, modelId, requireUtf8 } from "./env";
import { SKIP_GENERATE_SLUGS, SLUG_MERGES } from "../../src/config/article-redirects";
import { defaultPlannerPath, combineMergedNotes, findNotesPath, loadPlanner, markGenerated } from "./planner";
import { auditPrompt, revisionPrompt, systemPrompt, userPrompt } from "./prompts";
import { replacePlaceholders } from "./pexels";
import { articleDir, writeArticle, writeFailed } from "./output";
import type { ClaudeUsage, GenerateOptions, ModelChoice, ParsedArticle, PlannerRow, RunLog } from "./types";
import { failingChecks, itemCount, runChecks, wordCount } from "./validator";

function parseCli(argv: string[]): GenerateOptions {
  const { values } = parseArgs({
    args: argv,
    options: {
      model: { type: "string", default: "sonnet" },
      slug: { type: "string", multiple: true, default: [] },
      limit: { type: "string" },
      force: { type: "boolean", default: false },
      "dry-run": { type: "boolean", default: false },
      "no-images": { type: "boolean", default: false },
      "download-images": { type: "boolean", default: false },
      audit: { type: "boolean", default: false },
      "images-only": { type: "boolean", default: false },
      concurrency: { type: "string", default: "1" },
      planner: { type: "string" },
      "notes-dir": { type: "string" },
      sheet: { type: "string" },
    },
    allowPositionals: false,
  });
  const model = (values.model ?? "sonnet") as ModelChoice;
  if (model !== "sonnet" && model !== "haiku") {
    throw new Error('--model must be "sonnet" or "haiku"');
  }
  const concurrency = Math.min(3, Math.max(1, Number(values.concurrency ?? 1) || 1));
  return {
    model,
    slugs: (values.slug ?? []).map((slug) => slug.replace(/^\/+|\/+$/g, "")),
    limit: values.limit ? Number(values.limit) : undefined,
    force: Boolean(values.force),
    dryRun: Boolean(values["dry-run"]),
    noImages: Boolean(values["no-images"]),
    downloadImages: Boolean(values["download-images"]),
    imagesOnly: Boolean(values["images-only"]),
    audit: Boolean(values.audit),
    concurrency,
    plannerPath: values.planner,
    notesDir: values["notes-dir"] ?? PATHS.notesDir,
    sheet: values.sheet,
  };
}

function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

function summaryLine(log: RunLog, status: "passed" | "review" | "failed"): string {
  const mark = status === "failed" ? "✗" : "✓";
  return `${mark} ${log.slug} | ${log.model.includes("haiku") ? "haiku" : "sonnet"} | ${log.wordCount.toLocaleString("en-US")} words | ${log.itemCount} items | checks: ${status} | ${log.images} images | ~${formatMoney(log.estimatedCostUsd)}`;
}

async function pool<T>(items: T[], n: number, worker: (item: T) => Promise<void>): Promise<void> {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(n, queue.length) }, async () => {
      while (queue.length) {
        const item = queue.shift();
        if (item) await worker(item);
      }
    }),
  );
}

async function generateOne(
  row: PlannerRow,
  notes: string,
  instructions: string,
  options: GenerateOptions,
  client: ClaudeClient,
): Promise<{ log: RunLog; ok: boolean }> {
  const model = modelId(options.model);
  const system = systemPrompt(instructions);
  const user = userPrompt(row, notes, new Date());
  let usage: ClaudeUsage = {
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationTokens: 0,
    cacheReadTokens: 0,
  };
  const startedAt = new Date().toISOString();
  const messages: MessageParam[] = [{ role: "user", content: user }];

  const call = async (next: MessageParam[]) => {
    const result = await client.complete({ model, system, messages: next });
    usage = addUsage(usage, result.usage);
    return result.text;
  };

  let raw = await call(messages);
  let parsed = parseArticle(raw);
  if ("error" in parsed) {
    messages.push({ role: "assistant", content: raw }, { role: "user", content: FORMAT_REMINDER });
    raw = await call(messages);
    parsed = parseArticle(raw);
  }
  if ("error" in parsed) {
    writeFailed(row.slug, raw);
    const log: RunLog = {
      slug: row.slug,
      model,
      startedAt,
      finishedAt: new Date().toISOString(),
      usage,
      estimatedCostUsd: estimateCostUsd(model, usage),
      checks: [],
      revisions: 0,
      remainingFailures: [parsed.error],
      images: 0,
      wordCount: 0,
      itemCount: 0,
    };
    return { log, ok: false };
  }

  let article = parsed as ParsedArticle;
  messages.length = 0;
  messages.push({ role: "user", content: user }, { role: "assistant", content: article.raw });

  let checks = runChecks(article, row, notes);
  let revisions = 0;
  while (failingChecks(checks).length > 0 && revisions < 2) {
    revisions += 1;
    const failures = failingChecks(checks).map((item) => `${item.name}: ${item.detail}`);
    messages.push({ role: "user", content: revisionPrompt(failures) });
    raw = await call(messages);
    const next = parseArticle(raw);
    if ("error" in next) {
      messages.push({ role: "assistant", content: raw }, { role: "user", content: FORMAT_REMINDER });
      raw = await call(messages);
      const retry = parseArticle(raw);
      if ("error" in retry) break;
      article = retry;
    } else {
      article = next;
    }
    messages.push({ role: "assistant", content: article.raw });
    checks = runChecks(article, row, notes);
  }

  if (options.audit) {
    const haiku = modelId("haiku");
    const auditRaw = await client.complete({
      model: haiku,
      system: "You fact-check travel articles against private notes. Return JSON only.",
      messages: [{ role: "user", content: auditPrompt(article.article, notes) }],
    });
    usage = addUsage(usage, auditRaw.usage);
    article = {
      ...article,
      editorNotes: `${article.editorNotes.trim()}\n\n## Haiku fact audit\n\n${auditRaw.text.trim()}\n`,
    };
  }

  let withImages = article.article;
  let images: Awaited<ReturnType<typeof replacePlaceholders>>["images"] = [];
  let leftover: string[] = [];
  if (!options.noImages) {
    const replaced = await replacePlaceholders(article.article, {
      slug: row.slug,
      primaryKeyword: row.primaryKeyword,
      category: row.pillar,
      downloadDir: options.downloadImages ? join(articleDir(row.slug), "images") : undefined,
    });
    withImages = replaced.article;
    images = replaced.images;
    leftover = replaced.leftover;
  }

  const remaining = failingChecks(checks).map((item) => `${item.name}: ${item.detail}`);
  const log: RunLog = {
    slug: row.slug,
    model,
    startedAt,
    finishedAt: new Date().toISOString(),
    usage,
    estimatedCostUsd: estimateCostUsd(model, usage),
    checks,
    revisions,
    remainingFailures: remaining,
    images: images.filter((image) => !image.skipped).length,
    wordCount: wordCount(article.article),
    itemCount: itemCount(article.article),
  };
  writeArticle({ slug: row.slug, parsed: article, withImages, images, leftover, log });
  return { log, ok: remaining.length === 0 };
}

function outputSlugs(): string[] {
  if (!existsSync(PATHS.outputDir)) return [];
  return readdirSync(PATHS.outputDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(PATHS.outputDir, entry.name, "article.raw.md")))
    .map((entry) => entry.name);
}

function patchMissingImages(slug: string, leftover: string[]): void {
  const notesPath = join(articleDir(slug), "editor-notes.md");
  if (!existsSync(notesPath)) return;
  const existing = readFileSync(notesPath, "utf8").replace(/\n## Missing images[\s\S]*$/m, "").trimEnd();
  const block =
    leftover.length > 0
      ? `\n\n## Missing images\n\n${leftover.map((item) => `- ${item}`).join("\n")}\n`
      : "\n";
  writeFileSync(notesPath, `${existing}${block}`, "utf8");
}

async function rerunImages(options: GenerateOptions): Promise<void> {
  const wanted = new Set(options.slugs);
  let slugs = outputSlugs().filter(
    (slug) => !SKIP_GENERATE_SLUGS.has(slug) && (wanted.size === 0 || wanted.has(slug)),
  );
  if (options.limit) slugs = slugs.slice(0, options.limit);
  if (slugs.length === 0) {
    console.log("No articles with article.raw.md to re-image.");
    return;
  }

  const pillarBySlug = new Map<string, string>();
  try {
    for (const row of loadPlanner(options.plannerPath ?? defaultPlannerPath(), options.sheet)) {
      if (row.pillar) pillarBySlug.set(row.slug, row.pillar);
    }
  } catch {
    // Category is optional; subject type still infers from slug and keyword.
  }

  mkdirSync(PATHS.outputDir, { recursive: true });
  const featured: {
    slug: string;
    id?: number;
    query?: string;
    pexelsAlt?: string;
    fallback?: boolean;
    skipped?: string;
  }[] = [];

  for (const slug of slugs) {
    const dir = articleDir(slug);
    const raw = requireUtf8(join(dir, "article.raw.md"), "raw article");
    const seo = existsSync(join(dir, "seo.json"))
      ? (JSON.parse(readFileSync(join(dir, "seo.json"), "utf8")) as { primary_keyword?: string })
      : {};
    try {
      const replaced = await replacePlaceholders(raw, {
        slug,
        primaryKeyword: seo.primary_keyword,
        category: pillarBySlug.get(slug),
        downloadDir: options.downloadImages ? join(dir, "images") : undefined,
      });
      writeFileSync(join(dir, "article.md"), replaced.article, "utf8");
      writeFileSync(join(dir, "images.json"), `${JSON.stringify(replaced.images, null, 2)}\n`, "utf8");
      patchMissingImages(slug, replaced.leftover);
      const cover = replaced.images.find((image) => image.url && !image.skipped);
      featured.push({
        slug,
        id: cover?.id,
        query: cover?.query,
        pexelsAlt: cover?.pexelsAlt,
        fallback: cover?.fallback,
        skipped: cover ? undefined : "no featured image",
      });
      console.log(
        cover
          ? `✓ ${slug} | featured ${cover.id} | query="${cover.query}" | pexelsAlt="${cover.pexelsAlt ?? ""}"${cover.fallback ? " | LAST-RESORT" : ""}`
          : `✗ ${slug} | no featured image`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      featured.push({ slug, skipped: message });
      console.error(`✗ ${slug} | ${message}`);
    }
  }

  console.log("\nFeatured images:");
  for (const item of featured) {
    console.log(
      `${item.slug}\tquery=${item.query ?? ""}\tpexelsAlt=${item.pexelsAlt ?? ""}\tfallback=${item.fallback ? "yes" : "no"}\t${item.id ?? item.skipped ?? "none"}`,
    );
  }
}

async function main(): Promise<void> {
  const options = parseCli(process.argv.slice(2));
  if (options.imagesOnly) {
    await rerunImages(options);
    return;
  }
  const instructions = requireUtf8(PATHS.instructions, "content instructions");
  const plannerPath = options.plannerPath ?? defaultPlannerPath();
  combineMergedNotes(options.notesDir);
  const rows = loadPlanner(plannerPath, options.sheet);
  if (rows.length === 0) {
    throw new Error(`Planner has no usable rows: ${plannerPath}`);
  }

  const wanted = new Set(options.slugs);
  for (const slug of wanted) {
    const merge = SLUG_MERGES.find((pair) => pair.drop === slug);
    if (merge) console.warn(`Skipping ${slug}: merged into ${merge.keep} (301 redirect).`);
    if (slug === "zach-bryan-tampa") {
      console.warn("Skipping zach-bryan-tampa: no Tampa concert date in the notes.");
    }
  }
  if (wanted.size === 0) {
    console.warn("Skipping zach-bryan-tampa: no Tampa concert date in the notes.");
  }
  const selected: PlannerRow[] = [];
  for (const row of rows) {
    if (SKIP_GENERATE_SLUGS.has(row.slug)) continue;
    if (wanted.size && !wanted.has(row.slug)) continue;
    const status = row.status?.toLowerCase();
    if (!options.force && (status === "done" || status === "published")) {
      console.warn(`Skipping ${row.slug}: status is ${row.status}`);
      continue;
    }
    if (!options.force && existsSync(join(articleDir(row.slug), "article.md"))) {
      console.warn(`Skipping ${row.slug}: output already exists (use --force)`);
      continue;
    }
    const notesPath = findNotesPath(row, options.notesDir);
    if (!notesPath) {
      console.warn(`Skipping ${row.slug}: missing notes file in ${options.notesDir}`);
      continue;
    }
    selected.push({ ...row, notesFile: notesPath });
    if (options.limit && selected.length >= options.limit) break;
  }

  if (options.dryRun) {
    const row = selected[0];
    if (!row) {
      console.log("No matching rows to dry-run.");
      return;
    }
    const notes = requireUtf8(row.notesFile!, "notes");
    console.log("=== SYSTEM PROMPT ===\n");
    console.log(systemPrompt(instructions));
    console.log("\n=== USER PROMPT ===\n");
    console.log(userPrompt(row, notes, new Date()));
    return;
  }

  mkdirSync(PATHS.outputDir, { recursive: true });
  const client = new ClaudeClient();
  const totals = { done: 0, failed: 0, skipped: rows.length - selected.length, usage: {
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationTokens: 0,
    cacheReadTokens: 0,
  } as ClaudeUsage, cost: 0 };
  const generated = new Set<string>();

  await pool(selected, options.concurrency, async (row) => {
    const notes = requireUtf8(row.notesFile!, "notes");
    try {
      const { log, ok } = await generateOne(row, notes, instructions, options, client);
      totals.usage = addUsage(totals.usage, log.usage);
      totals.cost += log.estimatedCostUsd;
      if (ok) {
        totals.done += 1;
        generated.add(row.slug);
        console.log(summaryLine(log, "passed"));
      } else if (log.wordCount > 0) {
        totals.done += 1;
        generated.add(row.slug);
        console.log(summaryLine(log, "review"));
      } else {
        totals.failed += 1;
        console.log(summaryLine(log, "failed"));
      }
      const failed = log.checks.filter((check) => !check.ok);
      if (failed.length) {
        for (const check of failed) {
          console.log(`    ${check.warnOnly ? "warn" : "fail"} ${check.name}: ${check.detail}`);
        }
      }
    } catch (error) {
      totals.failed += 1;
      const message = error instanceof Error ? error.message : "unknown error";
      console.error(`✗ ${row.slug} | ${message}`);
    }
  });

  if (generated.size > 0) {
    try {
      markGenerated(plannerPath, generated);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      console.warn(`Could not update planner status: ${message}`);
    }
  }

  console.log(
    `\nDone ${totals.done}, failed ${totals.failed}, skipped ${totals.skipped}. Tokens in ${totals.usage.inputTokens.toLocaleString("en-US")} / out ${totals.usage.outputTokens.toLocaleString("en-US")} / cache ${totals.usage.cacheReadTokens.toLocaleString("en-US")} read. ~${formatMoney(totals.cost)}`,
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "unknown error";
  console.error(message);
  process.exitCode = 1;
});
