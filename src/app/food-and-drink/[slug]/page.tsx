import type { Metadata } from "next";
import { PillarArticlePage } from "@/components/pillars/PillarArticlePage";
import { articleMetadata, articleStaticParams } from "@/lib/article-route";

export function generateStaticParams() {
  return articleStaticParams("food-and-drink");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  return articleMetadata("food-and-drink", params);
}

export default async function FoodAndDrinkArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PillarArticlePage pillar="food-and-drink" slug={slug} />;
}
