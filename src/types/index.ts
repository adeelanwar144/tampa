export type PillarSlug =
  | "things-to-do"
  | "food-and-drink"
  | "events"
  | "outdoors-beaches"
  | "shopping"
  | "guides";

export interface PillarArticle {
  slug: string;
  pillar: PillarSlug;
  title: string;
  dek: string; // one-line summary
  neighborhoodSlug?: string; // optional cross-link to a neighborhood anchor
  publishedAt: string;
  status: "draft" | "published";
  coverImage?: string;
  readTime?: string;
}

export type CategorySlug =
  | "food-drink"
  | "bars-nightlife"
  | "beaches-outdoors"
  | "attractions"
  | "shopping"
  | "services";

export interface DayHours {
  open: string;
  close: string;
}

export interface Hours {
  // 0 = Sunday … 6 = Saturday. null = closed that day.
  [day: number]: DayHours | null;
}

export interface Place {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: CategorySlug;
  subcategory: string;
  neighborhood: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  priceLevel: 1 | 2 | 3 | 4;
  rating: number;
  reviewCount: number;
  photoCount: number;
  images: string[];
  hours: Hours;
  tags: string[];
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Guide {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: "events" | "deals" | "city-updates";
  coverImage: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
}

export type SortOption =
  | "best-overall"
  | "most-popular"
  | "most-reviewed"
  | "highest-rated"
  | "most-photos"
  | "recently-updated"
  | "name-az"
  | "newest";

export interface FilterParams {
  category?: CategorySlug;
  neighborhood?: string;
  q?: string;
  open?: boolean;
  sort?: SortOption;
  page?: number;
}
