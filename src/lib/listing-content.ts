import { getListingContentBucket } from "@/lib/d1";

export type ListingFaqItem = { q: string; a: string };

export type ListingSeoContent = {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  contentHtml: string;
  faq: ListingFaqItem[];
};

function parseRecord(raw: string): ListingSeoContent | null {
  try {
    const data = JSON.parse(raw) as Partial<ListingSeoContent> & { contentMarkdown?: string };
    if (typeof data.metaTitle !== "string" || typeof data.metaDescription !== "string") return null;
    const contentHtml = typeof data.contentHtml === "string" ? data.contentHtml.trim() : "";
    if (!contentHtml) return null;
    const faq = Array.isArray(data.faq)
      ? data.faq.filter(
          (item): item is ListingFaqItem =>
            Boolean(item) &&
            typeof item.q === "string" &&
            typeof item.a === "string" &&
            item.q.trim().length > 0 &&
            item.a.trim().length > 0,
        )
      : [];
    return {
      slug: typeof data.slug === "string" ? data.slug : "",
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      contentHtml,
      faq,
    };
  } catch {
    return null;
  }
}

function objectKey(slug: string): string {
  return `listings/${slug}.json`;
}

function quarantineKey(slug: string): string {
  return `quarantine/${slug}.json`;
}

const QUARANTINE_TTL_MS = 60_000;
let quarantineCache: { at: number; slugs: Set<string> } | null = null;

export async function getQuarantinedSlugs(): Promise<Set<string>> {
  if (quarantineCache && Date.now() - quarantineCache.at < QUARANTINE_TTL_MS) {
    return quarantineCache.slugs;
  }
  const bucket = await getListingContentBucket();
  const slugs = new Set<string>();
  if (!bucket) return slugs;
  try {
    let cursor: string | undefined;
    do {
      const page = await bucket.list({ prefix: "quarantine/", cursor, limit: 1000 });
      for (const object of page.objects) {
        const name = object.key.slice("quarantine/".length);
        if (name.endsWith(".json")) slugs.add(name.slice(0, -".json".length));
      }
      cursor = page.truncated ? page.cursor : undefined;
    } while (cursor);
    quarantineCache = { at: Date.now(), slugs };
  } catch (error) {
    console.error("Could not read quarantined listings", error);
  }
  return slugs;
}

export async function getListingContent(slug: string): Promise<ListingSeoContent | null> {
  if (!slug || slug.includes("/") || slug.includes("\\") || slug.includes("..")) return null;
  const bucket = await getListingContentBucket();
  if (!bucket) return null;
  try {
    const quarantined = await bucket.get(quarantineKey(slug));
    if (quarantined) return null;
    const object = await bucket.get(objectKey(slug));
    if (!object) return null;
    return parseRecord(await object.text());
  } catch {
    return null;
  }
}
