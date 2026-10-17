import Image from "next/image";
import Link from "next/link";
import { articleHref } from "@/lib/pillars";
import { articleImage } from "@/components/home/StoryRowCard";
import type { PillarArticle } from "@/types";

export function ArticleCard({ article }: { article: PillarArticle }) {
  return (
    <article className="bg-white border border-line rounded-[var(--radius-card)] overflow-hidden hover:border-gulf-500 hover:-translate-y-0.5 transition-hover">
      <Link href={articleHref(article)} className="block">
        <div className="relative aspect-[16/10]">
          <Image
            src={articleImage(article)}
            alt={article.coverAlt || article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
        <div className="p-5">
          <p className="text-[12px] font-semibold text-gulf-700 mb-1">{article.plannerCategory}</p>
          <h3 className="font-display font-700 text-[18px] leading-tight text-gulf-900 mb-2">
            {article.title}
          </h3>
          <p className="text-sm text-ink-600 line-clamp-2">{article.dek}</p>
        </div>
      </Link>
    </article>
  );
}
