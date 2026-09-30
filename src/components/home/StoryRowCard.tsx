import Image from "next/image";
import Link from "next/link";
import { articleHref, PILLAR_META } from "@/lib/pillars";
import type { PillarArticle } from "@/types";

const PILLAR_FALLBACK: Record<string, string> = {
  "things-to-do":
    "https://images.unsplash.com/photo-1566127992631-137a642a90f4?auto=format&fit=crop&w=400&q=80",
  "food-and-drink":
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80",
  events:
    "https://images.unsplash.com/photo-1501612780327-45045538702b?auto=format&fit=crop&w=400&q=80",
  "outdoors-beaches":
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80",
  shopping:
    "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=400&q=80",
  guides:
    "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=400&q=80",
};

export function articleImage(article: PillarArticle) {
  return article.coverImage ?? PILLAR_FALLBACK[article.pillar];
}

export function StoryRowCard({
  article,
  wide = false,
}: {
  article: PillarArticle;
  wide?: boolean;
}) {
  const pillar = PILLAR_META[article.pillar];

  return (
    <Link
      href={articleHref(article)}
      className={[
        "flex gap-3 border border-[#DCE4E3] rounded-lg p-3 items-center bg-white hover:border-gulf-500 transition-hover",
        wide ? "w-[240px] flex-shrink-0 snap-start" : "w-full",
      ].join(" ")}
    >
      <div className="relative size-14 flex-shrink-0 overflow-hidden rounded-lg">
        <Image
          src={articleImage(article)}
          alt=""
          fill
          className="object-cover"
          sizes="56px"
        />
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-[#08343C] leading-snug line-clamp-2">
          {article.title}
        </p>
        <p className="text-[11px] text-[#4A626A] mt-1">{pillar.title}</p>
      </div>
    </Link>
  );
}
