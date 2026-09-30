import { PillarArticlePage } from "@/components/pillars/PillarArticlePage";

export function generateStaticParams() {
  return [];
}

export default async function GuidesArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PillarArticlePage pillar="guides" slug={slug} />;
}
