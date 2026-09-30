import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, Phone, Globe, ChevronRight } from "lucide-react";
import {
  getPlaceBySlug,
  getAllPlaces,
  getRelatedPlaces,
  formatTime,
  CATEGORY_LABELS,
} from "@/lib/listings";
import { PlaceCard } from "@/components/places/PlaceCard";
import { StatusBadge } from "@/components/places/PlaceLiveStatus";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return (await getAllPlaces()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const place = await getPlaceBySlug(slug);
  if (!place) return {};

  return {
    title: `${place.name} — Tampa Bay Guide`,
    description: place.tagline,
    openGraph: {
      title: place.name,
      description: place.tagline,
      images: place.images[0] ? [{ url: place.images[0] }] : [],
      type: "article",
    },
    twitter: { card: "summary_large_image" },
  };
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default async function PlaceDetailPage({ params }: Props) {
  const { slug } = await params;
  const place = await getPlaceBySlug(slug);
  if (!place) notFound();

  const related = await getRelatedPlaces(place, 3);
  const now = new Date();
  const todayDow = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
  })
    .formatToParts(now)
    .find((p) => p.type === "weekday")?.value;
  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const todayIdx = weekdayMap[todayDow ?? "Sun"] ?? 0;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: place.name,
    description: place.tagline,
    address: { "@type": "PostalAddress", streetAddress: place.address },
    geo: { "@type": "GeoCoordinates", latitude: place.lat, longitude: place.lng },
    telephone: place.phone,
    url: place.website,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: place.rating,
      reviewCount: place.reviewCount,
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://tampabayguide.com" },
      { "@type": "ListItem", position: 2, name: "Places", item: "https://tampabayguide.com/places" },
      {
        "@type": "ListItem",
        position: 3,
        name: CATEGORY_LABELS[place.category],
        item: `https://tampabayguide.com/places?category=${place.category}`,
      },
      { "@type": "ListItem", position: 4, name: place.name },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-ink-600 mb-6 flex-wrap">
          <Link href="/" className="hover:text-gulf-700 transition-hover">Home</Link>
          <ChevronRight size={14} className="opacity-40" />
          <Link href="/places" className="hover:text-gulf-700 transition-hover">Places</Link>
          <ChevronRight size={14} className="opacity-40" />
          <Link href={`/places?category=${place.category}`} className="hover:text-gulf-700 transition-hover">
            {CATEGORY_LABELS[place.category]}
          </Link>
          <ChevronRight size={14} className="opacity-40" />
          <span className="text-gulf-900 font-medium">{place.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-10">
          <div>
            <div className="grid grid-cols-3 gap-2 mb-8">
              <div className="col-span-2 relative rounded-[var(--radius-img)] overflow-hidden aspect-[4/3]">
                {place.images[0] && (
                  <Image
                    src={place.images[0]}
                    alt={`Main photo of ${place.name}`}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 66vw"
                  />
                )}
              </div>
              <div className="grid grid-rows-2 gap-2">
                {[1, 2].map((i) =>
                  place.images[i] ? (
                    <div key={i} className="relative rounded-[var(--radius-img)] overflow-hidden">
                      <Image
                        src={place.images[i]}
                        alt={`Photo ${i + 1} of ${place.name}`}
                        fill
                        className="object-cover"
                        sizes="25vw"
                      />
                    </div>
                  ) : (
                    <div key={i} className="rounded-[var(--radius-img)] bg-gulf-50" />
                  )
                )}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm font-medium text-ink-600 mb-1.5">
                {CATEGORY_LABELS[place.category]} · {place.subcategory} · {place.neighborhood}
              </p>
              <h1 className="font-display font-800 text-[38px] leading-tight text-gulf-900 mb-3">
                {place.name}
              </h1>

              <div className="flex items-center flex-wrap gap-x-3 gap-y-2 text-sm text-ink-600 mb-4">
                <span className="flex items-center gap-1">
                  <Star size={15} fill="#D8A02E" stroke="none" />
                  <span className="font-semibold text-gulf-900">{place.rating.toFixed(1)}</span>
                  <span>({place.reviewCount.toLocaleString("en-US")} reviews)</span>
                </span>
                <span className="opacity-40">·</span>
                <span>{"$".repeat(place.priceLevel)}</span>
                <span className="opacity-40">·</span>
                <span className="flex items-center gap-1">
                  <MapPin size={13} className="text-gulf-500" />
                  {place.neighborhood}
                </span>
              </div>

              <StatusBadge place={place} />
            </div>

            <div className="max-w-none mb-8 space-y-4">
              {place.description.split("\n\n").map((para, i) => (
                <p key={i} className="text-ink-600 leading-relaxed text-base">
                  {para}
                </p>
              ))}
            </div>

            {place.tags.length > 0 && (
              <div className="mb-8">
                <h2 className="font-display font-700 text-base text-gulf-900 mb-3">
                  What to know
                </h2>
                <ul className="grid grid-cols-2 gap-2">
                  {place.tags.map((tag) => (
                    <li
                      key={tag}
                      className="flex items-center gap-2 text-sm text-ink-600 bg-gulf-50 rounded-[var(--radius-btn)] px-3 py-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-gulf-700 flex-shrink-0" />
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-line rounded-[var(--radius-card)] p-5 sticky top-24">
              <h2 className="font-display font-700 text-base text-gulf-900 mb-4">Hours</h2>
              <table className="w-full text-sm mb-5" aria-label="Weekly hours">
                <tbody>
                  {DAY_NAMES.map((day, i) => {
                    const dayHours = place.hours[i];
                    const isToday = i === todayIdx;
                    return (
                      <tr
                        key={day}
                        className={isToday ? "font-semibold text-gulf-900" : "text-ink-600"}
                      >
                        <td className="py-1 pr-4 w-28">
                          {isToday ? <span className="text-gulf-700">{day}</span> : day}
                        </td>
                        <td className="py-1">
                          {dayHours
                            ? `${formatTime(dayHours.open)} – ${formatTime(dayHours.close)}`
                            : "Closed"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="border-t border-line pt-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-ink-600 mb-1">Address</p>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gulf-700 hover:text-gulf-500 transition-hover"
                  >
                    {place.address}
                  </a>
                </div>

                {place.phone && (
                  <div>
                    <p className="text-xs font-medium text-ink-600 mb-1">Phone</p>
                    <a
                      href={`tel:${place.phone}`}
                      className="flex items-center gap-1.5 text-sm text-gulf-700 hover:text-gulf-500 transition-hover"
                    >
                      <Phone size={13} />
                      {place.phone}
                    </a>
                  </div>
                )}

                {place.website && (
                  <div>
                    <p className="text-xs font-medium text-ink-600 mb-1">Website</p>
                    <a
                      href={place.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-gulf-700 hover:text-gulf-500 transition-hover"
                    >
                      <Globe size={13} />
                      Visit website
                    </a>
                  </div>
                )}

                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-btn)] bg-gulf-700 text-white text-sm font-medium hover:bg-gulf-500 transition-hover"
                >
                  <MapPin size={14} />
                  Open in Google Maps
                </a>
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16 pt-8 border-t border-line">
            <h2 className="font-display font-700 text-[22px] text-gulf-900 mb-6">
              More places in {place.neighborhood}
            </h2>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {related.map((p) => (
                <PlaceCard key={p.id} place={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
