"use client";

import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { articleHref } from "@/lib/pillars";
import { articleImage } from "@/components/home/StoryRowCard";
import { focusRing } from "@/components/layout/nav";
import type { PillarArticle } from "@/types";

const BLUR =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 10'%3E%3Crect width='16' height='10' fill='%23DCE4E3'/%3E%3C/svg%3E";

const SLIDE =
  "min-w-0 shrink-0 grow-0 basis-[86.956%] sm:basis-[calc((100%-1.5rem)/2)] lg:basis-[calc((100%-3rem)/3)] xl:basis-[calc((100%-4.5rem)/4)]";

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function readLabel(article: PillarArticle): string {
  const minutes = Math.max(1, Math.round(wordCount(article.body || article.dek) / 230));
  const date = new Date(article.publishedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  return `${minutes} min read · ${date}`;
}

function SkeletonCard() {
  return (
    <div className={`${SLIDE}`}>
      <div className="h-full overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(8,52,60,0.08)]">
        <div className="aspect-[16/10] animate-pulse bg-[#DCE4E3]" />
        <div className="space-y-3 p-5">
          <div className="h-5 w-4/5 animate-pulse rounded bg-[#DCE4E3]" />
          <div className="h-4 w-full animate-pulse rounded bg-[#E8F2F3]" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-[#E8F2F3]" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-[#E8F2F3]" />
        </div>
      </div>
    </div>
  );
}

function PostCard({ article, category }: { article: PillarArticle; category: string }) {
  return (
    <Link
      href={articleHref(article)}
      className={`group flex h-full flex-col overflow-hidden rounded-2xl bg-white text-[#08343C] shadow-[0_8px_24px_rgba(8,52,60,0.08)] transition-all duration-200 ease-out motion-reduce:transition-none hover:-translate-y-1 hover:text-[#08343C] hover:shadow-[0_12px_32px_rgba(8,52,60,0.14)] ${focusRing}`}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={articleImage(article)}
          alt={article.coverAlt || article.title}
          fill
          placeholder="blur"
          blurDataURL={BLUR}
          loading="lazy"
          className="object-cover transition-transform duration-200 ease-out motion-reduce:transition-none group-hover:scale-[1.04]"
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 87vw"
        />
        <span className="absolute left-3 top-3 z-10 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white">
          {article.plannerCategory || category}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-[18px] font-semibold leading-snug text-[#08343C]">{article.title}</h3>
        <p className="mt-2 line-clamp-2 max-w-none text-[14px] leading-relaxed text-[#4A626A] md:text-[15px]">
          {article.metaDescription || article.dek}
        </p>
        <p className="mt-auto pt-3 text-[12px] text-[#4A626A]">{readLabel(article)}</p>
      </div>
    </Link>
  );
}

export function BlogSlider({
  title,
  description,
  href,
  articles,
  loading = false,
}: {
  title: string;
  description: string;
  href: string;
  articles: PillarArticle[];
  loading?: boolean;
}) {
  const posts = articles.slice(0, 8);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    duration: 25,
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);

  const sync = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
    setSelected(emblaApi.selectedScrollSnap());
    setSnaps(emblaApi.scrollSnapList());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) emblaApi.reInit({ duration: 0, align: "start", containScroll: "trimSnaps" });
    sync();
    emblaApi.on("select", sync);
    emblaApi.on("reInit", sync);
    return () => {
      emblaApi.off("select", sync);
      emblaApi.off("reInit", sync);
    };
  }, [emblaApi, sync]);

  if (!loading && posts.length < 2) return null;

  return (
    <section
      className="mx-auto w-full max-w-[1200px] overflow-x-clip px-4 py-7 md:px-6 md:py-10"
      aria-roledescription="carousel"
      aria-label={`${title} posts`}
    >
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-[22px] font-medium text-[#08343C] md:text-[26px]">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-none text-[14px] text-[#4A626A] md:text-[15px]">{description}</p>
          ) : null}
        </div>
        <div className="hidden shrink-0 items-center gap-3 sm:flex">
          <Link href={href} className={`text-[14px] font-medium text-[#0B5E6B] hover:text-[#1B8B99] ${focusRing}`}>
            See all →
          </Link>
          <button
            type="button"
            aria-label={`Previous ${title} posts`}
            disabled={!canPrev}
            onClick={() => emblaApi?.scrollPrev()}
            className={`inline-flex size-10 items-center justify-center rounded-full border border-[#DCE4E3] bg-white text-[#08343C] disabled:pointer-events-none disabled:opacity-40 ${focusRing}`}
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label={`Next ${title} posts`}
            disabled={!canNext}
            onClick={() => emblaApi?.scrollNext()}
            className={`inline-flex size-10 items-center justify-center rounded-full border border-[#DCE4E3] bg-white text-[#08343C] disabled:pointer-events-none disabled:opacity-40 ${focusRing}`}
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex items-stretch gap-4 md:gap-6">
          {loading
            ? Array.from({ length: 4 }, (_, index) => <SkeletonCard key={index} />)
            : [
                ...posts.map((article) => (
                  <div key={`${article.pillar}-${article.slug}`} className={SLIDE}>
                    <PostCard article={article} category={title} />
                  </div>
                )),
                <div key={`${title}-see-all`} className={SLIDE}>
                  <Link
                    href={href}
                    className={`flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl bg-white p-5 text-center shadow-[0_8px_24px_rgba(8,52,60,0.08)] transition-all duration-200 ease-out motion-reduce:transition-none hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(8,52,60,0.14)] ${focusRing}`}
                  >
                    <span className="text-[18px] font-semibold text-[#0B5E6B]">See all {title} →</span>
                  </Link>
                </div>,
              ]}
        </div>
      </div>

      {!loading && snaps.length > 1 ? (
        <div className="mt-4 flex justify-center gap-2 sm:hidden" aria-hidden="true">
          {snaps.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to ${title} slide ${index + 1}`}
              onClick={() => emblaApi?.scrollTo(index)}
              className={`size-2 rounded-full ${index === selected ? "bg-[#0B5E6B]" : "bg-[#DCE4E3]"}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
