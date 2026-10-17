import { DROPPED_SLUGS } from "@/config/article-redirects";
import { articles } from "@/data/articles";
import type { PillarArticle, PillarSlug } from "@/types";

export const PILLAR_META: Record<
  PillarSlug,
  { title: string; dek: string; href: `/${PillarSlug}` }
> = {
  "things-to-do": {
    title: "Things to do",
    dek: "My favorite ways to spend a day in Tampa.",
    href: "/things-to-do",
  },
  "food-and-drink": {
    title: "Food & drink",
    dek: "Where I'd eat, from quick bites to big nights out.",
    href: "/food-and-drink",
  },
  events: {
    title: "Events",
    dek: "Concerts, games and what's on around town.",
    href: "/events",
  },
  "outdoors-beaches": {
    title: "Outdoors & beaches",
    dek: "Parks, water and time outside around Tampa Bay.",
    href: "/outdoors-beaches",
  },
  shopping: {
    title: "Shopping",
    dek: "Where I'd browse, from small shops to the big malls.",
    href: "/shopping",
  },
  guides: {
    title: "Guides",
    dek: "Practical notes for getting around Tampa.",
    href: "/guides",
  },
};

export const PILLAR_SLUGS = Object.keys(PILLAR_META) as PillarSlug[];

export function pillarPageDescription(title: string) {
  return `${title} in Tampa.`;
}

export function getPublishedArticles(): PillarArticle[] {
  return articles
    .filter((article) => article.status === "published" && !DROPPED_SLUGS.has(article.slug))
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
