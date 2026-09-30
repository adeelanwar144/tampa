import { PillarArticlePage } from "@/components/pillars/PillarArticlePage";

export function generateStaticParams() {
  return [];
}

export default async function ShoppingArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PillarArticlePage pillar="shopping" slug={slug} />;
}
