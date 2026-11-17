import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { markdownToHtml } from "./listing-content/markdown.ts";
import { getIndex, putIndex, putRecord } from "./listing-content/r2.ts";

const slugs = process.argv.slice(2);
if (slugs.length === 0) {
  console.error("Usage: node scripts/publish-place-drafts.mjs slug ...");
  process.exit(1);
}

function words(markdown) {
  const text = markdown.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[#>*_`]/g, " ");
  return text.split(/\s+/).filter(Boolean).length;
}

function upsert(index, record) {
  const entry = {
    slug: record.slug,
    wordCount: record.wordCount,
    needsReview: record.needsReview,
    inputHash: record.inputHash,
    generatedAt: record.generatedAt,
  };
  const next = index.filter((item) => item.slug !== record.slug);
  next.push(entry);
  next.sort((a, b) => a.slug.localeCompare(b.slug));
  return next;
}

let index = await getIndex();
for (const slug of slugs) {
  const markdown = readFileSync(join("content/places/drafts", `${slug}.md`), "utf8").trim();
  const pack = JSON.parse(readFileSync(join("content/places/fact-packs", `${slug}.json`), "utf8"));
  const publish = pack.publish;
  if (!publish?.hoursMode || !publish.schemaType) {
    throw new Error(`${slug} is missing publish.hoursMode or publish.schemaType`);
  }
  const generatedAt = new Date().toISOString();
  const record = {
    slug,
    name: pack.name,
    primaryKeyword: `${pack.name} ${pack.category}`,
    secondaryKeywords: [pack.neighborhood, pack.city].filter(Boolean),
    metaTitle: pack.metaTitle,
    metaDescription: pack.metaDescription,
    contentMarkdown: markdown,
    contentHtml: markdownToHtml(markdown),
    faq: pack.faq ?? [],
    wordCount: words(markdown),
    headingCount: (markdown.match(/^##\s+/gm) ?? []).length,
    needsReview: false,
    reviewReasons: [],
    inputHash: createHash("sha256").update(markdown).digest("hex"),
    model: "grok-4.7",
    tokens: { input: 0, output: 0, cacheRead: 0 },
    generatedAt,
    hoursMode: publish.hoursMode,
    ...(publish.openingHours ? { openingHours: publish.openingHours } : {}),
    ...(publish.hoursNote ? { hoursNote: publish.hoursNote } : {}),
    schemaType: publish.schemaType,
  };
  await putRecord(record);
  index = upsert(index, record);
  console.log(`published ${slug} ${record.wordCount} words ${record.hoursMode}`);
}
await putIndex(index);
console.log(`index ${index.length}`);
