import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DirectoryBrowse, type DirectorySearchParams } from "@/components/directory/DirectoryBrowse";
import { CATEGORY_LABELS } from "@/lib/listings";
import { SITE_NAME, SITE_URL, withSiteName } from "@/config/site";
import type { CategorySlug } from "@/types";

const VALID_CATEGORIES = Object.keys(CATEGORY_LABELS) as CategorySlug[];

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const label = CATEGORY_LABELS[category as CategorySlug];
  if (!label) return {};
  return {
    title: withSiteName(label),
    description: `${label} listed in the ${SITE_NAME}.`,
    alternates: { canonical: `${SITE_URL}/directory/${category}` },
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
