import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, Bookmark } from "lucide-react";
import { Place } from "@/types";
import { CATEGORY_LABELS } from "@/lib/listings";
import { StatusChip, TodayHours } from "@/components/places/PlaceLiveStatus";

function PriceLevel({ level }: { level: 1 | 2 | 3 | 4 }) {
  return (
    <span className="text-ink-600" aria-label={`Price level ${level} of 4`}>
      {"$".repeat(level)}
      <span className="opacity-30">{"$".repeat(4 - level)}</span>
    </span>
  );
}

export function PlaceCard({ place }: { place: Place }) {
  const image = place.images[0];

  return (
    <article className="bg-white border border-line rounded-[var(--radius-card)] overflow-hidden flex flex-col group transition-hover hover:border-gulf-500 hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-gulf-500 focus-within:ring-offset-2">
      <div className="relative w-full" style={{ paddingBottom: "62.5%" }}>
        {image ? (
          <Image
            src={image}
            alt={`Photo of ${place.name}`}
            fill
            className="object-cover rounded-t-[var(--radius-card)]"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gulf-50 rounded-t-[var(--radius-card)]" />
        )}
        <StatusChip place={place} />
        <button
          aria-label={`Save ${place.name}`}
          className="absolute top-2 right-2 p-1.5 rounded-[var(--radius-btn)] bg-white/80 backdrop-blur-sm text-gulf-700 hover:bg-white hover:text-gulf-500 transition-hover"
        >
          <Bookmark size={15} />
        </button>
      </div>

      <div className="flex flex-col flex-1 p-4 gap-2">
        <p className="text-[11px] font-medium text-ink-600">
          {CATEGORY_LABELS[place.category]} · {place.subcategory}
        </p>

        <h3 className="font-display font-700 text-[18px] leading-tight text-gulf-900 line-clamp-2">
          <Link
            href={`/places/${place.slug}`}
            className="hover:text-gulf-700 transition-hover focus:outline-none focus-visible:underline"
          >
            {place.name}
          </Link>
        </h3>

        <p className="text-sm text-ink-600 line-clamp-2 leading-snug">{place.tagline}</p>

        <div className="flex items-center flex-wrap gap-x-1.5 gap-y-1 text-sm text-ink-600 mt-auto pt-1">
          <Star size={13} fill="#D8A02E" stroke="none" aria-hidden="true" />
          <span className="font-medium text-gulf-900">{place.rating.toFixed(1)}</span>
          <span className="text-ink-600">({place.reviewCount.toLocaleString("en-US")})</span>
          <span className="opacity-40" aria-hidden="true">·</span>
          <PriceLevel level={place.priceLevel} />
          <span className="opacity-40" aria-hidden="true">·</span>
          <MapPin size={12} className="text-gulf-500" aria-hidden="true" />
          <span>{place.neighborhood}</span>
        </div>

        {place.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {place.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-pill)] text-[11px] font-medium bg-gulf-50 text-gulf-700 border border-line"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-line mt-1">
          <TodayHours place={place} />
          <Link
            href={`/places/${place.slug}`}
            tabIndex={-1}
            aria-hidden="true"
            className="text-[12px] font-medium text-gulf-700 hover:text-gulf-500 transition-hover"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
