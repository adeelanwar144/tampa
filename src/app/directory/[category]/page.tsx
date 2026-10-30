import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DirectoryBrowse, type DirectorySearchParams } from "@/components/directory/DirectoryBrowse";
import { CATEGORY_LABELS, getPlacesByCategory, isOpenNow } from "@/lib/listings";
import { SITE_URL } from "@/config/site";
import {
  CATEGORY_SEO_LABEL,
  canonicalUrl,
  categoryMeta,
  filteredListingMeta,
  matchingPlaces,
  parsePage,
} from "@/lib/directory-seo";
import type { CategorySlug } from "@/types";

const VALID_CATEGORIES = Object.keys(CATEGORY_LABELS) as CategorySlug[];

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<DirectorySearchParams>;
}): Promise<Metadata> {
  const { category } = await params;
  const label = CATEGORY_LABELS[category as CategorySlug];
  if (!label) return {};
  const cat = category as CategorySlug;
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const places = await getPlacesByCategory(cat);
  const filtered = Boolean(
    sp.neighborhood || sp.q || sp.open === "true" || (sp.sort && sp.sort !== "best-overall"),
  );
  const meta = filtered
    ? filteredListingMeta({
        label: CATEGORY_SEO_LABEL[cat],
        places: matchingPlaces(
          places,
          { neighborhood: sp.neighborhood, q: sp.q, open: sp.open === "true" },
          isOpenNow,
        ),
        page,
        neighborhood: sp.neighborhood,
        q: sp.q,
        open: sp.open === "true",
        sort: sp.sort,
      })
    : categoryMeta(cat, places, page);
  const canonical = filtered
    ? canonicalUrl(`/directory/${cat}`, sp, page)
    : page > 1
      ? `${SITE_URL}/directory/${cat}?page=${page}`
      : `${SITE_URL}/directory/${cat}`;
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical },
  };
}

export default async function DirectoryCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<DirectorySearchParams>;
}) {
  const { category } = await params;
  if (!VALID_CATEGORIES.includes(category as CategorySlug)) notFound();

  const sp = await searchParams;
  return <DirectoryBrowse category={category as CategorySlug} searchParams={sp} />;
}
