import type { MetadataRoute } from "next";
import { getSitemapPlaces, NEIGHBORHOODS, CATEGORY_LABELS } from "@/lib/listings";
import { neighborhoodSlug } from "@/data/neighborhoods";
import { sectionIsListed } from "@/lib/menu";
import { articleHref, getPublishedArticles } from "@/lib/pillars";
import type { PillarSlug } from "@/types";
import { SITE_URL } from "@/config/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL;

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
    .map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/directory" || path === "/places" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const directoryCategories = Object.keys(CATEGORY_LABELS).map((category) => ({
    url: `${base}/directory/${category}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const places = (await getSitemapPlaces()).map((p) => ({
    url: `${base}/places/${p.slug}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const neighborhoods = NEIGHBORHOODS.map((n) => ({
    url: `${base}/neighborhoods/${neighborhoodSlug(n)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  const articles = getPublishedArticles().map((article) => ({
    url: `${base}${articleHref(article)}`,
    lastModified: new Date(article.updatedAt || article.publishedAt),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...directoryCategories, ...places, ...neighborhoods, ...articles];
}
