import type { Metadata } from "next";
import { PillarHub } from "@/components/pillars/PillarHub";
import { getArticlesByPillar, PILLAR_META } from "@/lib/pillars";

const pillar = PILLAR_META.guides;

export const metadata: Metadata = {
  title: `${pillar.title} — Tampa Bay Guide`,
  description: pillar.dek,
};

export default function GuidesPage() {
  return <PillarHub title={pillar.title} dek={pillar.dek} articles={getArticlesByPillar("guides")} />;
}
