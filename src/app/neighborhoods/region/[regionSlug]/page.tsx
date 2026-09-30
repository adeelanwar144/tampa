import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ regionSlug: string }>;
}): Promise<Metadata> {
  const { regionSlug } = await params;
  return {
    title: `${titleFromSlug(regionSlug)} — Tampa Bay Guide`,
    description: "Content for this section is in progress.",
  };
}

export default async function RegionPage({
  params,
}: {
  params: Promise<{ regionSlug: string }>;
}) {
  const { regionSlug } = await params;
  const title = titleFromSlug(regionSlug);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Neighborhoods", href: "/neighborhoods" },
          { label: title, href: `/neighborhoods/region/${regionSlug}` },
        ]}
      />
      <h1 className="font-display font-800 text-[38px] md:text-[52px] text-gulf-900 mt-6 mb-4">
        {title}
      </h1>
      <p className="text-ink-600 leading-relaxed">Content for this section is in progress.</p>
    </div>
  );
}
