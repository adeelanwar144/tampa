import type { Metadata } from "next";
import { PillarHub } from "@/components/pillars/PillarHub";
import { getArticlesByPillar, PILLAR_META } from "@/lib/pillars";
import { withSiteName } from "@/config/site";

const pillar = PILLAR_META.guides;

export const metadata: Metadata = {
  title: withSiteName(pillar.title),
  description:
    "Practical notes I keep for Tampa: the time zone, which zip code to write down, the Westshore Marriott, Westin, and Edition, plus the drive to Naples.",
};

export default function GuidesPage() {
  return <PillarHub title={pillar.title} dek={pillar.dek} articles={getArticlesByPillar("guides")} />;
}
