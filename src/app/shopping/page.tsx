import type { Metadata } from "next";
import { PillarHub } from "@/components/pillars/PillarHub";
import { getArticlesByPillar, pillarPageDescription, PILLAR_META } from "@/lib/pillars";
import { withSiteName } from "@/config/site";

const pillar = PILLAR_META.shopping;

export const metadata: Metadata = {
  title: withSiteName(pillar.title),
  description: pillarPageDescription(pillar.title),
};

export default function ShoppingPage() {
  return <PillarHub title={pillar.title} dek={pillar.dek} articles={getArticlesByPillar("shopping")} />;
}
