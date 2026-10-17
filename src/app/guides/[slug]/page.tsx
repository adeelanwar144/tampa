import type { Metadata } from "next";
import { PillarArticlePage } from "@/components/pillars/PillarArticlePage";
import { articleMetadata, articleStaticParams } from "@/lib/article-route";

export function generateStaticParams() {
  return articleStaticParams("guides");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  return articleMetadata("guides", params);
}

export default async function GuidesArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PillarArticlePage pillar="guides" slug={slug} />;
}
