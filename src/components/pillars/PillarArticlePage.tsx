import { notFound } from "next/navigation";
import { ArticleLayout } from "@/components/pillars/ArticleLayout";
import { ArticleMarkdown } from "@/components/pillars/ArticleMarkdown";
import { getArticleBySlug } from "@/lib/pillars";
import type { PillarSlug } from "@/types";

export function PillarArticlePage({ pillar, slug }: { pillar: PillarSlug; slug: string }) {
  const article = getArticleBySlug(pillar, slug);
  if (!article) notFound();

  return (
    <ArticleLayout article={article}>
      {article.body ? <ArticleMarkdown markdown={article.body} /> : <p>More soon.</p>}
    </ArticleLayout>
  );
}
