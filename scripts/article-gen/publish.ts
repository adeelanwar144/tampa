import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { SKIP_GENERATE_SLUGS } from "../../src/config/article-redirects";
import { inferArticleType } from "./article-type";
import { loadPlanner } from "./planner";
import type { PexelsImage, SeoBlock } from "./types";
import type { ArticleType, PillarSlug } from "../../src/types";

const SKIP = new Set(["hyde-park-saturday-walk", ...SKIP_GENERATE_SLUGS]);

const PLANNER_TO_PILLAR: Record<string, PillarSlug> = {
  "things to do & attractions (general)": "things-to-do",
  "family & kids": "things-to-do",
  "arts, culture & museums": "things-to-do",
  "tours & cruises": "things-to-do",
  "sports & entertainment": "events",
  "events & festivals": "events",
  "food & drink": "food-and-drink",
  "nightlife & bars": "food-and-drink",
  beaches: "outdoors-beaches",
  "outdoors, parks & nature": "outdoors-beaches",
  "golf, recreation & wellness": "outdoors-beaches",
  shopping: "shopping",
  "hotels & lodging": "guides",
  "neighborhoods & areas": "guides",
  "practical planning & facts": "guides",
  "day trips & nearby cities": "guides",
  "airport & flights": "guides",
  "transportation & getting around": "guides",
  "weather & climate": "guides",
  "tampa general / hub": "guides",
};

type PublishedArticle = {
  slug: string;
  pillar: PillarSlug;
  articleType: ArticleType;
  plannerCategory: string;
  title: string;
  dek: string;
  metaTitle: string;
  metaDescription: string;
  primaryKeyword?: string;
  keywords?: string[];
  coverImage?: string;
  coverAlt?: string;
  coverCredit?: string;
  publishedAt: string;
  status: "published";
  readTime: string;
  body: string;
};

function firstHeading(markdown: string): string {
  return markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "";
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function sitePillar(plannerCategory: string): PillarSlug {
  return PLANNER_TO_PILLAR[plannerCategory.trim().toLowerCase()] ?? "guides";
}

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function main(): void {
  const root = resolve(process.cwd());
  const outputDir = join(root, "output");
  const plannerPath =
    process.argv.includes("--planner")
      ? process.argv[process.argv.indexOf("--planner") + 1]
      : "C:/Users/adeel/Downloads/Tampa_Content_Plan_Keyword_Clusters.xlsx";
  const plannerRows = existsSync(plannerPath) ? loadPlanner(plannerPath) : [];
  const bySlug = new Map(plannerRows.map((row) => [row.slug, row]));

  const slugs = readdirSync(outputDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !SKIP.has(entry.name))
    .map((entry) => entry.name);

  const published: PublishedArticle[] = [];
  for (const slug of slugs) {
    const dir = join(outputDir, slug);
    const articlePath = join(dir, "article.md");
    if (!existsSync(articlePath)) {
      console.warn(`Skipping ${slug}: no article.md`);
      continue;
    }
    const body = readFileSync(articlePath, "utf8");
    const seo = readJson<SeoBlock>(join(dir, "seo.json"));
    const images = readJson<PexelsImage[]>(join(dir, "images.json")) ?? [];
    const log = readJson<{ finishedAt?: string }>(join(dir, "run-log.json"));
    const cover = images.find((image) => image.url && !image.skipped);
    const planner = bySlug.get(slug);
    const plannerCategory = planner?.pillar?.trim() || "Guides";
    const title = firstHeading(body) || seo?.meta_title || slug;
    const metaTitle = seo?.meta_title?.trim() || title;
    const metaDescription = seo?.meta_description?.trim() || "";
    const keywords = [
      seo?.primary_keyword,
      ...(seo?.lsi_keywords_used ?? []).map((item) => item.keyword),
    ].filter((item): item is string => Boolean(item));
    published.push({
      slug,
      pillar: sitePillar(plannerCategory),
      articleType:
        planner?.articleType ??
        inferArticleType(slug, seo?.primary_keyword || slug, plannerCategory),
      plannerCategory,
      title,
      dek: metaDescription,
      metaTitle,
      metaDescription,
      primaryKeyword: seo?.primary_keyword,
      keywords: [...new Set(keywords)],
      coverImage: cover?.url,
      coverAlt: cover?.alt || title,
      coverCredit: cover?.photographer
        ? `Photo by ${cover.photographer} on Pexels`
        : undefined,
      publishedAt: log?.finishedAt ?? new Date().toISOString(),
      status: "published",
      readTime: `${Math.max(1, Math.round(wordCount(body) / 220))} min read`,
      body,
    });
  }

  published.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const outPath = join(root, "src/data/published-articles.json");
  writeFileSync(outPath, `${JSON.stringify(published, null, 2)}\n`, "utf8");

  const counts = new Map<string, number>();
  for (const article of published) {
    const key = `${article.pillar} / ${article.plannerCategory}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  console.log(`Published ${published.length} articles → ${outPath}`);
  for (const [key, count] of [...counts.entries()].sort()) {
    console.log(`  ${count}  ${key}`);
  }
}

main();
