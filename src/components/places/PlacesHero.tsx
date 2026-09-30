import { Suspense } from "react";
import { CATEGORY_LABELS } from "@/lib/listings";
import { CategorySlug } from "@/types";
import { HeroSearchCard } from "@/components/places/HeroSearchCard";

export function PlacesHero({ category }: { category?: CategorySlug }) {
  const headline =
    category && CATEGORY_LABELS[category]
      ? `${CATEGORY_LABELS[category]} in Tampa`
      : "Places to go in Tampa";

  return (
    <section
      className="w-full pt-10 pb-14 md:pt-16 md:pb-20"
      style={{
        background: "linear-gradient(135deg, #08343C 0%, #0B5E6B 55%, #14707E 100%)",
      }}
    >
      <div className="mx-auto max-w-[1200px] px-6 text-center">
        <h1 className="font-display text-[34px] font-bold leading-[1.12] tracking-[-0.02em] text-white md:text-[52px]">
          {headline}
        </h1>
        <p className="mx-auto mt-4 max-w-[640px] text-[16px] text-[#CFE4E6] md:text-[20px]">
          Every restaurant, bar, beach, and shop we&apos;ve walked into — filtered how you like.
        </p>
        <Suspense
          fallback={
            <div className="mx-auto mt-10 h-[84px] max-w-[1000px] rounded-2xl bg-[#F2F5F4]/80" />
          }
        >
          <HeroSearchCard />
        </Suspense>
      </div>
    </section>
  );
}
