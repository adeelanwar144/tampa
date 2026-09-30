import type { Metadata } from "next";
import { PlaceCard } from "@/components/places/PlaceCard";
import { getAllPlaces, getAllGuides } from "@/lib/listings";
import Link from "next/link";
import Image from "next/image";
import { SearchForm } from "./SearchForm";

export const metadata: Metadata = {
  title: "Search — Tampa Bay Guide",
  description: "Search Tampa restaurants, bars, beaches, shops, and guides.",
  robots: { index: false },
};

interface SearchParams {
  q?: string;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();

  const places = q
    ? (await getAllPlaces()).filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q) ||
          p.neighborhood.toLowerCase().includes(q) ||
          p.subcategory.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      )
    : [];

  const guides = q
    ? getAllGuides().filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.excerpt.toLowerCase().includes(q)
      )
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-display font-800 text-[38px] text-gulf-900 mb-6">Search</h1>
      <SearchForm initialQ={sp.q ?? ""} />

      {q && (
        <p className="mt-6 mb-8 text-sm text-ink-600">
          {places.length + guides.length}{" "}
          {places.length + guides.length === 1 ? "result" : "results"} for &quot;{sp.q}&quot;
        </p>
      )}

      {!q && (
        <p className="mt-8 text-ink-600">
          Search across places and guides. Try a neighborhood, a cuisine, or a tag like &quot;dog friendly&quot;.
        </p>
      )}

      {q && places.length === 0 && guides.length === 0 && (
        <div className="py-16 text-center">
          <h2 className="font-display font-700 text-[22px] text-gulf-900 mb-2">
            Nothing matches those filters
          </h2>
          <p className="text-sm text-ink-600 mb-6">
            No results for &quot;{sp.q}&quot;. Try a different keyword or browse the full directory.
          </p>
          <Link
            href="/places"
            className="px-5 py-2.5 rounded-[var(--radius-btn)] bg-gulf-700 text-white text-sm font-medium hover:bg-gulf-500 transition-hover"
          >
            Browse all places
          </Link>
        </div>
      )}

      {places.length > 0 && (
        <section className="mb-12">
          <h2 className="font-display font-700 text-[22px] text-gulf-900 mb-4">Places</h2>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {places.slice(0, 12).map((p) => (
              <PlaceCard key={p.id} place={p} />
            ))}
          </div>
        </section>
      )}

      {guides.length > 0 && (
        <section>
          <h2 className="font-display font-700 text-[22px] text-gulf-900 mb-4">Guides</h2>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            {guides.map((g) => (
              <article
                key={g.id}
                className="bg-white border border-line rounded-[var(--radius-card)] overflow-hidden hover:border-gulf-500 hover:-translate-y-0.5 transition-hover"
              >
                <div className="relative aspect-[16/10]">
                  <Image src={g.coverImage} alt={`Cover for ${g.title}`} fill className="object-cover" sizes="33vw" />
                </div>
                <div className="p-4">
                  <h3 className="font-display font-700 text-[18px]">
                    <Link href={`/guides/${g.slug}`}>{g.title}</Link>
                  </h3>
                  <p className="text-sm text-ink-600 mt-1 line-clamp-2">{g.excerpt}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
