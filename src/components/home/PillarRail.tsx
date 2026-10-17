import { BlogSlider } from "@/components/home/BlogSlider";
import { getArticlesByPillar, PILLAR_META } from "@/lib/pillars";
import type { PillarSlug } from "@/types";

export function PillarRail({ pillar }: { pillar: PillarSlug }) {
  const meta = PILLAR_META[pillar];
  const stories = getArticlesByPillar(pillar);
  if (stories.length < 2) return null;

  return (
    <BlogSlider
      title={meta.title}
      description={meta.dek}
      href={meta.href}
      articles={stories}
    />
  );
}
