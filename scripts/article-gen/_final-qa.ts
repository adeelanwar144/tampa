/**
 * Final QA: 404 internal links, missing covers, sitemap path sanity.
 * npx tsx scripts/article-gen/_final-qa.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

type Article = {
  slug: string;
  pillar: string;
  status: string;
  body?: string;
  coverImage?: string;
  coverCredit?: string;
};

function pathFor(pillar: string, slug: string): string {
  switch (pillar) {
    case "events":
      return `/events/${slug}`;
    case "things-to-do":
      return `/things-to-do/${slug}`;
    case "food-and-drink":
      return `/food-and-drink/${slug}`;
    case "getting-around":
      return `/getting-around/${slug}`;
    case "shopping":
      return `/shopping/${slug}`;
    default:
      return `/guides/${slug}`;
  }
}

const articles = JSON.parse(
  readFileSync(join(process.cwd(), "src/data/published-articles.json"), "utf8"),
) as Article[];
const published = articles.filter((a) => a.status === "published");
const live = new Set(published.map((a) => pathFor(a.pillar, a.slug)));
const indexes = new Set([
  "/guides",
  "/events",
  "/things-to-do",
  "/food-and-drink",
  "/getting-around",
  "/shopping",
  "/places",
  "/neighborhoods",
  "/directory",
]);
const linkRe =
  /\]\((\/(?:guides|events|things-to-do|food-and-drink|getting-around|shopping)[^)\s#]*)\)/g;

const bad = new Map<string, string[]>();
for (const a of published) {
  if (!a.coverImage) console.log("NO COVER", a.slug);
  if (!a.coverCredit) console.log("NO CREDIT", a.slug);
  for (const m of String(a.body).matchAll(linkRe)) {
    const url = m[1].replace(/\/$/, "");
    if (indexes.has(url) || live.has(url)) continue;
    if (!bad.has(url)) bad.set(url, []);
    bad.get(url)!.push(a.slug);
  }
}
console.log("Published:", published.length);
console.log("Broken internal targets:", bad.size);
for (const [u, from] of [...bad.entries()].sort()) {
  console.log(`  ${u} ← ${[...new Set(from)].join(", ")}`);
}
