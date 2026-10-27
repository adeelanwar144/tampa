import type { Metadata } from "next";
import { PillarHub } from "@/components/pillars/PillarHub";
import { getArticlesByPillar, getPublishedArticles, PILLAR_META } from "@/lib/pillars";
import { withSiteName } from "@/config/site";

const pillar = PILLAR_META.events;

export const metadata: Metadata = {
  title: withSiteName(pillar.title),
  description:
    "The events page lists TPC Tampa Bay, Topgolf, Altitude, and my Saturday and weekend plans. Open a guide for the hours and booking notes before you go.",
};

export default function EventsPage() {
  const weekend = getPublishedArticles().filter(
    (article) => article.articleType === "weekend-events" && article.pillar !== "events",
  );
  const articles = [...getArticlesByPillar("events"), ...weekend].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
  return <PillarHub title={pillar.title} dek={pillar.dek} articles={articles} />;
}
