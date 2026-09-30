import { articles } from "@/data/articles";
import type { PillarArticle, PillarSlug } from "@/types";

export const PILLAR_META: Record<
  PillarSlug,
  { title: string; dek: string; href: `/${PillarSlug}` }
> = {
  "things-to-do": {
    title: "Things to do",
    dek: "Content for this section is in progress.",
    href: "/things-to-do",
  },
  "food-and-drink": {
    title: "Food & drink",
    dek: "Content for this section is in progress.",
    href: "/food-and-drink",
  },
  events: {
    title: "Events",
    dek: "Content for this section is in progress.",
    href: "/events",
  },
  "outdoors-beaches": {
    title: "Outdoors & beaches",
    dek: "Content for this section is in progress.",
    href: "/outdoors-beaches",
  },
  shopping: {
    title: "Shopping",
    dek: "Content for this section is in progress.",
    href: "/shopping",
  },
  guides: {
    title: "Guides",
    dek: "Content for this section is in progress.",
    href: "/guides",
  },
};

export const PILLAR_SLUGS = Object.keys(PILLAR_META) as PillarSlug[];

export function getPublishedArticles(): PillarArticle[] {
  return articles
    .filter((article) => article.status === "published")
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export function getArticlesByPillar(pillar: PillarSlug): PillarArticle[] {
  return getPublishedArticles().filter((article) => article.pillar === pillar);
}

export function getArticleBySlug(pillar: PillarSlug, slug: string): PillarArticle | undefined {
  return articles.find((article) => article.pillar === pillar && article.slug === slug);
}

export function articleHref(article: PillarArticle) {
  return `/${article.pillar}/${article.slug}`;
}
