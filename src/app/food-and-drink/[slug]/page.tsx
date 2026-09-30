import { PillarArticlePage } from "@/components/pillars/PillarArticlePage";

export function generateStaticParams() {
  return [];
}

export default async function FoodAndDrinkArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PillarArticlePage pillar="food-and-drink" slug={slug} />;
}
