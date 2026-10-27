import type { Metadata } from "next";
import { PillarHub } from "@/components/pillars/PillarHub";
import { getArticlesByPillar, PILLAR_META } from "@/lib/pillars";
import { withSiteName } from "@/config/site";

const pillar = PILLAR_META.events;

export const metadata: Metadata = {
  title: withSiteName(pillar.title),
  description:
    "Sports and entertainment covers TPC Tampa Bay in Lutz, Topgolf, and Altitude in Drew Park. Open a guide for the hours and booking notes before you go.",
};

export default function EventsPage() {
  return <PillarHub title={pillar.title} dek={pillar.dek} articles={getArticlesByPillar("events")} />;
}
