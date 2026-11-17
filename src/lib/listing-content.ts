import { getListingContentBucket } from "@/lib/d1";

export type ListingFaqItem = { q: string; a: string };

export type ListingDayHours =
  | { open: string; close: string }
  | { closed: true }
  | { label: string };

export type ListingSeoContent = {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  contentHtml: string;
  faq: ListingFaqItem[];
  /** verified = openingHours came from the business site. call = do not show stored hours. */
  hoursMode?: "verified" | "call";
  openingHours?: Record<string, ListingDayHours>;
  hoursNote?: string;
  schemaType?: string;
};

function parseDayHours(value: unknown): ListingDayHours | null {
  if (!value || typeof value !== "object") return null;
  const day = value as { open?: unknown; close?: unknown; closed?: unknown; label?: unknown };
  if (day.closed === true) return { closed: true };
  if (typeof day.label === "string" && day.label.trim()) return { label: day.label.trim() };
  if (typeof day.open === "string" && typeof day.close === "string" && day.open && day.close) {
    return { open: day.open, close: day.close };
  }
  return null;
}

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
    const openingHours: Record<string, ListingDayHours> = {};
    if (data.openingHours && typeof data.openingHours === "object") {
      for (const [day, value] of Object.entries(data.openingHours)) {
        if (!/^[0-6]$/.test(day)) continue;
        const parsed = parseDayHours(value);
        if (parsed) openingHours[day] = parsed;
      }
    }
    const hoursMode = data.hoursMode === "verified" || data.hoursMode === "call" ? data.hoursMode : undefined;
    return {
      slug: typeof data.slug === "string" ? data.slug : "",
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      contentHtml,
      faq,
      ...(hoursMode ? { hoursMode } : {}),
      ...(Object.keys(openingHours).length ? { openingHours } : {}),
      ...(typeof data.hoursNote === "string" && data.hoursNote.trim() ? { hoursNote: data.hoursNote.trim() } : {}),
      ...(typeof data.schemaType === "string" && data.schemaType.trim() ? { schemaType: data.schemaType.trim() } : {}),
    };
  } catch {
    return null;
  }
}

function objectKey(slug: string): string {
  return `listings/${slug}.json`;
}

/** Quarantine is enforced in D1 (`places.listing_quarantined`). Do not list R2 here. */
export async function getListingContent(slug: string): Promise<ListingSeoContent | null> {
  if (!slug || slug.includes("/") || slug.includes("\\") || slug.includes("..")) return null;
  const bucket = await getListingContentBucket();
  if (!bucket) return null;
  try {
    const object = await bucket.get(objectKey(slug));
    if (!object) return null;
    return parseRecord(await object.text());
  } catch {
    return null;
  }
}
