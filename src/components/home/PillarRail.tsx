import Link from "next/link";
import { getArticlesByPillar, PILLAR_META } from "@/lib/pillars";
import { StoryRowCard } from "@/components/home/StoryRowCard";
import type { PillarSlug } from "@/types";

export function PillarRail({ pillar }: { pillar: PillarSlug }) {
  const meta = PILLAR_META[pillar];
  const stories = getArticlesByPillar(pillar);

  return (
    <section className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="flex items-end justify-between gap-4 mb-4">
        <h2 className="font-display font-medium text-[22px] md:text-[26px] text-[#08343C]">
          {meta.title}
        </h2>
        <Link
          href={meta.href}
          className="text-[14px] font-medium text-[#0B5E6B] hover:text-[#1B8B99] shrink-0"
        >
          See all →
        </Link>
      </div>

      {stories.length === 0 ? (
        <div className="rounded-xl border border-[#DCE4E3] bg-[#F2F5F4] px-5 py-10 text-[15px] text-[#4A626A]">
          Featured stories go here once published
        </div>
      ) : (
        <div className="-mx-6 px-6 overflow-x-auto snap-x snap-mandatory">
          <div className="flex gap-4 pr-12">
            {stories.map((article) => (
              <StoryRowCard
                key={`${article.pillar}-${article.slug}`}
                article={article}
                wide
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
