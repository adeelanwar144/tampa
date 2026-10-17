import type { ReactNode } from "react";
import Image from "next/image";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ArticleCard } from "@/components/pillars/ArticleCard";
import { faqJsonLd } from "@/components/pillars/ArticleMarkdown";
import { articleHref, getArticlesByPillar, PILLAR_META } from "@/lib/pillars";
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

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.metaTitle || article.title,
    description: article.metaDescription || article.dek,
    datePublished: article.publishedAt,
    image: article.coverImage ? [article.coverImage] : undefined,
    mainEntityOfPage: `https://tampabayguide.com${articleHref(article)}`,
    author: {
      "@type": "Person",
      name: "Ben",
      url: "https://tampabayguide.com/about",
    },
    publisher: {
      "@type": "Organization",
      name: "Tampa Bay Guide",
      url: "https://tampabayguide.com",
    },
  };
  const faqs = faqJsonLd(article.body);

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      {faqs ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqs) }} />
      ) : null}
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: pillar.title, href: pillar.href },
          { label: article.title, href: `${pillar.href}/${article.slug}` },
        ]}
      />

      <p className="text-[12px] font-semibold uppercase tracking-wide text-gulf-700 mt-6">
        {article.plannerCategory}
      </p>
      <h1 className="font-display font-800 text-[38px] leading-tight text-gulf-900 mt-2 mb-3">
        {article.title}
      </h1>
      <p className="text-lg text-ink-600 mb-2">{article.dek}</p>
      <p className="text-sm text-ink-600 mb-6">
        By Ben · {published}
        {article.readTime ? ` · ${article.readTime}` : ""}
      </p>

      {article.coverImage ? (
        <figure className="mb-8">
          <div className="relative aspect-[16/9] overflow-hidden rounded-[10px]">
            <Image
              src={article.coverImage}
              alt={article.coverAlt || article.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
          {article.coverCredit ? (
            <figcaption className="mt-2 text-sm text-ink-600">{article.coverCredit}</figcaption>
          ) : null}
        </figure>
      ) : null}

      <div className="text-ink-600 leading-relaxed">{children}</div>

      {more.length > 0 ? (
        <section className="mt-16 pt-10 border-t border-line">
          <h2 className="font-display font-700 text-[22px] text-gulf-900 mb-6">
            More from {pillar.title}
          </h2>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            {more.map((item) => (
              <ArticleCard key={item.slug} article={item} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
