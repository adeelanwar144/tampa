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

/** 301s from the dropped planner URL to the kept article. */
export const ARTICLE_REDIRECTS: { source: string; destination: string; statusCode: 301 }[] = [
  {
    source: "/food-and-drink/ulele-restaurant-tampa",
    destination: "/food-and-drink/ulele-tampa",
    statusCode: 301,
  },
  {
    source: "/things-to-do/tampa-theater",
    destination: "/things-to-do/tampa-theatre",
    statusCode: 301,
  },
  {
    source: "/outdoors-beaches/top-golf-tampa",
    destination: "/events/topgolf-tampa",
    statusCode: 301,
  },
  {
    source: "/events/top-golf-tampa",
    destination: "/events/topgolf-tampa",
    statusCode: 301,
  },
  {
    source: "/events/trampoline-tampa-hillsborough-ave",
    destination: "/events/trampoline-park-tampa-hillsborough",
    statusCode: 301,
  },
  {
    source: "/guides/what-is-time-in-tampa-florida",
    destination: "/guides/what-time-zone-is-tampa-florida",
    statusCode: 301,
  },
  {
    source: "/things-to-do/things-going-on-this-weekend-in-tampa",
    destination: "/things-to-do/things-to-do-in-tampa-this-weekend",
    statusCode: 301,
  },
];
