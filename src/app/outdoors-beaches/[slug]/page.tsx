import type { Metadata } from "next";
import { PillarArticlePage } from "@/components/pillars/PillarArticlePage";
import { articleMetadata, articleStaticParams } from "@/lib/article-route";

export function generateStaticParams() {
  return articleStaticParams("outdoors-beaches");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  return articleMetadata("outdoors-beaches", params);
}

export default async function OutdoorsBeachesArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PillarArticlePage pillar="outdoors-beaches" slug={slug} />;
}
