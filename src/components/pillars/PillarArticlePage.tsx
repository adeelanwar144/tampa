import { notFound } from "next/navigation";
import { ArticleLayout } from "@/components/pillars/ArticleLayout";
import { getArticleBySlug } from "@/lib/pillars";
import type { PillarSlug } from "@/types";

export function PillarArticlePage({ pillar, slug }: { pillar: PillarSlug; slug: string }) {
  const article = getArticleBySlug(pillar, slug);
  if (!article) notFound();

  return (
    <ArticleLayout article={article}>
      <p>Content for this section is in progress.</p>
    </ArticleLayout>
  );
}
