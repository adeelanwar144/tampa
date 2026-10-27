import type { Metadata } from "next";
import { PillarHub } from "@/components/pillars/PillarHub";
import { getArticlesByPillar, PILLAR_META } from "@/lib/pillars";
import { withSiteName } from "@/config/site";

const pillar = PILLAR_META.shopping;

export const metadata: Metadata = {
  title: withSiteName(pillar.title),
  description:
    "Shopping is my section for stores and markets around Tampa. The shopping directory lists the shops, from grocery stores to the everyday stops.",
};

export default function ShoppingPage() {
  return <PillarHub title={pillar.title} dek={pillar.dek} articles={getArticlesByPillar("shopping")} />;
}
