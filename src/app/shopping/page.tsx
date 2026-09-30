import type { Metadata } from "next";
import { PillarHub } from "@/components/pillars/PillarHub";
import { getArticlesByPillar, PILLAR_META } from "@/lib/pillars";

const pillar = PILLAR_META.shopping;

export const metadata: Metadata = {
  title: `${pillar.title} — Tampa Bay Guide`,
  description: pillar.dek,
};

export default function ShoppingPage() {
  return <PillarHub title={pillar.title} dek={pillar.dek} articles={getArticlesByPillar("shopping")} />;
}
