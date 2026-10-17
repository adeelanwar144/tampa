import type { Metadata } from "next";
import { PillarArticlePage } from "@/components/pillars/PillarArticlePage";
import { articleMetadata, articleStaticParams } from "@/lib/article-route";

export function generateStaticParams() {
  return articleStaticParams("events");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  return articleMetadata("events", params);
}

export default async function EventsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PillarArticlePage pillar="events" slug={slug} />;
}
