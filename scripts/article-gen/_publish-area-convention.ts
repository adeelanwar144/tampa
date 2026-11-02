import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { sectionForCategory } from "../../src/config/category-sections";
import { inferArticleType } from "./article-type";
import type { ArticleType, PillarSlug } from "../../src/types";

const ROOT = process.cwd();
const ARTICLES = join(ROOT, "src/data/published-articles.json");
const REGISTRY = join(ROOT, "output/_used-images.json");

const jobs = [
  {
    slug: "tampa-area-code",
    photoId: 821754,
    photographer: "Alex Andrews",
    photoUrl: "https://www.pexels.com/photo/black-and-gray-rotary-phone-on-white-surface-821754/",
    photographerUrl: "https://www.pexels.com/@alexandrews/",
    alt: "Two vintage black telephone handsets connected by cords",
    pillarCategory: "Practical Planning & Facts",
    filePrefix: "tampa-area-code",
  },
  {
    slug: "tampa-convention-center",
    photoId: 32731350,
    photographer: "Miff Ibra",
    photoUrl: "https://www.pexels.com/photo/modern-theater-seats-in-a-blue-auditorium-32731350/",
    photographerUrl: "https://www.pexels.com/@miffibra/",
    alt: "Rows of blue auditorium seats in an empty convention-style hall",
    pillarCategory: "Practical Planning & Facts",
    filePrefix: "tampa-convention",
  },
] as const;

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

  for (const j of jobs) {
    const dir = join(ROOT, "output/remaining", j.slug);
    let body = readFileSync(join(dir, "article.md"), "utf8");
    const seo = JSON.parse(readFileSync(join(dir, "seo.json"), "utf8")) as {
      meta_title?: string;
      meta_description?: string;
      primary_keyword?: string;
      lsi_keywords_used?: { keyword: string }[];
    };
    if (registry[String(j.photoId)] && registry[String(j.photoId)] !== j.slug) {
      throw new Error(`Photo ${j.photoId} used by ${registry[String(j.photoId)]}`);
    }
    const cdn = `https://images.pexels.com/photos/${j.photoId}/pexels-photo-${j.photoId}.jpeg?auto=compress&cs=tinysrgb&w=1600`;
    const imgRes = await fetch(cdn);
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
    writeFileSync(join(dir, "article.md"), body, "utf8");
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
      publishedAt: now,
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
