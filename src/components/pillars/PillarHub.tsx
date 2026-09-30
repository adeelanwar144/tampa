import { ArticleCard } from "@/components/pillars/ArticleCard";
import type { PillarArticle } from "@/types";

export function PillarHub({
  title,
  dek,
  articles,
}: {
  title: string;
  dek: string;
  articles: PillarArticle[];
}) {
  return (
    <>
      <section
        className="w-full pt-8 pb-10 md:pt-10 md:pb-12"
        style={{
          background: "linear-gradient(135deg, #08343C 0%, #0B5E6B 55%, #14707E 100%)",
        }}
      >
        <div className="mx-auto max-w-[1200px] px-6 text-center">
          <h1 className="font-display text-[34px] font-bold leading-[1.12] tracking-[-0.02em] text-white md:text-[44px]">
            {title}
          </h1>
          <p className="mx-auto mt-3 max-w-[640px] text-[16px] text-[#CFE4E6] md:text-[18px]">
            {dek}
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {articles.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-ink-600">No articles published yet</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={`${article.pillar}-${article.slug}`} article={article} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
