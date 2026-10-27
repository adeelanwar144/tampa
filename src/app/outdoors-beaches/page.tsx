import type { Metadata } from "next";
import { PillarHub } from "@/components/pillars/PillarHub";
import { getArticlesByPillar, PILLAR_META } from "@/lib/pillars";
import { withSiteName } from "@/config/site";

const pillar = PILLAR_META["outdoors-beaches"];

export const metadata: Metadata = {
  title: withSiteName(pillar.title),
  description:
    "Outdoors and beaches is where park and water guides will go. None are published yet, so the neighborhood pages are the useful stop while I write them.",
};

export default function OutdoorsBeachesPage() {
  return <PillarHub title={pillar.title} dek={pillar.dek} articles={getArticlesByPillar("outdoors-beaches")} />;
}
