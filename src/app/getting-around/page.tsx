import type { Metadata } from "next";
import { PillarHub } from "@/components/pillars/PillarHub";
import { getArticlesByPillar, PILLAR_META } from "@/lib/pillars";
import { withSiteName } from "@/config/site";

const pillar = PILLAR_META["getting-around"];

export const metadata: Metadata = {
  title: withSiteName(pillar.title),
  description:
    "Getting around Tampa: Tampa International Airport, reading the city map, and practical notes before you set out.",
};

export default function GettingAroundPage() {
  return (
    <PillarHub title={pillar.title} dek={pillar.dek} articles={getArticlesByPillar("getting-around")} />
  );
}
