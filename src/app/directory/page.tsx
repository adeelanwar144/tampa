import type { Metadata } from "next";
import { DirectoryBrowse, type DirectorySearchParams } from "@/components/directory/DirectoryBrowse";
import { SITE_URL } from "@/config/site";
import { getAllPlaces, isOpenNow } from "@/lib/listings";
import {
  canonicalUrl,
  directoryIndexMeta,
  filteredListingMeta,
  matchingPlaces,
  parsePage,
} from "@/lib/directory-seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<DirectorySearchParams>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const places = await getAllPlaces();
  const filtered = Boolean(
    sp.neighborhood || sp.q || sp.open === "true" || (sp.sort && sp.sort !== "best-overall"),
  );
  const meta = filtered
    ? filteredListingMeta({
        label: "Directory",
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
    : directoryIndexMeta(places, page);
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: filtered
        ? canonicalUrl("/directory", sp, page)
        : page > 1
          ? `${SITE_URL}/directory?page=${page}`
          : `${SITE_URL}/directory`,
    },
  };
}

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<DirectorySearchParams>;
}) {
  const sp = await searchParams;
  return <DirectoryBrowse searchParams={sp} />;
}
