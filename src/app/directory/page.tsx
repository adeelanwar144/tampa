import type { Metadata } from "next";
import { DirectoryBrowse, type DirectorySearchParams } from "@/components/directory/DirectoryBrowse";
import { SITE_NAME, SITE_URL, withSiteName } from "@/config/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: withSiteName("Directory"),
  description: `Places listed in the ${SITE_NAME}.`,
  alternates: { canonical: `${SITE_URL}/directory` },
};

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<DirectorySearchParams>;
}) {
  const sp = await searchParams;
  return <DirectoryBrowse searchParams={sp} />;
}
