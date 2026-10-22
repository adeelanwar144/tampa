import type { Metadata } from "next";
import { PillarHub } from "@/components/pillars/PillarHub";
import { getArticlesByPillar, pillarPageDescription, PILLAR_META } from "@/lib/pillars";
import { withSiteName } from "@/config/site";

const pillar = PILLAR_META["things-to-do"];

export const metadata: Metadata = {
  title: withSiteName(pillar.title),
  description: pillarPageDescription(pillar.title),
};

export default function ThingsToDoPage() {
  return <PillarHub title={pillar.title} dek={pillar.dek} articles={getArticlesByPillar("things-to-do")} />;
}
