import { createHash } from "node:crypto";
import { compactListingJson } from "./prompt";
import type { CompactListing, ListingJob, RichnessTier } from "./types";

export function primaryKeyword(listing: CompactListing): string {
  const name = listing.name.replace(/\s+/g, " ").trim();
  const city = listing.city.replace(/\s+/g, " ").trim();
  if (new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(name)) {
    return name;
  }
  return `${name} ${city}`;
}

export function secondaryKeywords(listing: CompactListing): string[] {
  const keywords: string[] = [];
  keywords.push(`${listing.subcategory ?? listing.categoryLabel} in ${listing.city}`.toLowerCase());
  if (listing.neighborhood) {
    keywords.push(`${listing.subcategory ?? listing.categoryLabel} in ${listing.neighborhood}`.toLowerCase());
  }
  if (listing.hours) keywords.push(`${listing.name} hours`);
  return [...new Set(keywords)].slice(0, 4);
}

export function inputHash(
  listing: CompactListing,
  primary: string,
  secondary: string[],
  tier: Exclude<RichnessTier, "thin">,
): string {
  const payload = JSON.stringify({
    data: JSON.parse(compactListingJson(listing)),
    websiteText: listing.websiteText ?? "",
    primary,
    secondary,
    tier,
  });
  return createHash("sha256").update(payload).digest("hex");
}

export function toJob(listing: CompactListing, tier: Exclude<RichnessTier, "thin">): ListingJob {
  const primary = primaryKeyword(listing);
  const secondary = secondaryKeywords(listing);
  const compactJson = compactListingJson(listing);
  return {
    listing,
    primaryKeyword: primary,
    secondaryKeywords: secondary,
    compactJson,
    inputHash: inputHash(listing, primary, secondary, tier),
    tier,
  };
}
