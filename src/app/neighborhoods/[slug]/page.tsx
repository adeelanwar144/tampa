import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PlaceCard } from "@/components/places/PlaceCard";
import { getPlacesInNeighborhood, NEIGHBORHOODS } from "@/lib/listings";
import { neighborhoodFromSlug, neighborhoodSlug } from "@/data/neighborhoods";
import { SITE_URL } from "@/config/site";
import { neighborhoodMeta } from "@/lib/directory-seo";

export const dynamic = "force-dynamic";

function unslugify(slug: string) {
  return neighborhoodFromSlug(slug) ?? NEIGHBORHOODS.find((n) => neighborhoodSlug(n) === slug);
}

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const name = unslugify(slug);
  if (!name) return {};
  const places = await getPlacesInNeighborhood(name);
  const meta = neighborhoodMeta(name, places);
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: `${SITE_URL}/neighborhoods/${slug}` },
  };
}

export default async function NeighborhoodPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const name = unslugify(slug);
  if (!name) notFound();

  const places = await getPlacesInNeighborhood(name);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Neighborhoods", item: `${SITE_URL}/neighborhoods` },
      { "@type": "ListItem", position: 3, name },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-ink-600 mb-6">
          <Link href="/" className="hover:text-gulf-700 transition-hover">Home</Link>
          <ChevronRight size={14} className="opacity-40" />
          <Link href="/neighborhoods" className="hover:text-gulf-700 transition-hover">Neighborhoods</Link>
          <ChevronRight size={14} className="opacity-40" />
          <span className="text-gulf-900 font-medium">{name}</span>
        </nav>

        <h1 className="font-display font-800 text-[38px] md:text-[52px] text-gulf-900 mb-2">
          {name}
        </h1>
        <p className="text-ink-600 mb-8">
          {places.length} {places.length === 1 ? "place" : "places"} in this neighborhood
        </p>

        {places.length === 0 ? (
          <p className="text-ink-600">No listings yet. Check back soon.</p>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {places.map((p) => (
              <PlaceCard key={p.id} place={p} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
