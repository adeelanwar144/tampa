import type { Metadata } from "next";
import { PillarHub } from "@/components/pillars/PillarHub";
import { getArticlesByPillar, PILLAR_META } from "@/lib/pillars";
import { withSiteName } from "@/config/site";

const pillar = PILLAR_META["outdoors-beaches"];

export const metadata: Metadata = {
  title: withSiteName(pillar.title),
  description:
    "Outdoors and beaches is for public parks and time on the water around Tampa. Park and water listings belong in the beaches and outdoors directory.",
};

export default function OutdoorsBeachesPage() {
  return <PillarHub title={pillar.title} dek={pillar.dek} articles={getArticlesByPillar("outdoors-beaches")} />;
}
