import Image from "next/image";
import Link from "next/link";
import { articleHref, getPublishedArticles, PILLAR_META } from "@/lib/pillars";
import { neighborhoodFromSlug } from "@/data/neighborhood-photos";
import { articleImage } from "@/components/home/StoryRowCard";
import { focusRing } from "@/components/layout/nav";
import type { PillarArticle } from "@/types";

function OverlayCard({ article }: { article: PillarArticle }) {
  const pillar = PILLAR_META[article.pillar];

  return (
    <Link
      href={articleHref(article)}
      className={`group relative block h-full min-h-0 min-w-0 w-full overflow-hidden rounded-xl aspect-[16/10] lg:aspect-auto ${focusRing}`}
    >
      <Image
        src={articleImage(article)}
        alt={article.coverAlt || article.title}
        fill
        className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
        sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 40vw"
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)" }}
      />
      <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[12px] font-semibold leading-none text-white">
        {pillar.title}
      </span>
      <div className="absolute inset-x-0 bottom-0 min-w-0 p-4">
        <h3 className="line-clamp-2 text-[18px] font-semibold leading-snug text-white md:text-[20px] group-hover:underline">
          {article.title}
        </h3>
      </div>
    </Link>
  );
}

export function FeaturedStory() {
  const published = getPublishedArticles().slice(0, 3);
  const [featured, ...rest] = published;
  if (!featured) return null;

  return (
    <section
      id="featured-stories"
      className="mx-auto max-w-[1200px] overflow-x-clip px-6 py-12 scroll-mt-[120px]"
    >
      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-stretch xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] xl:gap-8">
        <Link
          href={articleHref(featured)}
          className="min-w-0 w-full overflow-hidden rounded-xl border border-[#DCE4E3] bg-white transition-hover hover:border-gulf-500"
        >
          <div className="relative aspect-[16/10] min-w-0">
            <Image
              src={articleImage(featured)}
              alt={featured.coverAlt || featured.title}
              fill
              className="object-cover"
              sizes="(max-width: 1023px) 100vw, 60vw"
            />
          </div>
          <div className="min-w-0 p-5">
            <p className="text-[12px] font-semibold text-[#0B5E6B]">
              {PILLAR_META[featured.pillar].title}
            </p>
            <h2 className="mt-1.5 font-display font-medium text-[19px] leading-snug text-[#08343C] line-clamp-2">
              {featured.title}
            </h2>
            <p className="mt-2 text-[12px] text-[#4A626A]">
              {[
                featured.readTime,
                featured.neighborhoodSlug
                  ? neighborhoodFromSlug(featured.neighborhoodSlug)
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </Link>

        <div className="grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-2 lg:h-full lg:grid-cols-1 lg:grid-rows-[1fr_1fr] xl:gap-8">
          {rest.map((article) => (
            <OverlayCard key={`${article.pillar}-${article.slug}`} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}
