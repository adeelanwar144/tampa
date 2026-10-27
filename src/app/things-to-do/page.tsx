import type { Metadata } from "next";
import { PillarHub } from "@/components/pillars/PillarHub";
import { getArticlesByPillar, PILLAR_META } from "@/lib/pillars";
import { withSiteName } from "@/config/site";

const pillar = PILLAR_META["things-to-do"];

export const metadata: Metadata = {
  title: withSiteName(pillar.title),
  description:
    "My things-to-do notes cover the Riverwalk, a Saturday you can repeat, the Straz, Tampa Theatre, and ZooTampa at Lowry Park. Pick the one that fits the day.",
};

export default function ThingsToDoPage() {
  return <PillarHub title={pillar.title} dek={pillar.dek} articles={getArticlesByPillar("things-to-do")} />;
}
