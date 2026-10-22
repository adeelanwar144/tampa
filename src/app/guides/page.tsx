import type { Metadata } from "next";
import { PillarHub } from "@/components/pillars/PillarHub";
import { getArticlesByPillar, pillarPageDescription, PILLAR_META } from "@/lib/pillars";
import { withSiteName } from "@/config/site";

const pillar = PILLAR_META.guides;

export const metadata: Metadata = {
  title: withSiteName(pillar.title),
  description: pillarPageDescription(pillar.title),
};

export default function GuidesPage() {
  return <PillarHub title={pillar.title} dek={pillar.dek} articles={getArticlesByPillar("guides")} />;
}
