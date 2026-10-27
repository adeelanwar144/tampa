import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/favicon.ico",
        "/icon.svg",
        "/icon-48.png",
        "/icon-96.png",
        "/icon-192.png",
        "/icon-512.png",
        "/apple-touch-icon.png",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
