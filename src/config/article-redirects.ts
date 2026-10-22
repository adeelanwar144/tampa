export const SLUG_MERGES = [
  { keep: "ulele-tampa", drop: "ulele-restaurant-tampa" },
  { keep: "tampa-theatre", drop: "tampa-theater" },
  { keep: "topgolf-tampa", drop: "top-golf-tampa" },
  { keep: "trampoline-park-tampa-hillsborough", drop: "trampoline-tampa-hillsborough-ave" },
  { keep: "what-time-zone-is-tampa-florida", drop: "what-is-time-in-tampa-florida" },
  { keep: "things-to-do-in-tampa-this-weekend", drop: "things-going-on-this-weekend-in-tampa" },
] as const;

export const DROPPED_SLUGS = new Set<string>(SLUG_MERGES.map((pair) => pair.drop));

export const SKIP_GENERATE_SLUGS = new Set<string>([
  ...DROPPED_SLUGS,
  "zach-bryan-tampa",
]);

/**
 * Empty before launch. Dropped slugs stay out of generation and the sitemap
 * via DROPPED_SLUGS and SKIP_GENERATE_SLUGS. The removed 301s are listed in
 * scripts/date-audit-log.json if they need to come back after launch.
 */
export const ARTICLE_REDIRECTS: { source: string; destination: string; statusCode: 301 }[] = [];
