import type { MetadataRoute } from "next";
import { getAllPlaces, NEIGHBORHOODS, CATEGORY_LABELS } from "@/lib/listings";
import { neighborhoodSlug } from "@/data/neighborhoods";
import { articleHref, getPublishedArticles } from "@/lib/pillars";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://tampabayguide.com";

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
    "/getting-around",
    "/privacy-policy",
    "/terms",
    "/places",
  ].map((path) => ({
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

  const places = (await getAllPlaces()).map((p) => ({
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
    lastModified: new Date(article.publishedAt),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...directoryCategories, ...places, ...neighborhoods, ...articles];
}
