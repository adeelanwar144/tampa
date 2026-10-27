export type CategorySlug =
  | "food-drink"
  | "bars-nightlife"
  | "beaches-outdoors"
  | "attractions"
  | "shopping"
  | "services"
  | "hotels-lodging";

export type CompactListing = {
  slug: string;
  name: string;
  category: CategorySlug;
  categoryLabel: string;
  primaryType?: string;
  subcategory?: string;
  neighborhood?: string;
  city: string;
  address?: string;
  phone?: string;
  website?: string;
  hours?: Record<string, string>;
  hoursNote?: string;
  priceLevel?: string;
  rating?: number;
  reviewCount?: number;
  delivery?: boolean;
  takeout?: boolean;
  dineIn?: boolean;
  wheelchairAccessible?: boolean;
  tagline?: string;
  description?: string;
  tags?: string[];
  websiteText?: string;
  nearbyPlaces?: string[];
  status?: string;
};

export type RichnessTier = "rich" | "medium" | "thin";

export type ListingJob = {
  listing: CompactListing;
  primaryKeyword: string;
  secondaryKeywords: string[];
  inputHash: string;
  compactJson: string;
  tier: Exclude<RichnessTier, "thin">;
};

export type ClaudeUsage = {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
};

export type FaqItem = { q: string; a: string };

export type ModelOutput = {
  metaTitle: string;
  metaDescription: string;
  content: string;
  faq: FaqItem[];
};

export type CheckResult = { name: string; ok: boolean; detail: string; autoFixed?: boolean };

export type ListingContentRecord = {
  slug: string;
  name: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  metaTitle: string;
  metaDescription: string;
  contentMarkdown: string;
  contentHtml: string;
  faq: FaqItem[];
  wordCount: number;
  headingCount: number;
  needsReview: boolean;
  reviewReasons: string[];
  inputHash: string;
  model: string;
  tokens: { input: number; output: number; cacheRead: number };
  generatedAt: string;
};

export type IndexEntry = {
  slug: string;
  wordCount: number;
  needsReview: boolean;
  inputHash: string;
  generatedAt: string;
};

export type GenerateOptions = {
  test?: number;
  slugs: string[];
  category?: string;
  limit?: number;
  force: boolean;
  dryRun: boolean;
  yes: boolean;
  review: boolean;
  resume: boolean;
  revalidate: boolean;
  source: "remote" | "local";
  gap: boolean;
  preview: boolean;
};
