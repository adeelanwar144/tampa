import type { ReactNode } from "react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ArticleCard } from "@/components/pillars/ArticleCard";
import { getArticlesByPillar, PILLAR_META } from "@/lib/pillars";
import type { PillarArticle } from "@/types";

export function ArticleLayout({
  article,
  children,
}: {
  article: PillarArticle;
  children: ReactNode;
}) {
  const pillar = PILLAR_META[article.pillar];
  const more = getArticlesByPillar(article.pillar)
    .filter((item) => item.slug !== article.slug)
    .slice(0, 3);

  const published = new Date(article.publishedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: pillar.title, href: pillar.href },
          { label: article.title, href: `${pillar.href}/${article.slug}` },
        ]}
      />

      <h1 className="font-display font-800 text-[38px] leading-tight text-gulf-900 mt-6 mb-3">
        {article.title}
      </h1>
      <p className="text-lg text-ink-600 mb-2">{article.dek}</p>
      <p className="text-sm text-ink-600 mb-8">{published}</p>

      <div className="text-ink-600 leading-relaxed">{children}</div>

      <section className="mt-16 pt-10 border-t border-line">
        <h2 className="font-display font-700 text-[22px] text-gulf-900 mb-6">
          More from {pillar.title}
        </h2>
        {more.length === 0 ? (
          <p className="text-ink-600">No articles published yet</p>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            {more.map((item) => (
              <ArticleCard key={item.slug} article={item} />
            ))}
          </div>
        )}
      </section>
    </article>
  );
}
