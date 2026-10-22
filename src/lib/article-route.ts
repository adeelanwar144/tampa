import type { Metadata } from "next";
import { SITE_URL } from "@/config/site";
import { eventHasEnded } from "@/lib/event-dates";
import { articleHref, getAllPublishedArticles, getArticleBySlug } from "@/lib/pillars";
import type { PillarSlug } from "@/types";

export function articleStaticParams(pillar: PillarSlug) {
  return getAllPublishedArticles()
    .filter((article) => article.pillar === pillar)
    .map((article) => ({ slug: article.slug }));
}

export async function articleMetadata(
  pillar: PillarSlug,
  params: Promise<{ slug: string }>,
): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(pillar, slug);
  if (!article) return {};

  const title = article.metaTitle || article.title;
  const description = article.metaDescription || article.dek;
  const url = articleHref(article);

  return {
    title,
    description,
    keywords: article.keywords,
    robots: eventHasEnded(article) ? { index: false, follow: true } : undefined,
    authors: [{ name: "Ben", url: `${SITE_URL}/about` }],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt || article.publishedAt,
      authors: ["Ben"],
      images: article.coverImage
        ? [{ url: article.coverImage, alt: article.coverAlt || article.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: article.coverImage ? [article.coverImage] : undefined,
    },
  };
}
