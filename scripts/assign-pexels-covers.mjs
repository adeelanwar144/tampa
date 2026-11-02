/**
 * Assign unique Pexels featured images to articles missing coverImage.
 * Keeps API usage low (1–2 searches per article) to avoid hourly 429s.
 * Leaves Pexels URLs for `npx tsx scripts/watermark.ts --only articles --apply`.
 */
import { config } from "dotenv";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env"), quiet: true });

const ROOT = process.cwd();
const ARTICLES = join(ROOT, "src/data/published-articles.json");
const REGISTRY = join(ROOT, "output/_used-images.json");

const ASSIGNMENTS = {
  "florida-aquarium-tampa": {
    alt: "Colorful tropical fish swimming past coral in a large public aquarium tank",
    queries: ["tropical fish aquarium tank", "aquarium underwater fish"],
  },
  "international-plaza-tampa": {
    alt: "Bright multi-level shopping mall interior with stores and skylights",
    queries: ["shopping mall atrium interior", "luxury shopping mall"],
  },
  "tampa-international-airport": {
    alt: "Busy airport terminal concourse with travelers walking past gate areas",
    queries: ["airport terminal concourse", "airport departure hall"],
  },
  "adventure-island-tampa": {
    alt: "Bright water park slides emptying into a blue pool on a sunny day",
    queries: ["water park slides pool", "waterpark summer slides"],
  },
  "skatepark-of-tampa": {
    alt: "Skateboarder carving a turn in a concrete outdoor skatepark bowl",
    queries: ["skatepark skateboard bowl", "skateboarder skate park"],
  },
  "tampa-flea-market": {
    alt: "Outdoor flea market stalls with shoppers browsing under canopy tents",
    queries: ["outdoor flea market", "open air market stalls"],
  },
  "terra-gaucha-tampa": {
    alt: "Sliced grilled steak and meat skewers served at a steakhouse table",
    queries: ["grilled steak skewers", "brazilian churrasco meat"],
  },
  "rusty-pelican-tampa": {
    alt: "Seafood plates on a waterfront restaurant table beside the bay",
    queries: ["waterfront seafood restaurant", "seafood dinner ocean view"],
  },
  "barrymore-hotel-tampa": {
    alt: "Modern hotel lobby seating with soft lighting and polished floors",
    queries: ["hotel lobby interior", "boutique hotel lobby"],
  },
  "tampa-to-orlando": {
    alt: "Multi-lane Florida interstate highway lined with trees under blue sky",
    queries: ["Florida interstate highway", "highway road trip florida"],
  },
  "tampa-to-clearwater": {
    alt: "White sand Gulf beach with turquoise water and a clear sky",
    queries: ["Florida gulf beach sand", "clearwater beach florida"],
  },
  "tampa-museum-of-art": {
    alt: "Wide contemporary art museum gallery with framed works on white walls",
    queries: ["art museum gallery", "contemporary museum interior"],
  },
  "armature-works-tampa": {
    alt: "Industrial food hall with hanging lights, stalls, and shared tables",
    queries: ["food hall interior", "industrial market dining"],
  },
  "tampa-buccaneers": {
    alt: "American football stadium with green turf and empty grandstand seats",
    queries: ["american football stadium", "football stadium field"],
  },
  "tampa-bay-rays": {
    alt: "Baseball diamond and outfield grass seen from the lower seating bowl",
    queries: ["baseball stadium field", "mlb baseball diamond"],
  },
  "tropicana-field": {
    alt: "Covered baseball stadium seating bowl surrounding a lit diamond",
    queries: ["indoor baseball stadium", "baseball stadium lights"],
  },
  "tampa-rays-schedule": {
    alt: "Baseball scoreboard glowing above a stadium field at dusk",
    queries: ["baseball scoreboard stadium", "baseball stadium night"],
  },
  "tampa-bay-lightning": {
    alt: "Ice hockey rink centered in a brightly lit indoor sports arena",
    queries: ["ice hockey arena rink", "hockey stadium ice"],
  },
  "tampa-lightning-tickets": {
    alt: "Rows of arena seats looking down toward a hockey ice surface",
    queries: ["hockey arena seats", "sports arena seating"],
  },
  "tampa-map": {
    alt: "Paper city map spread open with a pen marking travel routes",
    queries: ["city map travel", "road map planning"],
  },
  "tampa-tarpons": {
    alt: "Daytime baseball field with dirt infield and empty bleachers",
    queries: ["minor league baseball field", "baseball field daytime"],
  },
  "seminole-hard-rock-tampa": {
    alt: "Palm-lined resort hotel exterior glowing with evening lights",
    queries: ["resort hotel exterior palms", "hotel resort night lights"],
  },
  "tampa-to-st-petersburg": {
    alt: "Long concrete bridge spanning open bay water under a bright sky",
    queries: ["Florida bay bridge", "long bridge over water"],
  },
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadUsedIds(articles) {
  const used = new Set();
  const registry = existsSync(REGISTRY) ? JSON.parse(readFileSync(REGISTRY, "utf8")) : {};
  for (const id of Object.keys(registry)) used.add(String(id));
  const re = /(?:pexels\.com\/photos\/|\/images\/wm\/articles\/)(\d+)/g;
  for (const article of articles) {
    const blob = `${article.coverImage ?? ""}\n${article.body ?? ""}`;
    for (const m of blob.matchAll(re)) used.add(m[1]);
  }
  return { used, registry };
}

async function search(query, page, apiKey) {
  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("per_page", "40");
  url.searchParams.set("page", String(page));
  url.searchParams.set("size", "large");
  for (let attempt = 0; attempt < 8; attempt++) {
    const res = await fetch(url, { headers: { Authorization: apiKey } });
    if (res.status === 429) {
      const wait = Math.max(30, Number(res.headers.get("retry-after") ?? 60)) * 1000;
      console.warn(`429 rate limit — waiting ${Math.round(wait / 1000)}s`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) throw new Error(`Pexels ${res.status} for ${query}`);
    const data = await res.json();
    return data.photos ?? [];
  }
  return [];
}

function insertFeatured(body, markdown) {
  const lines = body.split("\n");
  const headingIdx = lines.findIndex((l, i) => i > 0 && /^##\s/.test(l));
  if (headingIdx > 0) {
    const before = lines.slice(0, headingIdx).join("\n").trimEnd();
    const after = lines.slice(headingIdx).join("\n");
    return `${before}\n\n${markdown}\n\n${after}`;
  }
  return `${body.trimEnd()}\n\n${markdown}\n`;
}

async function main() {
  const apiKey = process.env.PEXELS_API_KEY?.trim();
  if (!apiKey) throw new Error("Missing PEXELS_API_KEY in .env");

  const articles = JSON.parse(readFileSync(ARTICLES, "utf8"));
  const { used, registry } = loadUsedIds(articles);
  const missing = articles.filter((a) => !a.coverImage);
  const report = [];

  console.log(`Need covers for ${missing.length}; blocking ${used.size} existing IDs`);
  console.log("Cooling down 45s before searches…");
  await sleep(45_000);

  for (const article of missing) {
    const plan = ASSIGNMENTS[article.slug];
    if (!plan) {
      report.push({ slug: article.slug, status: "no-plan" });
      continue;
    }
    let chosen = null;
    let usedQuery = "";
    for (const query of plan.queries) {
      await sleep(2000);
      const photos = await search(query, 1, apiKey);
      const photo = photos.find((p) => !used.has(String(p.id)) && (p.src?.large2x || p.src?.large));
      if (photo) {
        chosen = photo;
        usedQuery = query;
        break;
      }
      await sleep(2000);
      const page2 = await search(query, 2, apiKey);
      const photo2 = page2.find((p) => !used.has(String(p.id)) && (p.src?.large2x || p.src?.large));
      if (photo2) {
        chosen = photo2;
        usedQuery = query;
        break;
      }
    }
    if (!chosen) {
      console.error(`FAIL ${article.slug}`);
      report.push({ slug: article.slug, status: "failed", alt: plan.alt });
      continue;
    }
    used.add(String(chosen.id));
    registry[String(chosen.id)] = article.slug;
    const imageUrl = chosen.src.large2x || chosen.src.large;
    const photographer = chosen.photographer;
    article.coverImage = imageUrl;
    article.coverAlt = plan.alt;
    article.coverCredit = `Photo by ${photographer} on Pexels`;
    const md = `![${plan.alt}](${imageUrl})\n*Photo by [${photographer}](${chosen.photographer_url}) on [Pexels](${chosen.url})*`;
    if (!article.body.includes(String(chosen.id))) {
      article.body = insertFeatured(article.body, md);
    }
    console.log(`OK ${article.slug} | ${chosen.id} | ${photographer} | "${usedQuery}"`);
    report.push({
      slug: article.slug,
      status: "ok",
      id: chosen.id,
      photographer,
      query: usedQuery,
      alt: plan.alt,
      photoPage: chosen.url,
    });
    // Persist incrementally so a later 429 does not lose progress
    writeFileSync(ARTICLES, `${JSON.stringify(articles, null, 2)}\n`);
    writeFileSync(REGISTRY, `${JSON.stringify(registry, null, 2)}\n`);
  }

  mkdirSync(join(ROOT, "output"), { recursive: true });
  writeFileSync(join(ROOT, "output/pexels-cover-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  const ok = report.filter((r) => r.status === "ok").length;
  console.log(`\nAssigned ${ok}/${missing.length}`);
  if (ok < missing.length) process.exitCode = 2;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
