/**
 * Publish one article from output/remaining/{slug} into published-articles.json
 * Cover: download Pexels → public/images/articles/{slug}/ (no watermark).
 *
 * Usage: npx tsx scripts/article-gen/publish-one-remaining.ts --slug marriott-water-street-tampa
 */
import { config } from "dotenv";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import sharp from "sharp";
import { sectionForCategory } from "../../src/config/category-sections";
import { inferArticleType } from "./article-type";
import { pexelsApiKey } from "./env";
import type { ArticleType, PillarSlug } from "../../src/types";

config({ path: resolve(process.cwd(), ".env"), quiet: true });

const ROOT = process.cwd();
const ARTICLES = join(ROOT, "src/data/published-articles.json");
const REGISTRY = join(ROOT, "output/_used-images.json");

type Seo = {
  meta_title?: string;
  meta_description?: string;
  primary_keyword?: string;
  lsi_keywords_used?: { keyword: string }[];
};

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

function usedIds(articles: { coverImage?: string; body?: string }[]): Set<string> {
  const used = new Set<string>();
  const registry = existsSync(REGISTRY) ? (JSON.parse(readFileSync(REGISTRY, "utf8")) as Record<string, string>) : {};
  for (const id of Object.keys(registry)) used.add(String(id));
  const re = /(?:pexels\.com\/photos\/|\/images\/(?:wm\/)?articles\/)(\d+)/g;
  for (const a of articles) {
    for (const m of `${a.coverImage ?? ""}\n${a.body ?? ""}`.matchAll(re)) used.add(m[1]);
  }
  return used;
}

async function pickPhoto(query: string, used: Set<string>) {
  const key = pexelsApiKey();
  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("per_page", "30");
  url.searchParams.set("size", "large");
  const res = await fetch(url, { headers: { Authorization: key } });
  if (!res.ok) throw new Error(`Pexels ${res.status}`);
  const data = (await res.json()) as { photos?: Array<{ id: number; src: { large2x?: string; large?: string; original?: string }; photographer: string; photographer_url: string; url: string }> };
  return (data.photos ?? []).find((p) => !used.has(String(p.id)) && (p.src.large2x || p.src.large || p.src.original));
}

async function main() {
  const { values } = parseArgs({
    options: {
      slug: { type: "string" },
      query: { type: "string", default: "downtown hotel waterfront rooftop pool" },
      alt: { type: "string", default: "Downtown waterfront hotel along a riverwalk with city skyline views" },
      pillarCategory: { type: "string", default: "Hotels & Lodging" },
      status: { type: "string", default: "published" },
      photoId: { type: "string" },
      photographer: { type: "string" },
      photographerUrl: { type: "string" },
      photoUrl: { type: "string" },
      filePrefix: { type: "string", default: "cover" },
    },
  });
  const slug = values.slug;
  if (!slug) throw new Error("--slug required");

  const dir = join(ROOT, "output/remaining", slug);
  const articlePath = join(dir, "article.md");
  if (!existsSync(articlePath)) throw new Error(`Missing ${articlePath}`);
  let body = readFileSync(articlePath, "utf8");
  const seo = JSON.parse(readFileSync(join(dir, "seo.json"), "utf8")) as Seo;

  const articles = JSON.parse(readFileSync(ARTICLES, "utf8")) as Array<Record<string, unknown>>;
  if (articles.some((a) => a.slug === slug)) {
    console.log(`Updating existing entry for ${slug}`);
  }

  const used = usedIds(articles as { coverImage?: string; body?: string }[]);
  let photo: {
    id: number;
    src: { large2x?: string; large?: string; original?: string };
    photographer: string;
    photographer_url: string;
    url: string;
  };

  if (values.photoId) {
    const id = Number(values.photoId);
    if (used.has(String(id))) throw new Error(`Photo ${id} already used`);
    photo = {
      id,
      src: {
        large2x: `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1600`,
      },
      photographer: values.photographer || "Pexels",
      photographer_url: values.photographerUrl || `https://www.pexels.com/photo/${id}/`,
      url: values.photoUrl || `https://www.pexels.com/photo/${id}/`,
    };
  } else {
    const found = await pickPhoto(values.query!, used);
    if (!found) throw new Error("No unused Pexels photo found");
    photo = found;
  }

  const srcUrl = photo.src.large2x || photo.src.large || photo.src.original!;
  const imgRes = await fetch(srcUrl);
  if (!imgRes.ok) throw new Error(`Download failed ${imgRes.status}`);
  const buf = Buffer.from(await imgRes.arrayBuffer());
  const outDir = join(ROOT, "public/images/articles", slug);
  mkdirSync(outDir, { recursive: true });
  const fileName = `${values.filePrefix}-${photo.id}.webp`;
  const outFile = join(outDir, fileName);
  await sharp(buf).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toFile(outFile);
  const coverPath = `/images/articles/${slug}/${fileName}`;

  const credit = `Photo by ${photo.photographer} on Pexels`;
  const md = `![${values.alt}](${coverPath})\n*Photo by [${photo.photographer}](${photo.photographer_url}) on [Pexels](${photo.url})*`;
  if (!body.includes(String(photo.id)) && !body.includes(coverPath)) {
    body = insertFeatured(body, md);
  }
  writeFileSync(articlePath, body, "utf8");

  const now = new Date().toISOString();
  const plannerCategory = values.pillarCategory!;
  const entry = {
    slug,
    pillar: sectionForCategory(plannerCategory) as PillarSlug,
    articleType: inferArticleType(slug, seo.primary_keyword || slug, plannerCategory) as ArticleType,
    plannerCategory,
    title: firstHeading(body) || seo.meta_title || slug,
    dek: seo.meta_description || "",
    metaTitle: seo.meta_title || firstHeading(body),
    metaDescription: seo.meta_description || "",
    primaryKeyword: seo.primary_keyword,
    keywords: [
      ...new Set(
        [seo.primary_keyword, ...(seo.lsi_keywords_used ?? []).map((x) => x.keyword)].filter(Boolean) as string[],
      ),
    ],
    coverImage: coverPath,
    coverAlt: values.alt,
    coverCredit: credit,
    publishedAt: now,
    updatedAt: now,
    status: values.status as "published" | "draft",
    readTime: `${Math.max(1, Math.round(wordCount(body) / 220))} min read`,
    body,
  };

  const idx = articles.findIndex((a) => a.slug === slug);
  if (idx >= 0) articles[idx] = entry;
  else articles.unshift(entry);

  const registry = existsSync(REGISTRY)
    ? (JSON.parse(readFileSync(REGISTRY, "utf8")) as Record<string, string>)
    : {};
  registry[String(photo.id)] = slug;

  writeFileSync(ARTICLES, `${JSON.stringify(articles, null, 2)}\n`);
  writeFileSync(REGISTRY, `${JSON.stringify(registry, null, 2)}\n`);
  console.log(`OK ${slug} → ${coverPath} | ${photo.photographer} | status=${entry.status}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
