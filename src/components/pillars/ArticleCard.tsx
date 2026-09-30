import Link from "next/link";
import { articleHref } from "@/lib/pillars";
import type { PillarArticle } from "@/types";

export function ArticleCard({ article }: { article: PillarArticle }) {
  return (
    <article className="bg-white border border-line rounded-[var(--radius-card)] p-5 hover:border-gulf-500 hover:-translate-y-0.5 transition-hover">
      <h3 className="font-display font-700 text-[18px] leading-tight text-gulf-900 mb-2">
        <Link href={articleHref(article)} className="hover:text-gulf-700 transition-hover">
          {article.title}
        </Link>
      </h3>
      <p className="text-sm text-ink-600 line-clamp-2">{article.dek}</p>
    </article>
  );
}
