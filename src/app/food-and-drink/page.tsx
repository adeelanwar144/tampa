import type { Metadata } from "next";
import { PillarHub } from "@/components/pillars/PillarHub";
import { getArticlesByPillar, pillarPageDescription, PILLAR_META } from "@/lib/pillars";
import { withSiteName } from "@/config/site";

const pillar = PILLAR_META["food-and-drink"];

export const metadata: Metadata = {
  title: withSiteName(pillar.title),
  description: pillarPageDescription(pillar.title),
};

export default function FoodAndDrinkPage() {
  return <PillarHub title={pillar.title} dek={pillar.dek} articles={getArticlesByPillar("food-and-drink")} />;
}
