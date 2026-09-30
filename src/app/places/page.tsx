import { Suspense } from "react";
import type { Metadata } from "next";
import { FilterBar } from "@/components/places/FilterBar";
import { PlaceCard } from "@/components/places/PlaceCard";
import { PlacesPagination } from "@/components/places/PlacesPagination";
import { SortSelect } from "@/components/places/SortSelect";
import { PlacesGridSkeleton } from "@/components/places/PlacesGridSkeleton";
import { PlacesHero } from "@/components/places/PlacesHero";
import {
  getFilteredPlaces,
  CATEGORY_LABELS,
} from "@/lib/listings";
import { CategorySlug, SortOption } from "@/types";
import Link from "next/link";

interface SearchParams {
  category?: string;
  neighborhood?: string;
  q?: string;
  open?: string;
  sort?: string;
  page?: string;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const parts: string[] = [];
  if (sp.category && CATEGORY_LABELS[sp.category as CategorySlug]) {
    parts.push(CATEGORY_LABELS[sp.category as CategorySlug]);
  }
  if (sp.neighborhood) {
    parts.push(parts.length ? `in ${sp.neighborhood}` : `Places in ${sp.neighborhood}`);
  }

  const title = parts.length
    ? `${parts.join(" ")} — Tampa Bay Guide`
    : "Places in Tampa — Tampa Bay Guide";

  const noindex = !!(sp.page && parseInt(sp.page, 10) > 1) || !!sp.q;

  return {
    title,
    description:
      "Browse Tampa's restaurants, bars, beaches, museums, and shops — filtered, sorted, and always up to date.",
    robots: noindex ? { index: false } : undefined,
    alternates: { canonical: "https://tampabayguide.com/places" },
  };
}

export default async function PlacesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const category = sp.category as CategorySlug | undefined;
  const neighborhood = sp.neighborhood;
  const q = sp.q;
  const open = sp.open === "true";
  const sort = (sp.sort as SortOption) ?? "best-overall";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const result = await getFilteredPlaces({ category, neighborhood, q, open, sort, page });

  function buildHref(p: number) {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (neighborhood) params.set("neighborhood", neighborhood);
    if (q) params.set("q", q);
    if (open) params.set("open", "true");
    if (sort && sort !== "best-overall") params.set("sort", sort);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/places${qs ? `?${qs}` : ""}`;
  }

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Places in Tampa",
    numberOfItems: result.total,
    itemListElement: result.places.map((place, i) => ({
      "@type": "ListItem",
      position: result.start + i,
      name: place.name,
      url: `https://tampabayguide.com/places/${place.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
      <PlacesHero category={category} />
      <Suspense fallback={<div className="h-[88px] border-b border-line bg-white" />}>
        <FilterBar
          currentCategory={category}
          currentNeighborhood={neighborhood}
          currentQ={q}
          currentOpen={open}
        />
      </Suspense>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 pt-10">

        <div
          id="results"
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6"
        >
          <div>
            <h2 className="font-display font-700 text-[22px] text-gulf-900">
              {result.total} {result.total === 1 ? "place" : "places"} found
            </h2>
            {result.total > 0 && (
              <p className="text-sm text-ink-600 mt-0.5">
                Showing {result.start}–{result.end} of {result.total}
              </p>
            )}
          </div>
          <Suspense fallback={null}>
            <SortSelect currentSort={sort} />
          </Suspense>
        </div>

        <Suspense fallback={<PlacesGridSkeleton />}>
          {result.total === 0 ? (
            <EmptyState
              category={category}
              neighborhood={neighborhood}
              q={q}
              open={open}
            />
          ) : (
            <>
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {result.places.map((place) => (
                  <PlaceCard key={place.id} place={place} />
                ))}
              </div>
              {result.totalPages > 1 && (
                <div className="mt-12 flex flex-col items-center gap-4">
                  <PlacesPagination
                    currentPage={result.page}
                    totalPages={result.totalPages}
                    buildHref={buildHref}
                  />
                  <p className="text-sm text-ink-600">
                    Showing {result.start} to {result.end} of {result.total} results
                  </p>
                </div>
              )}
            </>
          )}
        </Suspense>
      </div>
    </>
  );
}

function EmptyState({
  category,
  neighborhood,
  q,
  open,
}: {
  category?: CategorySlug;
  neighborhood?: string;
  q?: string;
  open?: boolean;
}) {
  const activeFilters: string[] = [];
  if (category) activeFilters.push(CATEGORY_LABELS[category]);
  if (neighborhood) activeFilters.push(neighborhood);
  if (q) activeFilters.push(`"${q}"`);
  if (open) activeFilters.push("open now");

  return (
    <div className="py-20 flex flex-col items-center text-center gap-4">
      <h3 className="font-display font-700 text-[22px] text-gulf-900">
        Nothing matches those filters
      </h3>
      <p className="text-ink-600 text-sm max-w-sm">
        {activeFilters.length > 0
          ? `No results for ${activeFilters.join(", ")}. Try removing a filter or browsing everything.`
          : "No results found. Try browsing all places."}
      </p>
      <div className="flex flex-wrap gap-3 justify-center mt-2">
        <Link
          href="/places"
          className="px-5 py-2.5 rounded-[var(--radius-btn)] bg-white border border-line text-sm font-medium text-gulf-700 hover:border-gulf-500 transition-hover"
        >
          Clear filters
        </Link>
        <Link
          href="/places"
          className="px-5 py-2.5 rounded-[var(--radius-btn)] bg-gulf-700 text-white text-sm font-medium hover:bg-gulf-500 transition-hover"
        >
          Browse all places
        </Link>
      </div>
    </div>
  );
}
