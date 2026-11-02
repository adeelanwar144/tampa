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
 * Permanent redirects for wrong pillar paths / legacy URLs.
 * Dropped-slug merges stay out of generation via DROPPED_SLUGS; add their
 * 301s here when those old URLs need to keep resolving.
 */
export const ARTICLE_REDIRECTS: { source: string; destination: string; statusCode: 301 }[] = [
  {
    source: "/guides/tampa-rv-show",
    destination: "/events/tampa-rv-show",
    statusCode: 301,
  },
  {
    source: "/things-to-do/trampoline-park-tampa-hillsborough",
    destination: "/events/trampoline-park-tampa-hillsborough",
    statusCode: 301,
  },
  {
    source: "/things-to-do/topgolf-tampa",
    destination: "/events/topgolf-tampa",
    statusCode: 301,
  },
  {
    source: "/guides/tampa-map",
    destination: "/getting-around/tampa-map",
    statusCode: 301,
  },
  {
    source: "/things-to-do/tampa-map",
    destination: "/getting-around/tampa-map",
    statusCode: 301,
  },
  {
    source: "/things-to-do/ybor-city-tampa",
    destination: "/guides/ybor-city-tampa-fl-33605",
    statusCode: 301,
  },
  {
    source: "/guides/riverwalk-hotels",
    destination: "/guides/tampa-riverwalk-hotels",
    statusCode: 301,
  },
];
