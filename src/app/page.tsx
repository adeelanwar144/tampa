import type { Metadata } from "next";
import { FeaturedStory } from "@/components/home/FeaturedStory";
import { HomeHero } from "@/components/home/HomeHero";
import { NeighborhoodStrip } from "@/components/home/NeighborhoodStrip";
import { NewsletterBand } from "@/components/home/NewsletterBand";
import { PillarRail } from "@/components/home/PillarRail";
import { SITE_NAME } from "@/config/site";

const HOME_DESCRIPTION =
  "An independent guide to Tampa, FL from Ben, who spent six months there with family. Things to do, where to eat, Ybor City, Bayshore, and local tips.";

export const metadata: Metadata = {
  title: `${SITE_NAME} — An independent guide to Tampa, FL`,
  description: HOME_DESCRIPTION,
  openGraph: {
    title: `${SITE_NAME} — An independent guide to Tampa, FL`,
    description: HOME_DESCRIPTION,
  },
};

const HOME_PILLARS = [
  "things-to-do",
  "food-and-drink",
  "events",
  "outdoors-beaches",
  "shopping",
  "guides",
] as const;

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <FeaturedStory />
      {HOME_PILLARS.map((pillar) => (
        <PillarRail key={pillar} pillar={pillar} />
      ))}
      <NeighborhoodStrip />
      <NewsletterBand />
    </>
  );
}
