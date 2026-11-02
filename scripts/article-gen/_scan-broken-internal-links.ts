/**
 * Scan published articles + draft output for internal pillar links that 404.
 * npx tsx scripts/article-gen/_scan-broken-internal-links.ts
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

type Article = {
  slug: string;
  pillar: string;
  status: string;
  body?: string;
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
    case "outdoors-beaches":
      return `/outdoors-beaches/${slug}`;
    default:
      return `/guides/${slug}`;
  }
}

const INDEX_PATHS = new Set([
  "/guides",
  "/events",
  "/things-to-do",
  "/food-and-drink",
  "/getting-around",
  "/shopping",
  "/outdoors-beaches",
  "/places",
  "/neighborhoods",
  "/directory",
]);

const linkRe =
  /\]\((\/(?:guides|events|things-to-do|food-and-drink|getting-around|shopping|outdoors-beaches|places|neighborhoods|directory)[^)\s#]*)/g;

function walkFiles(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkFiles(p, out);
    else if (/\.(md|json|tsx?|jsx?)$/.test(name)) out.push(p);
  }
  return out;
}

function main() {
  const articles = JSON.parse(
    readFileSync(join(ROOT, "src/data/published-articles.json"), "utf8"),
  ) as Article[];

  const bySlug = new Map<string, string>();
  const publishedPaths = new Set<string>();
  for (const a of articles) {
    const p = pathFor(a.pillar, a.slug);
    bySlug.set(a.slug, p);
    if (a.status === "published") publishedPaths.add(p);
  }

  type Hit = { where: string; url: string };
  const hits: Hit[] = [];
  const seen = new Set<string>();

  function scan(text: string, where: string) {
    for (const m of text.matchAll(linkRe)) {
      const url = m[1].replace(/\/$/, "");
      const key = `${where}=>${url}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (INDEX_PATHS.has(url)) continue;
      hits.push({ where, url });
    }
  }

  for (const a of articles) {
    if (a.body) scan(a.body, `published:${a.slug}`);
  }

  for (const file of [
    ...walkFiles(join(ROOT, "output/remaining")),
    ...walkFiles(join(ROOT, "src")),
    ...walkFiles(join(ROOT, "scripts/article-gen")),
  ]) {
    try {
      scan(readFileSync(file, "utf8"), file.replace(ROOT + "\\", "").replace(ROOT + "/", ""));
    } catch {
      /* skip */
    }
  }

  type Row = {
    url: string;
    correct: string | null;
    publishedOk: boolean;
    wheres: string[];
  };
  const byUrl = new Map<string, Row>();
  for (const h of hits) {
    const slug = h.url.split("/").pop() ?? "";
    const correct = bySlug.get(slug) ?? null;
    const publishedOk = publishedPaths.has(h.url);
    if (!byUrl.has(h.url)) {
      byUrl.set(h.url, { url: h.url, correct, publishedOk, wheres: [] });
    }
    byUrl.get(h.url)!.wheres.push(h.where);
  }

  const broken = [...byUrl.values()]
    .filter((r) => !r.publishedOk)
    .sort((a, b) => a.url.localeCompare(b.url));

  const wrongPillar = broken.filter((r) => r.correct && r.correct !== r.url);
  const unknown = broken.filter((r) => !r.correct);
  const draftOnly = broken.filter(
    (r) => r.correct === r.url && !publishedPaths.has(r.url),
  );

  console.log(`Total unique internal pillar links found: ${byUrl.size}`);
  console.log(`Not a published path: ${broken.length}`);
  console.log(`\nWrong pillar (slug exists elsewhere): ${wrongPillar.length}`);
  for (const r of wrongPillar) {
    console.log(`  ${r.url}  →  ${r.correct}`);
    console.log(`    from: ${[...new Set(r.wheres)].slice(0, 8).join(" | ")}`);
  }
  console.log(`\nDraft / unpublished (correct path, not live): ${draftOnly.length}`);
  for (const r of draftOnly) {
    console.log(`  ${r.url}`);
  }
  console.log(`\nUnknown slug: ${unknown.length}`);
  for (const r of unknown) {
    console.log(`  ${r.url}`);
    console.log(`    from: ${[...new Set(r.wheres)].slice(0, 6).join(" | ")}`);
  }
}

main();
