import type { Metadata } from "next";
import { PillarArticlePage } from "@/components/pillars/PillarArticlePage";
import { articleMetadata, articleStaticParams } from "@/lib/article-route";

export function generateStaticParams() {
  return articleStaticParams("things-to-do");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  return articleMetadata("things-to-do", params);
}

export default async function ThingsToDoArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PillarArticlePage pillar="things-to-do" slug={slug} />;
}
