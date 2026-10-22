import { primaryNav, type NavItem } from "@/config/nav";
import { getArticlesByPillar } from "@/lib/pillars";
import type { PillarSlug } from "@/types";

/** Sections with no posts stay out of the menu and the sitemap. The pages stay up. */
const HIDDEN_WHEN_EMPTY = new Set<PillarSlug>(["outdoors-beaches", "shopping"]);

export function sectionIsListed(pillar: PillarSlug) {
  if (!HIDDEN_WHEN_EMPTY.has(pillar)) return true;
  return getArticlesByPillar(pillar).length > 0;
}

export function listedNavItems(): NavItem[] {
  return primaryNav.filter((item) => {
    const pillar = item.href.replace(/^\//, "") as PillarSlug;
    if (!HIDDEN_WHEN_EMPTY.has(pillar)) return true;
    return sectionIsListed(pillar);
  });
}
