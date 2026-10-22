import type { Metadata } from "next";
import { FeaturedStory } from "@/components/home/FeaturedStory";
import { HomeHero } from "@/components/home/HomeHero";
import { NeighborhoodStrip } from "@/components/home/NeighborhoodStrip";
import { NewsletterBand } from "@/components/home/NewsletterBand";
import { PillarRail } from "@/components/home/PillarRail";
import { SITE_NAME } from "@/config/site";

export const metadata: Metadata = {
  title: `${SITE_NAME} — An independent guide to Tampa, FL`,
  description: "Stories, spots, and honest opinions from people who actually live here.",
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
