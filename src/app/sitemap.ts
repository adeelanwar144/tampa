import type { MetadataRoute } from "next";
import { NEIGHBORHOODS, CATEGORY_LABELS, getSitemapPlaces } from "@/lib/listings";
import type { PlaceSitemapEntry } from "@/lib/listings";
import { neighborhoodSlug } from "@/data/neighborhoods";
import { sectionIsListed } from "@/lib/menu";
import {
  articleDateModified,
  articleHref,
  getArticlesByCategory,
  getArticlesByPillar,
  getPublishedArticles,
  PILLAR_SLUGS,
} from "@/lib/pillars";
import type { PillarSlug } from "@/types";
import { SITE_URL } from "@/config/site";

export const dynamic = "force-dynamic";

/**
 * Last time this route's own copy changed.
 * Performance-only commits are not content changes.
 * Hubs and listing indexes also take a newer article or place timestamp when they have one.
 */
const COPY_REVISED_AT: Record<string, string> = {
  "/": "2026-11-02T14:53:59.000Z",
  "/about": "2026-10-22T00:25:53.000Z",
  "/contact": "2026-10-27T12:50:15.000Z",
  "/privacy-policy": "2026-10-27T12:50:15.000Z",
  "/terms": "2026-10-27T12:50:15.000Z",
  "/search": "2026-10-27T12:50:15.000Z",
  "/things-to-do": "2026-10-27T12:50:15.000Z",
  "/food-and-drink": "2026-10-27T12:50:15.000Z",
  "/events": "2026-10-27T14:04:06.000Z",
  "/guides": "2026-10-27T12:50:15.000Z",
  "/getting-around": "2026-11-02T14:53:59.000Z",
  "/outdoors-beaches": "2026-10-27T13:42:12.000Z",
  "/shopping": "2026-10-27T13:42:12.000Z",
  "/neighborhoods": "2026-10-27T12:50:15.000Z",
  // places index, directory, and neighborhood detail copy in src/lib/directory-seo.ts
  "/places": "2026-10-27T12:55:12.000Z",
  "/directory": "2026-10-27T12:55:12.000Z",
};

const PILLAR_PATHS = new Set<string>(PILLAR_SLUGS.map((pillar) => `/${pillar}`));

function latestModified(values: Array<string | undefined>): Date | undefined {
  let best = Number.NaN;
  for (const value of values) {
    if (!value) continue;
    const time = Date.parse(value);
    if (Number.isNaN(time)) continue;
    if (Number.isNaN(best) || time > best) best = time;
  }
  return Number.isNaN(best) ? undefined : new Date(best);
}

function entry(url: string, lastModified: Date | undefined): MetadataRoute.Sitemap[number] {
  return lastModified ? { url, lastModified } : { url };
}

function placeTimes(places: PlaceSitemapEntry[], category?: string, neighborhood?: string) {
  return places
    .filter((place) => (category ? place.category === category : true))
    .filter((place) => (neighborhood ? place.neighborhoodSlug === neighborhood : true))
    .map((place) => place.updatedAt);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL;
  const publishedArticles = getPublishedArticles();
  const articleTimes = publishedArticles.map(articleDateModified);
  // Scheduling (event end dates) applies to articles only. Places use published + not quarantined.
  const places = await getSitemapPlaces();
  const allPlaceTimes = placeTimes(places);

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/things-to-do",
    "/food-and-drink",
    "/events",
    "/neighborhoods",
    "/outdoors-beaches",
    "/shopping",
    "/guides",
    "/directory",
    "/search",
    "/about",
    "/contact",
    "/getting-around",
    "/privacy-policy",
    "/terms",
    "/places",
  ]
    .filter((path) => {
      const pillar = path.replace(/^\//, "") as PillarSlug;
      return pillar === "outdoors-beaches" || pillar === "shopping" ? sectionIsListed(pillar) : true;
    })
    .map((path) => {
      const route = path || "/";
      const dataTimes = path === ""
        ? articleTimes
        : path === "/places" || path === "/directory"
          ? allPlaceTimes
          : path === "/neighborhoods"
            ? [
                ...allPlaceTimes,
                ...getArticlesByCategory("Neighborhoods & Areas").map(articleDateModified),
              ]
            : PILLAR_PATHS.has(path)
              ? getArticlesByPillar(path.slice(1) as PillarSlug).map(articleDateModified)
              : [];
      return entry(`${base}${path}`, latestModified([COPY_REVISED_AT[route], ...dataTimes]));
    });

  const directoryCategories = Object.keys(CATEGORY_LABELS).map((category) =>
    entry(
      `${base}/directory/${category}`,
      latestModified([COPY_REVISED_AT["/directory"], ...placeTimes(places, category)]),
    ),
  );

  const placeRoutes = places.map((place) =>
    entry(`${base}/places/${place.slug}`, latestModified([place.updatedAt])),
  );

  const articles = publishedArticles.map((article) =>
    entry(`${base}${articleHref(article)}`, latestModified([articleDateModified(article)])),
  );

  const neighborhoods = NEIGHBORHOODS.map((name) => {
    const slug = neighborhoodSlug(name);
    return entry(
      `${base}/neighborhoods/${slug}`,
      latestModified([COPY_REVISED_AT["/directory"], ...placeTimes(places, undefined, slug)]),
    );
  });

  return [...staticRoutes, ...directoryCategories, ...placeRoutes, ...articles, ...neighborhoods];
}
