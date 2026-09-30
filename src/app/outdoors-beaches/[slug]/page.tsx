import { PillarArticlePage } from "@/components/pillars/PillarArticlePage";

export function generateStaticParams() {
  return [];
}

export default async function OutdoorsBeachesArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PillarArticlePage pillar="outdoors-beaches" slug={slug} />;
}
