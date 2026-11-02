/**
 * Rewrite wrong-pillar / dead internal links in published-articles.json.
 * npx tsx scripts/article-gen/_fix-broken-internal-links.ts
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const ARTICLES = join(ROOT, "src/data/published-articles.json");

/**
 * Exact path rewrites for live published bodies.
 * Destinations must be live (or pillar indexes) — no rewrite into another 404.
 */
const REWRITES: [string, string][] = [
  ["/guides/tampa-rv-show", "/events/tampa-rv-show"],
  [
    "/things-to-do/trampoline-park-tampa-hillsborough",
    "/events/trampoline-park-tampa-hillsborough",
  ],
  ["/things-to-do/topgolf-tampa", "/events/topgolf-tampa"],
  // map article is still draft — send readers to the live getting-around hub
  ["/guides/tampa-map", "/getting-around"],
  ["/things-to-do/tampa-map", "/getting-around"],
  ["/getting-around/tampa-map", "/getting-around"],
  ["/things-to-do/ybor-city-tampa", "/guides/ybor-city-tampa-fl-33605"],
  ["/guides/riverwalk-hotels", "/guides/tampa-riverwalk-hotels"],
  ["/things-to-do/tampa-riverwalk", "/guides/tampa-riverwalk-hotels"],
  // Batch C hubs not published yet
  ["/guides/tampa-hotels", "/guides/tampa-riverwalk-hotels"],
  ["/events/tampa-events", "/events"],
  ["/things-to-do/tampa-attractions", "/things-to-do/things-to-do-in-tampa"],
  ["/food-and-drink/tampa-restaurants", "/food-and-drink"],
  ["/guides/tampa-florida-overview", "/guides/tampa-population"],
  ["/guides/tampa-area-code", "/guides/tampa-usa-zip-code"],
  ["/guides/tampa-convention-center", "/guides/marriott-water-street-tampa"],
  // other drafts sometimes linked from published pages
  ["/guides/tampa-to-st-petersburg", "/guides/tampa-to-clearwater"],
  ["/guides/seminole-hard-rock-tampa", "/guides"],
];

function applyRewrites(text: string): string {
  let out = text;
  for (const [from, to] of REWRITES) {
    if (from !== to) out = out.split(from).join(to);
  }
  return out;
}

function main() {
  const before = readFileSync(ARTICLES, "utf8");
  const after = applyRewrites(before);
  writeFileSync(ARTICLES, after);
  console.log(before === after ? "No JSON path changes" : "Updated published-articles.json");

  // Only fix wrong-pillar paths in hub/related drafts (keep future hub URLs intact there)
  const draftPillarOnly: [string, string][] = [
    ["/guides/tampa-rv-show", "/events/tampa-rv-show"],
    [
      "/things-to-do/trampoline-park-tampa-hillsborough",
      "/events/trampoline-park-tampa-hillsborough",
    ],
    ["/things-to-do/topgolf-tampa", "/events/topgolf-tampa"],
    ["/guides/tampa-map", "/getting-around/tampa-map"],
    ["/things-to-do/tampa-map", "/getting-around/tampa-map"],
    ["/things-to-do/ybor-city-tampa", "/guides/ybor-city-tampa-fl-33605"],
    ["/guides/riverwalk-hotels", "/guides/tampa-riverwalk-hotels"],
  ];
  const draftFiles = [
    "output/remaining/tampa-attractions/article.md",
    "output/remaining/tampa-restaurants/article.md",
    "output/remaining/tampa-hotels/article.md",
    "output/remaining/tampa-events/article.md",
    "output/remaining/tampa-florida-overview/article.md",
    "output/remaining/trampoline-parks-tampa/article.md",
    "output/remaining/tampa-rv-show/article.md",
    "output/remaining/tampa-riverwalk-hotels/article.md",
    "output/remaining/marriott-water-street-tampa/article.md",
  ];
  for (const rel of draftFiles) {
    const p = join(ROOT, rel);
    if (!existsSync(p)) continue;
    let body = readFileSync(p, "utf8");
    const orig = body;
    for (const [from, to] of draftPillarOnly) body = body.split(from).join(to);
    if (body !== orig) {
      writeFileSync(p, body);
      console.log(`Updated ${rel}`);
    }
  }

  const articles = JSON.parse(readFileSync(ARTICLES, "utf8")) as Array<{
    slug: string;
    pillar: string;
    status: string;
    body?: string;
  }>;
  const live = new Set(
    articles.filter((a) => a.status === "published").map((a) => `/${a.pillar}/${a.slug}`),
  );
  const indexes = new Set([
    "/guides",
    "/events",
    "/things-to-do",
    "/food-and-drink",
    "/getting-around",
    "/shopping",
  ]);
  const linkRe =
    /\]\((\/(?:guides|events|things-to-do|food-and-drink|getting-around|shopping)[^)\s#]*)\)/g;
  const leftover = new Map<string, string[]>();
  for (const a of articles.filter((x) => x.status === "published")) {
    for (const m of String(a.body).matchAll(linkRe)) {
      const url = m[1].replace(/\/$/, "");
      if (indexes.has(url) || live.has(url)) continue;
      if (!leftover.has(url)) leftover.set(url, []);
      leftover.get(url)!.push(a.slug);
    }
  }
  console.log("\nRemaining unpublished targets in published bodies:");
  if (!leftover.size) console.log("  (none)");
  for (const [url, from] of [...leftover.entries()].sort()) {
    console.log(`  ${url}  ←  ${[...new Set(from)].join(", ")}`);
  }
}

main();
