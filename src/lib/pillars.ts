import { DROPPED_SLUGS } from "@/config/article-redirects";
import { articles } from "@/data/articles";
import { eventHasEnded } from "@/lib/event-dates";
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

function byNewest(a: PillarArticle, b: PillarArticle) {
  return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
}

/** Published articles, including ones whose event end date has passed. */
export function getAllPublishedArticles(): PillarArticle[] {
  return articles
    .filter((article) => article.status === "published" && !DROPPED_SLUGS.has(article.slug))
    .sort(byNewest);
}

/** Articles that belong on the homepage, hubs, sliders, and sitemap. */
export function getPublishedArticles(): PillarArticle[] {
  return getAllPublishedArticles().filter((article) => !eventHasEnded(article));
}

export function getArticlesByPillar(pillar: PillarSlug): PillarArticle[] {
  return getPublishedArticles().filter((article) => article.pillar === pillar);
}

export function getArticlesByCategory(category: string): PillarArticle[] {
  const key = category.trim().toLowerCase();
  return getPublishedArticles().filter((article) => article.plannerCategory.trim().toLowerCase() === key);
}

export function getArticleBySlug(pillar: PillarSlug, slug: string): PillarArticle | undefined {
  return articles.find((article) => article.pillar === pillar && article.slug === slug);
}

export function articleHref(article: PillarArticle) {
  return `/${article.pillar}/${article.slug}`;
}
