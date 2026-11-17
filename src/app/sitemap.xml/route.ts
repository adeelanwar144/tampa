import { cachedListingResult } from "@/lib/listing-cache";
import { buildSitemapXml } from "@/lib/sitemap-document";

export const dynamic = "force-dynamic";

/** Full sitemap document. Long enough that a crawl does not rebuild 707 URLs every hit. */
const SITEMAP_TTL_SECONDS = 20 * 60;

export async function GET() {
  const { value, hit } = await cachedListingResult("sitemap-xml-v1", SITEMAP_TTL_SECONDS, buildSitemapXml);
  return new Response(value, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": `public, max-age=${SITEMAP_TTL_SECONDS}, s-maxage=${SITEMAP_TTL_SECONDS}`,
      "x-sitemap-cache": hit ? "hit" : "miss",
    },
  });
}
