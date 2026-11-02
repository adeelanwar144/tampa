import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Article = { slug: string; pillar: string; status: string; body?: string };
type Note = { file: string };

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

function words(body: string): number {
  return body.trim().split(/\s+/).filter(Boolean).length;
}

const notes = JSON.parse(
  readFileSync(join(process.cwd(), "tmp-notes-summary.json"), "utf8"),
) as Note[];
const articles = JSON.parse(
  readFileSync(join(process.cwd(), "src/data/published-articles.json"), "utf8"),
) as Article[];
const bySlug = new Map(articles.map((a) => [a.slug, a]));

const map: Record<string, string | null> = {
  "the-barrymore-hotel-tampa-riverwalk.txt": "barrymore-hotel-tampa",
  "the-kennedy-club-tampa.txt": "kennedy-soho-tampa",
  "texas-de-brazil-restaurant-tampa-fl.txt": "texas-de-brazil-tampa",
  "terra-gaucha-brazilian-steakhouse-tampa-fl.txt": "terra-gaucha-tampa",
  "tampa.txt": "tampa-florida-overview",
  "tampa-water-park.txt": "adventure-island-tampa",
  "tampa-trampoline-place.txt": "trampoline-parks-tampa",
  "tampa-usa-zip-code.txt": "tampa-usa-zip-code",
  "tampa-to-orlando.txt": "tampa-to-orlando",
  "tampa-to-st-petersburg.txt": "tampa-to-st-petersburg",
  "tampa-to-miami.txt": "tampa-to-miami",
  "tampa-to-clearwater.txt": "tampa-to-clearwater",
  "tampa-to-fort-myers.txt": "tampa-to-fort-myers",
  "tampa-tarpons.txt": "tampa-tarpons",
  "tampa-rv-show-2026.txt": "tampa-rv-show",
  "tampa-stadium.txt": "tampa-stadium-guide",
  "tampa-riverwalk-hotels.txt": "tampa-riverwalk-hotels",
  "tampa-florida-usa.txt": "tampa-florida-overview",
  "tampa-lightning-tickets.txt": "tampa-lightning-tickets",
  "tampa-rays.txt": "tampa-bay-rays",
  "tampa-rays-schedule.txt": "tampa-rays-schedule",
  "tampa-rays-stadium.txt": "tropicana-field",
  "tampa-rays-baseball-schedule.txt": "tampa-rays-schedule",
  "tampa-rays-game-today.txt": "tampa-rays-schedule",
  "tampa-population.txt": "tampa-population",
  "tampa-rays-baseball-game.txt": "tampa-bay-rays",
  "tampa-marriott-water-street.txt": "marriott-water-street-tampa",
  "tampa-museum-of-art.txt": "tampa-museum-of-art",
  "tampa-mall.txt": "international-plaza-tampa",
  "tampa-map.txt": "tampa-map",
  "tampa-lightning.txt": "tampa-bay-lightning",
  "tampa-international-airport-tpa-guide.txt": "tampa-international-airport",
  "tampa-hotels.txt": "tampa-hotels",
  "tampa-gun-show.txt": null,
  "tampa-heights-armature-works.txt": "armature-works-tampa",
  "tampa-florida-ybor.txt": "ybor-city-tampa-fl-33605",
  "tampa-flea-market-tampa-fl.txt": "tampa-flea-market",
  "tampa-fl-zip-code-hillsborough-county.txt": "zip-code-hillsborough-tampa-fl",
  "tampa-florida-phone-code.txt": "tampa-area-code",
  "tampa-fl-phone-area-code.txt": "tampa-area-code",
  "tampa-events.txt": "tampa-events",
  "tampa-aquarium.txt": "florida-aquarium-tampa",
  "tampa-bucs.txt": "tampa-buccaneers",
  "rusty-pelican-tampa.txt": "rusty-pelican-tampa",
  "seminole-hard-rock-tampa.txt": "seminole-hard-rock-tampa",
  "skatepark-of-tampa.txt": "skatepark-of-tampa",
  "tampa-attractions.txt": "tampa-attractions",
  "tampa-eateries.txt": "tampa-restaurants",
  "tampa-en-floride.txt": "tampa-florida-overview",
  "tampa-convention-center.txt": "tampa-convention-center",
};

const mergedNotes = new Set([
  "tampa-florida-usa.txt",
  "tampa-en-floride.txt",
  "tampa-rays-baseball-schedule.txt",
  "tampa-rays-game-today.txt",
  "tampa-rays-baseball-game.txt",
  "tampa-fl-phone-area-code.txt",
  "tampa-trampoline-place.txt",
]);

const rows: string[] = ["note | slug | status | words | URL"];
for (const n of notes) {
  const file = n.file;
  if (file === "tampa-gun-show.txt") {
    rows.push(`${file} | — | skipped (not in publish plan) | — | —`);
    continue;
  }
  if (file === "the-kennedy-club-tampa.txt") {
    const held = readFileSync("output/remaining/kennedy-soho-tampa/article.md", "utf8");
    rows.push(
      `${file} | kennedy-soho-tampa | held — open/closed status unconfirmed | ${words(held)} | —`,
    );
    continue;
  }
  const slug = map[file];
  if (!slug) {
    rows.push(`${file} | — | skipped (unmapped) | — | —`);
    continue;
  }
  const a = bySlug.get(slug);
  if (!a) {
    rows.push(`${file} | ${slug} | missing | — | —`);
    continue;
  }
  const status = mergedNotes.has(file)
    ? `merged into ${slug}; published`
    : a.status === "published"
      ? "published"
      : a.status;
  const url = `https://visitintampa.com${pathFor(a.pillar, a.slug)}`;
  rows.push(`${file} | ${slug} | ${status} | ${words(String(a.body || ""))} | ${url}`);
}

const out = join(process.cwd(), "output/remaining/_final-50-notes-report.md");
writeFileSync(out, `${rows.join("\n")}\n`);
console.log(rows.join("\n"));
console.log(`\nWrote ${out}`);
