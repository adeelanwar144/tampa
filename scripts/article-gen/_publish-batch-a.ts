/**
 * Publish Batch A articles that passed (or meta-fixed holds) with curated covers.
 * npx tsx scripts/article-gen/_publish-batch-a.ts
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { sectionForCategory } from "../../src/config/category-sections";
import { inferArticleType } from "./article-type";
import type { ArticleType, PillarSlug } from "../../src/types";

const ROOT = process.cwd();
const ARTICLES = join(ROOT, "src/data/published-articles.json");
const REGISTRY = join(ROOT, "output/_used-images.json");

type Job = {
  slug: string;
  photoId: number;
  photographer: string;
  photoUrl: string;
  photographerUrl: string;
  alt: string;
  pillarCategory: string;
  filePrefix: string;
};

const ALL: Job[] = [
  {
    slug: "tampa-to-st-petersburg",
    photoId: 2081166,
    photographer: "Pok Rie",
    photoUrl: "https://www.pexels.com/photo/bridge-near-body-of-water-2081166/",
    photographerUrl: "https://www.pexels.com/@pok-rie-33563/",
    alt: "Long bridge spanning a wide bay under a bright sky",
    pillarCategory: "Day Trips & Nearby Cities",
    filePrefix: "st-pete-bridge",
  },
  {
    slug: "tampa-tarpons",
    photoId: 2570139,
    photographer: "Laura Tancredi",
    photoUrl: "https://www.pexels.com/photo/man-in-white-jersey-shirt-and-blue-pants-playing-baseball-2570139/",
    photographerUrl: "https://www.pexels.com/@lauratancredi/",
    alt: "Baseball player swinging during a daytime game",
    pillarCategory: "Sports & Entertainment",
    filePrefix: "tarpons",
  },
  {
    slug: "tampa-bay-rays",
    photoId: 25547645,
    photographer: "NIKOLAI FOMIN",
    photoUrl:
      "https://www.pexels.com/photo/view-of-the-baseball-game-at-the-wrigley-field-in-chicago-illinois-25547645/",
    photographerUrl: "https://www.pexels.com/@nikolai-fomin-2148174933/",
    alt: "Crowd watching a baseball game from the stands on a sunny day",
    pillarCategory: "Sports & Entertainment",
    filePrefix: "rays",
  },
  {
    slug: "tampa-rays-schedule",
    photoId: 1092671,
    photographer: "Pixabay",
    photoUrl: "https://www.pexels.com/photo/ball-ballpark-baseball-baseball-bat-1092671/",
    photographerUrl: "https://www.pexels.com/@pixabay/",
    alt: "Baseball and bat on a green field ready for a game",
    pillarCategory: "Sports & Entertainment",
    filePrefix: "rays-schedule",
  },
  {
    slug: "tropicana-field",
    photoId: 374700,
    photographer: "Pixabay",
    photoUrl: "https://www.pexels.com/photo/baseball-field-374700/",
    photographerUrl: "https://www.pexels.com/@pixabay/",
    alt: "Empty baseball diamond with dirt infield and green grass",
    pillarCategory: "Sports & Entertainment",
    filePrefix: "tropicana",
  },
  {
    slug: "tampa-bay-lightning",
    photoId: 88470,
    photographer: "Pixabay",
    photoUrl: "https://www.pexels.com/photo/ice-hockey-88470/",
    photographerUrl: "https://www.pexels.com/@pixabay/",
    alt: "Ice hockey players competing during a game",
    pillarCategory: "Sports & Entertainment",
    filePrefix: "lightning",
  },
  {
    slug: "tampa-lightning-tickets",
    photoId: 17527817,
    photographer: "Patrick",
    photoUrl: "https://www.pexels.com/photo/tickets-text-on-yellow-wall-17527817/",
    photographerUrl: "https://www.pexels.com/@patrick-88938360/",
    alt: "Illuminated yellow tickets sign against a dark background",
    pillarCategory: "Sports & Entertainment",
    filePrefix: "lightning-tickets",
  },
  {
    slug: "tampa-buccaneers",
    photoId: 37578663,
    photographer: "Stephen Leonardi",
    photoUrl: "https://www.pexels.com/photo/night-football-game-at-illuminated-stadium-37578663/",
    photographerUrl: "https://www.pexels.com/@stephenleonardi/",
    alt: "Night American football game under bright stadium lights",
    pillarCategory: "Sports & Entertainment",
    filePrefix: "bucs",
  },
  {
    slug: "seminole-hard-rock-tampa",
    photoId: 258154,
    photographer: "Pixabay",
    photoUrl: "https://www.pexels.com/photo/architecture-building-buildings-business-258154/",
    photographerUrl: "https://www.pexels.com/@pixabay/",
    alt: "Modern resort hotel exterior with lit windows at dusk",
    pillarCategory: "Hotels & Lodging",
    filePrefix: "hard-rock",
  },
  {
    slug: "tampa-map",
    photoId: 346885,
    photographer: "Pixabay",
    photoUrl: "https://www.pexels.com/photo/adventure-direction-finger-hand-346885/",
    photographerUrl: "https://www.pexels.com/@pixabay/",
    alt: "Hands holding a paper map while navigating outdoors",
    pillarCategory: "Transportation & Getting Around",
    filePrefix: "tampa-map",
  },
];

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
function firstHeading(md: string): string {
  return md.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "";
}
function insertFeatured(body: string, markdown: string): string {
  const lines = body.split("\n");
  const headingIdx = lines.findIndex((l, i) => i > 0 && /^##\s/.test(l));
  if (headingIdx > 0) {
    return `${lines.slice(0, headingIdx).join("\n").trimEnd()}\n\n${markdown}\n\n${lines.slice(headingIdx).join("\n")}`;
  }
  return `${body.trimEnd()}\n\n${markdown}\n`;
}

async function main() {
  const articles = JSON.parse(readFileSync(ARTICLES, "utf8")) as Array<Record<string, unknown>>;
  const registry = existsSync(REGISTRY)
    ? (JSON.parse(readFileSync(REGISTRY, "utf8")) as Record<string, string>)
    : {};

  for (const j of ALL) {
    if (registry[String(j.photoId)] && registry[String(j.photoId)] !== j.slug) {
      throw new Error(`Photo ${j.photoId} already used by ${registry[String(j.photoId)]}`);
    }
    const dir = join(ROOT, "output/remaining", j.slug);
    const articlePath = join(dir, "article.md");
    if (!existsSync(articlePath)) throw new Error(`Missing ${articlePath}`);
    let body = readFileSync(articlePath, "utf8");
    if (wordCount(body) < 1000) throw new Error(`${j.slug} body too short (${wordCount(body)})`);
    const seo = JSON.parse(readFileSync(join(dir, "seo.json"), "utf8")) as {
      meta_title?: string;
      meta_description?: string;
      primary_keyword?: string;
      lsi_keywords_used?: { keyword: string }[];
    };

    const cdn = `https://images.pexels.com/photos/${j.photoId}/pexels-photo-${j.photoId}.jpeg?auto=compress&cs=tinysrgb&w=1600`;
    let imgRes = await fetch(cdn);
    if (!imgRes.ok) {
      // png variant for some newer IDs
      imgRes = await fetch(
        `https://images.pexels.com/photos/${j.photoId}/pexels-photo-${j.photoId}.png?auto=compress&cs=tinysrgb&w=1600`,
      );
    }
    if (!imgRes.ok) throw new Error(`Download ${j.photoId} failed ${imgRes.status}`);
    const buf = Buffer.from(await imgRes.arrayBuffer());
    const outDir = join(ROOT, "public/images/articles", j.slug);
    mkdirSync(outDir, { recursive: true });
    const fileName = `${j.filePrefix}-${j.photoId}.webp`;
    await sharp(buf)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(join(outDir, fileName));
    const coverPath = `/images/articles/${j.slug}/${fileName}`;
    const credit = `Photo by ${j.photographer} on Pexels`;
    const md = `![${j.alt}](${coverPath})\n*Photo by [${j.photographer}](${j.photographerUrl}) on [Pexels](${j.photoUrl})*`;
    if (!body.includes(String(j.photoId)) && !body.includes(coverPath)) {
      body = insertFeatured(body, md);
    }
    writeFileSync(articlePath, body, "utf8");

    const now = new Date().toISOString();
    const entry = {
      slug: j.slug,
      pillar: sectionForCategory(j.pillarCategory) as PillarSlug,
      articleType: inferArticleType(
        j.slug,
        seo.primary_keyword || j.slug,
        j.pillarCategory,
      ) as ArticleType,
      plannerCategory: j.pillarCategory,
      title: firstHeading(body) || seo.meta_title || j.slug,
      dek: seo.meta_description || "",
      metaTitle: seo.meta_title || firstHeading(body),
      metaDescription: seo.meta_description || "",
      primaryKeyword: seo.primary_keyword,
      keywords: [
        ...new Set(
          [seo.primary_keyword, ...(seo.lsi_keywords_used ?? []).map((x) => x.keyword)].filter(
            Boolean,
          ) as string[],
        ),
      ],
      coverImage: coverPath,
      coverAlt: j.alt,
      coverCredit: credit,
      publishedAt: (articles.find((a) => a.slug === j.slug)?.publishedAt as string) || now,
      updatedAt: now,
      status: "published" as const,
      readTime: `${Math.max(1, Math.round(wordCount(body) / 220))} min read`,
      body,
    };
    const idx = articles.findIndex((a) => a.slug === j.slug);
    if (idx >= 0) articles[idx] = entry;
    else articles.unshift(entry);
    registry[String(j.photoId)] = j.slug;
    console.log(`OK ${j.slug} → ${coverPath} | words=${wordCount(body)}`);
  }

  writeFileSync(ARTICLES, `${JSON.stringify(articles, null, 2)}\n`);
  writeFileSync(REGISTRY, `${JSON.stringify(registry, null, 2)}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
