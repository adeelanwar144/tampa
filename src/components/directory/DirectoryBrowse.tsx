import { Suspense } from "react";
import Link from "next/link";
import { FilterBar } from "@/components/places/FilterBar";
import { PlaceCard } from "@/components/places/PlaceCard";
import { PlacesPagination } from "@/components/places/PlacesPagination";
import { SortSelect } from "@/components/places/SortSelect";
import { PlacesGridSkeleton } from "@/components/places/PlacesGridSkeleton";
import { CATEGORY_LABELS, getFilteredPlaces } from "@/lib/listings";
import type { CategorySlug, SortOption } from "@/types";

export type DirectorySearchParams = {
  neighborhood?: string;
  q?: string;
  open?: string;
  sort?: string;
  page?: string;
  category?: string;
};

export async function DirectoryBrowse({
  category,
  searchParams,
}: {
  category?: CategorySlug;
  searchParams: DirectorySearchParams;
}) {
  const neighborhood = searchParams.neighborhood;
  const q = searchParams.q;
  const open = searchParams.open === "true";
  const sort = (searchParams.sort as SortOption) ?? "best-overall";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const basePath = category ? `/directory/${category}` : "/directory";

  const result = await getFilteredPlaces({ category, neighborhood, q, open, sort, page });
  const heading = category ? CATEGORY_LABELS[category] : "Directory";

  function buildHref(p: number) {
    const params = new URLSearchParams();
    if (neighborhood) params.set("neighborhood", neighborhood);
    if (q) params.set("q", q);
    if (open) params.set("open", "true");
    if (sort && sort !== "best-overall") params.set("sort", sort);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  }

  return (
    <>
      <section
        className="w-full pt-8 pb-10 md:pt-10 md:pb-12"
        style={{
          background: "linear-gradient(135deg, #08343C 0%, #0B5E6B 55%, #14707E 100%)",
        }}
      >
        <div className="mx-auto max-w-[1200px] px-6 text-center">
          <h1 className="font-display text-[34px] font-bold leading-[1.12] tracking-[-0.02em] text-white md:text-[44px]">
            {heading}
          </h1>
          <p className="mx-auto mt-3 max-w-[640px] text-[16px] text-[#CFE4E6] md:text-[18px]">
            Content for this section is in progress.
          </p>
        </div>
      </section>

      <Suspense fallback={<div className="h-[88px] border-b border-line bg-white" />}>
        <FilterBar
          currentCategory={category}
          currentNeighborhood={neighborhood}
          currentQ={q}
          currentOpen={open}
        />
      </Suspense>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 pt-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <h2 className="font-display font-700 text-[22px] text-gulf-900">
              {result.total} {result.total === 1 ? "place" : "places"} found
            </h2>
          </div>
          <Suspense fallback={null}>
            <SortSelect currentSort={sort} />
          </Suspense>
        </div>

        <Suspense fallback={<PlacesGridSkeleton />}>
          {result.total === 0 ? (
            <div className="py-20 flex flex-col items-center text-center gap-4">
              <p className="text-ink-600 text-sm">No results found.</p>
              <Link
                href="/directory"
                className="px-5 py-2.5 rounded-[var(--radius-btn)] bg-gulf-700 text-white text-sm font-medium hover:bg-gulf-500 transition-hover"
              >
                Browse the directory
              </Link>
            </div>
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
                </div>
              )}
            </>
          )}
        </Suspense>
      </div>
    </>
  );
}
