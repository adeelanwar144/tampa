import type { PillarArticle } from "@/types";
import { SITE_URL } from "@/config/site";

const TAMPA = "America/New_York";

export type DateStatus = "past" | "ends-within-14-days" | "upcoming" | "unclear";

export function tampaToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TAMPA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

export function classifyEndDate(end: string | null, today = tampaToday()): DateStatus {
  if (!end || !/^\d{4}-\d{2}-\d{2}$/.test(end)) return "unclear";
  if (end < today) return "past";
  if (end <= addDays(today, 14)) return "ends-within-14-days";
  return "upcoming";
}

export function eventHasEnded(article: Pick<PillarArticle, "eventEndDate">, today = tampaToday()): boolean {
  return Boolean(article.eventEndDate && article.eventEndDate < today);
}

/** Event schema is omitted once the end date has passed, and when there is no end date. */
export function eventJsonLd(
  article: Pick<PillarArticle, "title" | "dek" | "pillar" | "slug" | "eventEndDate">,
  today = tampaToday(),
): Record<string, unknown> | null {
  if (!article.eventEndDate || eventHasEnded(article, today)) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: article.title,
    description: article.dek,
    endDate: article.eventEndDate,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    url: `${SITE_URL}/${article.pillar}/${article.slug}`,
  };
}
