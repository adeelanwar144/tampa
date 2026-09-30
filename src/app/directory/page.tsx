import type { Metadata } from "next";
import { DirectoryBrowse, type DirectorySearchParams } from "@/components/directory/DirectoryBrowse";

export const metadata: Metadata = {
  title: "Directory — Tampa Bay Guide",
  description: "Content for this section is in progress.",
};

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<DirectorySearchParams>;
}) {
  const sp = await searchParams;
  return <DirectoryBrowse searchParams={sp} />;
}
