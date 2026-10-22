import type { PillarSlug } from "@/types";

/** Planner category → the section (pillar) that owns the post and its URL. */
export const CATEGORY_TO_SECTION: Record<string, PillarSlug> = {
  "things to do & attractions": "things-to-do",
  "family & kids": "things-to-do",
  "arts, culture & museums": "things-to-do",
  "tours & cruises": "things-to-do",
  "sports & entertainment": "events",
  "events & festivals": "events",
  "food & drink": "food-and-drink",
  "nightlife & bars": "food-and-drink",
  beaches: "outdoors-beaches",
  "outdoors, parks & nature": "outdoors-beaches",
  "golf, recreation & wellness": "outdoors-beaches",
  shopping: "shopping",
  "hotels & lodging": "guides",
  "neighborhoods & areas": "guides",
  "practical planning & facts": "guides",
  "day trips & nearby cities": "guides",
  "airport & flights": "guides",
  "transportation & getting around": "guides",
  "weather & climate": "guides",
  "tampa general / hub": "guides",
};

export function sectionForCategory(category: string, fallback: PillarSlug = "guides"): PillarSlug {
  const key = category
    .trim()
    .toLowerCase()
    .replace(/\s*\(\s*general\s*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return CATEGORY_TO_SECTION[key] ?? fallback;
}
