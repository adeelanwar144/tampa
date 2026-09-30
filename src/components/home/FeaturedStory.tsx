import Image from "next/image";
import Link from "next/link";
import { articleHref, getPublishedArticles, PILLAR_META } from "@/lib/pillars";
import { neighborhoodFromSlug } from "@/data/neighborhood-photos";
import { articleImage, StoryRowCard } from "@/components/home/StoryRowCard";

function EmptyFeatured() {
  return (
    <div className="rounded-xl border border-[#DCE4E3] bg-[#F2F5F4] px-6 py-16 text-center text-[15px] text-[#4A626A]">
      Featured stories go here once published
    </div>
  );
}

export function FeaturedStory() {
  const published = getPublishedArticles().slice(0, 3);
  const [featured, ...rest] = published;

  return (
    <section id="featured-stories" className="max-w-[1200px] mx-auto px-6 py-12 scroll-mt-[120px]">
      {!featured ? (
        <EmptyFeatured />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-6">
          <Link
            href={articleHref(featured)}
            className="rounded-xl overflow-hidden border border-[#DCE4E3] bg-white hover:border-gulf-500 transition-hover"
          >
            <div className="relative aspect-[16/10]">
              <Image
                src={articleImage(featured)}
                alt={featured.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 60vw"
              />
            </div>
            <div className="p-5">
              <p className="text-[12px] font-semibold text-[#0B5E6B]">
                {PILLAR_META[featured.pillar].title}
              </p>
              <h2 className="font-display font-medium text-[19px] text-[#08343C] leading-snug line-clamp-2 mt-1.5">
                {featured.title}
              </h2>
              <p className="text-[12px] text-[#4A626A] mt-2">
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

          <div className="flex flex-col gap-3">
            {rest.map((article) => (
              <StoryRowCard key={`${article.pillar}-${article.slug}`} article={article} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
