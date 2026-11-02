/**
 * Assign curated unused Pexels covers (found via public photo pages; no search API).
 * Writes Pexels CDN URLs into published-articles.json, then run watermark --only articles --apply.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ARTICLES = "src/data/published-articles.json";
const REGISTRY = "output/_used-images.json";
const USED_LIST = "output/used-pexels-ids.json";

/** @type {Record<string, { id: number; photographer: string; alt: string }>} */
const CURATED = {
  "florida-aquarium-tampa": {
    id: 33593384,
    photographer: "Pham Huynh Tuan Vy",
    alt: "Colorful tropical fish swimming among aquatic plants and rocks in a lit aquarium tank",
  },
  "international-plaza-tampa": {
    id: 28532409,
    photographer: "mingche lee",
    alt: "Spacious multi-level shopping mall atrium filled with people under natural light",
  },
  "tampa-international-airport": {
    id: 33598030,
    photographer: "Mingyang LIU",
    alt: "Travelers walking through an airport terminal corridor with luggage carts and suitcases",
  },
  "adventure-island-tampa": {
    id: 19814297,
    photographer: "Aggeliki Siomou",
    alt: "Colorful outdoor water-park slides beside blue pools on a sunny day",
  },
  "skatepark-of-tampa": {
    id: 9940191,
    photographer: "Natalia Kolotvina",
    alt: "Skateboarder riding a concrete bowl at an outdoor skatepark on a sunny day",
  },
  "tampa-flea-market": {
    id: 14379150,
    photographer: "Wendy Wei",
    alt: "Outdoor flea-market stalls and shoppers browsing goods in a city square",
  },
  "terra-gaucha-tampa": {
    id: 31617236,
    photographer: "Gabriel Zachi",
    alt: "Close-up of sliced grilled beef with seasoning at a Brazilian barbecue",
  },
  "rusty-pelican-tampa": {
    id: 17230037,
    photographer: "Zeca Souza",
    alt: "Seaside restaurant tables on a pier overlooking the water at sunset",
  },
  "barrymore-hotel-tampa": {
    id: 18426842,
    photographer: "Erik Mclean",
    alt: "Spacious modern hotel lobby with lounge seating and warm interior lighting",
  },
  "tampa-to-orlando": {
    id: 16610377,
    photographer: 'Yuanda "Darian" Shen',
    alt: "Aerial view of a crowded multi-lane highway cutting through green hills",
  },
  "tampa-to-clearwater": {
    id: 5442161,
    photographer: "Abdullah Almutairi",
    alt: "Clearwater Beach with a lifeguard stand, white sand, and calm Gulf water under blue sky",
  },
  "tampa-museum-of-art": {
    id: 18250525,
    photographer: "Alina Chernii",
    alt: "Art museum gallery interior with visitors viewing paintings on white walls",
  },
  "armature-works-tampa": {
    id: 14075170,
    photographer: "周赛 王",
    alt: "Busy indoor food court with diners at tables near food stalls",
  },
  "tampa-buccaneers": {
    id: 2833722,
    photographer: "K",
    alt: "Aerial view of an empty American football stadium with blue and red seats around the field",
  },
  "tampa-bay-rays": {
    id: 36584176,
    photographer: "Robert Medford",
    alt: "Aerial view of an empty baseball stadium showing the diamond and seating bowl",
  },
  "tropicana-field": {
    id: 39011665,
    photographer: "Doug Manning",
    alt: "Wide view inside a retractable-roof baseball stadium during a game",
  },
  "tampa-rays-schedule": {
    id: 17723978,
    photographer: "Israel Torres",
    alt: "Empty baseball stadium with red seats and a large outfield scoreboard",
  },
  "tampa-bay-lightning": {
    id: 6539267,
    photographer: "Pavel Danilyuk",
    alt: "Empty indoor ice rink with colorful arena seats and overhead steel lights",
  },
  "tampa-lightning-tickets": {
    id: 6541479,
    photographer: "Pavel Danilyuk",
    alt: "Bleacher seating beside an empty indoor ice rink in a sports arena",
  },
  "tampa-map": {
    id: 7634201,
    photographer: "Marina Leonova",
    alt: "Detailed paper map with marked travel routes laid on a wooden table",
  },
  "tampa-tarpons": {
    id: 36584171,
    photographer: "Robert Medford",
    alt: "Aerial view of an empty baseball field and stands on a sunny day",
  },
  "seminole-hard-rock-tampa": {
    id: 14002992,
    photographer: "Jheck Punzalan",
    alt: "Tropical resort at dusk with illuminated pool, palms, and lit buildings",
  },
  "tampa-to-st-petersburg": {
    id: 9400874,
    photographer: "Mikhail Nilov",
    alt: "Long Florida bridge stretching across clear blue bay water",
  },
};

function pexelsUrl(id) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1600`;
}

function photoPage(id) {
  return `https://www.pexels.com/photo/${id}/`;
}

function insertFeatured(body, markdown) {
  const lines = body.split("\n");
  const headingIdx = lines.findIndex((l, i) => i > 0 && /^##\s/.test(l));
  if (headingIdx > 0) {
    return `${lines.slice(0, headingIdx).join("\n").trimEnd()}\n\n${markdown}\n\n${lines.slice(headingIdx).join("\n")}`;
  }
  return `${body.trimEnd()}\n\n${markdown}\n`;
}

const articles = JSON.parse(readFileSync(ARTICLES, "utf8"));
const used = new Set(
  existsSync(USED_LIST)
    ? JSON.parse(readFileSync(USED_LIST, "utf8"))
    : [],
);
const registry = existsSync(REGISTRY) ? JSON.parse(readFileSync(REGISTRY, "utf8")) : {};
for (const id of Object.keys(registry)) used.add(String(id));

const report = [];
const claimed = new Set();

for (const [slug, pick] of Object.entries(CURATED)) {
  const article = articles.find((a) => a.slug === slug);
  if (!article) {
    report.push({ slug, status: "missing-article" });
    continue;
  }
  if (article.coverImage) {
    report.push({ slug, status: "already-has-cover", coverImage: article.coverImage });
    continue;
  }
  const id = String(pick.id);
  if (used.has(id) || claimed.has(id)) {
    report.push({ slug, status: "id-conflict", id });
    continue;
  }
  claimed.add(id);
  used.add(id);
  registry[id] = slug;
  const url = pexelsUrl(pick.id);
  const page = photoPage(pick.id);
  article.coverImage = url;
  article.coverAlt = pick.alt;
  article.coverCredit = `Photo by ${pick.photographer} on Pexels`;
  const md = `![${pick.alt}](${url})\n*Photo by [${pick.photographer}](${page}) on [Pexels](${page})*`;
  if (!article.body.includes(id)) article.body = insertFeatured(article.body, md);
  report.push({
    slug,
    status: "ok",
    id: pick.id,
    photographer: pick.photographer,
    alt: pick.alt,
    image: `/images/wm/articles/${pick.id}.webp`,
    source: page,
  });
  console.log(`OK ${slug} | ${pick.id} | ${pick.photographer}`);
}

mkdirSync("output", { recursive: true });
writeFileSync(ARTICLES, `${JSON.stringify(articles, null, 2)}\n`);
writeFileSync(REGISTRY, `${JSON.stringify(registry, null, 2)}\n`);
writeFileSync("output/pexels-cover-report.json", `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(USED_LIST, `${JSON.stringify([...used].sort((a, b) => Number(a) - Number(b)), null, 2)}\n`);

const failed = report.filter((r) => r.status !== "ok" && r.status !== "already-has-cover");
console.log(`\nAssigned ${report.filter((r) => r.status === "ok").length}; issues ${failed.length}`);
if (failed.length) {
  console.log(failed);
  process.exitCode = 2;
}
