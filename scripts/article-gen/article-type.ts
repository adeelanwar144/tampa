export type ArticleType =
  | "things-to-do"
  | "weekend-events"
  | "attraction"
  | "restaurant"
  | "hotel"
  | "event"
  | "practical-guide"
  | "road-trip";

export const ARTICLE_TYPES: ArticleType[] = [
  "things-to-do",
  "weekend-events",
  "attraction",
  "restaurant",
  "hotel",
  "event",
  "practical-guide",
  "road-trip",
];

export const TITLE_FORMATS: Record<ArticleType, { format: string; example: string; extra?: string }> = {
  "things-to-do": {
    format: "My [N] Favorite Things to Do in [Place] ([short personal angle])",
    example: "My 15 Favorite Things to Do in Tampa (After Exploring the City)",
    extra:
      "Use 8 to 15 numbered H2 items. Quick-tips H2 must be exactly: Short on Time? Here Are My Quick Travel Tips. Useful-tips H2: Useful Things to Know Before You Go. Featured image alt must describe a specific Tampa subject, never just the city skyline.",
  },
  "weekend-events": {
    format: "My Favorite Things to Do in [Place] This Weekend ([Dates])",
    example: "My Favorite Things to Do in Tampa This Weekend (Oct 9–11)",
  },
  attraction: {
    format: "Visiting [Attraction]: My Honest Guide and [N] Tips Before You Go",
    example: "Visiting ZooTampa: My Honest Guide and 8 Tips Before You Go",
  },
  restaurant: {
    format: "[Restaurant], Tampa: My Honest Guide (What to Know Before You Go)",
    example: "Ulele, Tampa: My Honest Guide (What to Know Before You Go)",
    extra:
      'No numbered H2 items. Use H2 sections: What It\'s Like, What to Order (only dishes in the notes), Hours and Reservations, Parking and Getting There, Tips Before You Go (this counts as Useful Things to Know). Never invent dishes, prices or reviews. Featured image alt must describe the restaurant, never a generic city skyline.',
  },
  hotel: {
    format: "Staying at [Hotel]: My Honest Guide to [Location, Rooms and Tips]",
    example: "Staying at The Westin Tampa Waterside: My Honest Guide",
  },
  event: {
    format: "[Event] in [Place]: My Guide to [Dates, Venue and Tips]",
    example: "Zach Bryan in Tampa: My Guide to the Date, Venue and Tips",
  },
  "practical-guide": {
    format: "[Primary Keyword]: My Simple Guide ([short benefit])",
    example: "Tampa ZIP Codes: My Simple Guide by Neighborhood",
    extra:
      'Also valid: "What Time Zone Is Tampa, Florida? My Quick Guide". Answer the question directly in the first two sentences of the intro. Use a table where it helps. Skip the numbered things-to-do list.',
  },
  "road-trip": {
    format: "[Place] to [Place]: My Road Trip Guide (Drive Time, Stops and Tips)",
    example: "Tampa to Naples: My Road Trip Guide (Drive Time, Stops and Tips)",
  },
};

const SLUG_TYPES: Record<string, ArticleType> = {
  "tampa-zip-code": "practical-guide",
  "zip-code-hillsborough-tampa-fl": "practical-guide",
  "what-time-zone-is-tampa-florida": "practical-guide",
  "tampa-to-naples": "road-trip",
};

const TYPE_ALIASES: Record<string, ArticleType> = {
  "things-to-do": "things-to-do",
  "things to do": "things-to-do",
  weekend: "weekend-events",
  "weekend-events": "weekend-events",
  "weekend events": "weekend-events",
  attraction: "attraction",
  attractions: "attraction",
  restaurant: "restaurant",
  restaurants: "restaurant",
  food: "restaurant",
  hotel: "hotel",
  hotels: "hotel",
  lodging: "hotel",
  event: "event",
  events: "event",
  concert: "event",
  "practical-guide": "practical-guide",
  "practical guide": "practical-guide",
  "road-trip": "road-trip",
  "road trip": "road-trip",
};

export function parseArticleType(raw: string | undefined): ArticleType | null {
  if (!raw?.trim()) return null;
  return TYPE_ALIASES[raw.trim().toLowerCase()] ?? null;
}

export function inferArticleType(slug: string, keyword: string, category = ""): ArticleType {
  if (SLUG_TYPES[slug]) return SLUG_TYPES[slug];
  const hay = `${slug} ${keyword} ${category}`.toLowerCase();

  if (/\b(hotel|marriott|westin|edition|lodging|hilton|hyatt)\b/.test(hay)) return "hotel";
  if (
    /\b(restaurant|ulele|yummy house|yard house|texas de brazil|wright'?s gourmet|the pearl)\b/.test(hay) ||
    /food & drink/.test(hay)
  ) {
    return "restaurant";
  }
  if (/\b(zach bryan|concert|tour date)\b/.test(hay)) return "event";
  if (/\bthis weekend\b/.test(hay) || /going on this weekend/.test(hay)) return "weekend-events";
  if (/things-to-do-on-saturday|things to do on saturday/.test(hay)) return "weekend-events";
  if (/zip code|time zone|what is time/.test(hay) || /practical planning/.test(hay)) {
    return "practical-guide";
  }
  if (/\b(to naples|road trip|drive time)\b/.test(hay) || /day trips/.test(hay)) return "road-trip";
  if (
    /\b(zoo|theatre|theater|tbpac|straz|trampoline|topgolf|top golf|tpc|aquarium|museum|attraction)\b/.test(
      hay,
    )
  ) {
    return "attraction";
  }
  return "things-to-do";
}

export function resolveArticleType(
  rawType: string | undefined,
  slug: string,
  keyword: string,
  category = "",
): ArticleType {
  return parseArticleType(rawType) ?? inferArticleType(slug, keyword, category);
}

export function titleFormatBlock(type: ArticleType, slug?: string): string {
  const spec = TITLE_FORMATS[type];
  const extras: string[] = [];
  if (spec.extra) extras.push(spec.extra);
  if (slug === "tbpac-tampa") {
    extras.push(
      'Lead the H1 with "Straz Center" and mention TBPAC in the intro and the FAQ. Example: "Visiting the Straz Center (TBPAC): My Honest Guide and Tips".',
    );
  }
  if (slug === "tpc-tampa") {
    extras.push(
      'Use "Playing" instead of "Visiting". Example: "Playing TPC Tampa Bay: My Honest Guide and Tips Before You Go".',
    );
  }
  if (slug === "things-to-do-in-tampa-this-weekend") {
    extras.push(
      'Use this H1 exactly: "My Favorite Things to Do in Tampa This Weekend". No date and no date range.',
    );
  }
  if (slug === "things-to-do-on-saturday-in-tampa") {
    extras.push(
      'Use this H1 exactly: "My Favorite Things to Do in Tampa on a Saturday". No date and no date range.',
    );
  }
  return `Article type: ${type}
Title format for this type: ${spec.format}
Example: ${spec.example}${extras.length ? `\n${extras.join("\n")}` : ""}

All titles must:
- include the primary keyword or a close natural version of it
- be written from the author's personal point of view
- stay under 65 characters where possible (70 max)
- if a number is used, match the count of numbered H2 items
- never contain research-process wording such as "which ones clash", "what the schedule says", "what the sources say", or "according to"
- never start with "Things Going On" or "X Things to Know Before..."`;
}
