export type PillarSlug =
  | "things-to-do"
  | "food-and-drink"
  | "events"
  | "outdoors-beaches"
  | "shopping"
  | "guides";

export type ArticleType =
  | "things-to-do"
  | "weekend-events"
  | "attraction"
  | "restaurant"
  | "hotel"
  | "event"
  | "practical-guide"
  | "road-trip";

export interface PillarArticle {
  slug: string;
  pillar: PillarSlug;
  articleType?: ArticleType;
  title: string;
  dek: string; // one-line summary
  neighborhoodSlug?: string; // optional cross-link to a neighborhood anchor
  publishedAt: string;
  /** Shown as "Last updated" when the guide was refreshed after it was published. */
  updatedAt?: string;
  /**
   * Last day the event or dated roundup is current, as YYYY-MM-DD in Tampa.
   * After this date the page stays up, drops out of navigation and the sitemap, and is noindex.
   */
  eventEndDate?: string;
  status: "draft" | "published";
  coverImage?: string;
  coverAlt?: string;
  coverCredit?: string;
  readTime?: string;
  /** Planner "Pillar" column, shown as the article category. */
  plannerCategory: string;
  metaTitle: string;
  metaDescription: string;
  primaryKeyword?: string;
  keywords?: string[];
  body: string;
}

export type CategorySlug =
  | "food-drink"
  | "bars-nightlife"
  | "beaches-outdoors"
  | "attractions"
  | "shopping"
  | "services"
  | "hotels-lodging";

export interface DayHours {
  open: string;
  close: string;
}

export interface Hours {
  // 0 = Sunday … 6 = Saturday. null = closed that day.
  [day: number]: DayHours | null;
}

export interface PlaceReview {
  rating: number | null;
  text: string | null;
  relativeTime: string | null;
  authorName: string | null;
  authorUri: string | null;
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
  neighborhoodSlug?: string | null;
  status?: "draft" | "published";
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  googleMapsUri?: string;
  priceLevel: 1 | 2 | 3 | 4 | null;
  rating: number;
  reviewCount: number;
  photoCount: number;
  images: string[];
  hours: Hours;
  utcOffsetMinutes?: number | null;
  delivery?: boolean;
  takeout?: boolean;
  dineIn?: boolean;
  wheelchairAccessible?: boolean;
  reviews?: PlaceReview[];
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
