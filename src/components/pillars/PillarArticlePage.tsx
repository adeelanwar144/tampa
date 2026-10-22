import NotFound from "@/app/not-found";
import { ArticleLayout } from "@/components/pillars/ArticleLayout";
import { ArticleMarkdown } from "@/components/pillars/ArticleMarkdown";
import { DROPPED_SLUGS } from "@/config/article-redirects";
import { getArticleBySlug } from "@/lib/pillars";
import type { PillarSlug } from "@/types";

export function PillarArticlePage({ pillar, slug }: { pillar: PillarSlug; slug: string }) {
  const article = getArticleBySlug(pillar, slug);
  if (!article || article.status !== "published" || DROPPED_SLUGS.has(article.slug)) return <NotFound />;

  return (
    <ArticleLayout article={article}>
      {article.body ? <ArticleMarkdown markdown={article.body} /> : <p>More soon.</p>}
    </ArticleLayout>
  );
}
