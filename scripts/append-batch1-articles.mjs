import fs from "fs";

const publishedPath = "src/data/published-articles.json";
const articles = JSON.parse(fs.readFileSync(publishedPath, "utf8"));

function readTime(words) {
  return `${Math.max(1, Math.round(words / 220))} min read`;
}

const drafts = [
  // Re-check / refresh 3 tests
  {
    file: "content/notes/florida-aquarium-tampa.md",
    slug: "florida-aquarium-tampa",
    pillar: "things-to-do",
    articleType: "attraction",
    plannerCategory: "Things to Do & Attractions",
    title: "Visiting the Florida Aquarium: My Honest Tampa Guide",
    dek: "What people mean by Tampa aquarium, plus tickets, hours, parking, and what general admission actually covers.",
    metaTitle: "Florida Aquarium Tampa: Tickets, Hours & Tips",
    metaDescription:
      "Florida Aquarium Tampa guide: advance tickets, hours, Channelside parking, and what to see from the wetlands dome to The Tide Pool upstairs.",
    primaryKeyword: "florida aquarium tampa",
    keywords: [
      "florida aquarium tampa",
      "tampa aquarium",
      "aquarium in tampa",
      "florida aquarium",
      "channelside",
    ],
  },
  {
    file: "content/notes/international-plaza-tampa.md",
    slug: "international-plaza-tampa",
    pillar: "shopping",
    articleType: "attraction",
    plannerCategory: "Shopping",
    title: 'International Plaza Tampa: The Mall Behind "Tampa Mall"',
    dek: "Why there is no Tampa Mall on the map, and how I shop International Plaza: hours, parking, Bay Street, and nearby lookalikes.",
    metaTitle: "International Plaza Tampa: Stores, Hours, Parking",
    metaDescription:
      "International Plaza Tampa is the mall people mean by Tampa Mall. Hours, valet, garages, Bay Street dining, and how it differs from WestShore Plaza.",
    primaryKeyword: "international plaza tampa",
    keywords: [
      "international plaza tampa",
      "tampa mall",
      "bay street tampa",
      "westshore shopping",
      "international plaza",
    ],
  },
  {
    file: "content/notes/tampa-international-airport.md",
    slug: "tampa-international-airport",
    pillar: "getting-around",
    articleType: "practical-guide",
    plannerCategory: "Airport & Flights",
    title: "Tampa International Airport: My Honest TPA Arrival Guide",
    dek: "How I get through TPA: airsides, SkyConnect, parking, rideshare curbs, and the cheap-fare traps that are not this airport.",
    metaTitle: "Tampa International Airport: My TPA Arrival Guide",
    metaDescription:
      "Tampa International Airport (TPA) guide from Ben: SkyConnect vs airside trains, parking rates, Uber pickup, PIE mix-ups, and arrival timing.",
    primaryKeyword: "tampa international airport",
    keywords: [
      "tampa international airport",
      "tpa airport",
      "flights to tampa",
      "tampa airport parking",
      "tpa",
    ],
  },
  // Batch 1
  {
    file: "content/notes/adventure-island-tampa.md",
    slug: "adventure-island-tampa",
    pillar: "things-to-do",
    articleType: "attraction",
    plannerCategory: "Things to Do & Attractions",
    title: "Visiting Adventure Island Tampa: My Honest Water Park Guide",
    dek: "Why “Tampa water park” means Adventure Island, what’s open in 2026–27, tickets, parking, and nearby lookalikes.",
    metaTitle: "Adventure Island Tampa: Water Park Guide",
    metaDescription:
      "Adventure Island Tampa guide: 2026 season closed status, tickets, parking, rides when open, and other water spots people mix up with it.",
    primaryKeyword: "adventure island tampa",
    keywords: [
      "adventure island tampa",
      "tampa water park",
      "adventure island tickets",
      "busch gardens water park",
      "tampa waterpark",
    ],
  },
  {
    file: "content/notes/skatepark-of-tampa.md",
    slug: "skatepark-of-tampa",
    pillar: "things-to-do",
    articleType: "attraction",
    plannerCategory: "Things to Do & Attractions",
    title: "Skatepark of Tampa (SPoT): Hours, Rates, and How to Get There",
    dek: "4215 E Columbus Drive: current hours, $20 day rates, BMX days, waivers, and I-4 exit 3 directions.",
    metaTitle: "Skatepark of Tampa: Hours, Rates & Directions",
    metaDescription:
      "Skatepark of Tampa (SPoT) guide: 4215 E Columbus Drive, Aug–Dec 2026 hours, day rates, BMX days, helmets, waivers, exit 3.",
    primaryKeyword: "skatepark of tampa",
    keywords: [
      "skatepark of tampa",
      "tampa skatepark",
      "spot tampa",
      "skatepark of tampa hours",
      "skate park tampa",
    ],
  },
  {
    file: "content/notes/tampa-flea-market.md",
    slug: "tampa-flea-market",
    pillar: "shopping",
    articleType: "attraction",
    plannerCategory: "Shopping",
    title: "Tampa Flea Market: Big Top Closed, Where to Go Instead",
    dek: "Big Top is gone. Here’s Oldsmar for the classic flea and Ybor’s Saturday market for produce and makers.",
    metaTitle: "Tampa Flea Market: Where to Go in 2026",
    metaDescription:
      "Tampa flea market guide: Big Top closed in 2020; Oldsmar weekend hours and free parking; Ybor Saturday Market by season.",
    primaryKeyword: "tampa flea market",
    keywords: [
      "tampa flea market",
      "flea market tampa",
      "big top flea market",
      "oldsmar flea market",
      "ybor saturday market",
    ],
  },
  {
    file: "content/notes/terra-gaucha-tampa.md",
    slug: "terra-gaucha-tampa",
    pillar: "food-and-drink",
    articleType: "restaurant",
    plannerCategory: "Restaurants & Food",
    title: "Terra Gaucha Tampa: My Honest Guide (Dale Mabry Churrascaria)",
    dek: "Dale Mabry churrascaria: how it differs from Texas de Brazil, hours, what to expect, and tips from my visits.",
    metaTitle: "Terra Gaucha Tampa: Brazilian Steakhouse Guide",
    metaDescription:
      "Terra Gaucha Tampa on Dale Mabry: hours, what rodizio includes, parking tips, and how it differs from Texas de Brazil nearby.",
    primaryKeyword: "terra gaucha tampa",
    keywords: [
      "terra gaucha tampa",
      "brazilian steakhouse tampa",
      "terra gaucha",
      "churrascaria tampa",
      "westshore steakhouse",
    ],
  },
  {
    file: "content/notes/rusty-pelican-tampa.md",
    slug: "rusty-pelican-tampa",
    pillar: "food-and-drink",
    articleType: "restaurant",
    plannerCategory: "Restaurants & Food",
    title: "Rusty Pelican Tampa: My Honest Rocky Point Guide",
    dek: "Rocky Point seafood with a bay view: reservations, dress, parking, and what I noticed from our table.",
    metaTitle: "Rusty Pelican Tampa: Rocky Point Dining Guide",
    metaDescription:
      "Rusty Pelican Tampa on Rocky Point: reservations, waterfront dining tips, hours notes, and how it differs from Miami.",
    primaryKeyword: "rusty pelican tampa",
    keywords: [
      "rusty pelican tampa",
      "rusty pelican",
      "rocky point tampa restaurants",
      "waterfront dining tampa",
      "tampa seafood restaurant",
    ],
  },
  {
    file: "content/notes/barrymore-hotel-tampa.md",
    slug: "barrymore-hotel-tampa",
    pillar: "guides",
    articleType: "hotel",
    plannerCategory: "Hotels & Stays",
    title: "Barrymore Hotel Tampa Riverwalk: Parking, Pets, Shuttle",
    dek: "Downtown Riverwalk hotel with clear parking and pet fees—and a shuttle that does not go to TPA.",
    metaTitle: "Barrymore Hotel Tampa: Parking, Pets, Shuttle",
    metaDescription:
      "Barrymore Hotel Tampa Riverwalk guide: nightly parking, flat pet fee, 2-mile shuttle limits, Gaudin hours, downtown tips.",
    primaryKeyword: "barrymore hotel tampa",
    keywords: [
      "barrymore hotel tampa",
      "barrymore hotel",
      "tampa riverwalk hotel",
      "downtown tampa hotel",
      "barrymore tampa parking",
    ],
  },
  {
    file: "content/notes/tampa-to-orlando.md",
    slug: "tampa-to-orlando",
    pillar: "guides",
    articleType: "practical-guide",
    plannerCategory: "Getting Around",
    title: "Tampa to Orlando: My Drive Guide (I-4 Miles, Tolls, Bus, Train)",
    dek: "I-4 mileposts from Malfunction Junction, Express tolls, FlixBus, and why Brightline Tampa is still a plan.",
    metaTitle: "Tampa to Orlando: I-4 Miles, Tolls & Bus",
    metaDescription:
      "Tampa to Orlando drive guide: I-4 miles to Disney and downtown, Express tolls, FlixBus times, Amtrak, Brightline status.",
    primaryKeyword: "tampa to orlando",
    keywords: [
      "tampa to orlando",
      "orlando to tampa",
      "i-4 tampa orlando",
      "tampa to disney",
      "flixbus tampa orlando",
    ],
  },
  {
    file: "content/notes/tampa-to-clearwater.md",
    slug: "tampa-to-clearwater",
    pillar: "guides",
    articleType: "practical-guide",
    plannerCategory: "Getting Around",
    title: "Tampa to Clearwater: My Beach-Day Drive Guide",
    dek: "FDOT’s 23-mile city figure, Courtney Campbell vs Memorial Causeway, and why the beach is a longer hop.",
    metaTitle: "Tampa to Clearwater: Miles, Bridges & Beach",
    metaDescription:
      "Tampa to Clearwater guide: FDOT 23 city miles, Clearwater Beach vs city, Courtney Campbell Causeway, and TPA tie-ins.",
    primaryKeyword: "tampa to clearwater",
    keywords: [
      "tampa to clearwater",
      "clearwater to tampa",
      "how far is clearwater from tampa",
      "courtney campbell causeway",
      "tampa to clearwater beach",
    ],
  },
  {
    file: "content/notes/tampa-museum-of-art.md",
    slug: "tampa-museum-of-art",
    pillar: "things-to-do",
    articleType: "attraction",
    plannerCategory: "Things to Do & Attractions",
    title: "Tampa Museum of Art: My Downtown Visit Guide",
    dek: "Gasparilla Plaza hours, $25 tickets, Thursday Art on the House, parking without a museum lot, and fall 2026 shows.",
    metaTitle: "Tampa Museum of Art: Hours, Tickets, Parking",
    metaDescription:
      "Tampa Museum of Art guide: hours, adult tickets, Thursday Art on the House, Poe garage parking, and current exhibitions.",
    primaryKeyword: "tampa museum of art",
    keywords: [
      "tampa museum of art",
      "tampa art museum",
      "art museum tampa",
      "tampa museum of art tickets",
      "art museum in tampa",
    ],
  },
  {
    file: "content/notes/armature-works-tampa.md",
    slug: "armature-works-tampa",
    pillar: "food-and-drink",
    articleType: "restaurant",
    plannerCategory: "Restaurants & Food",
    title: "Armature Works Tampa: Food Hall Guide (Not the Motor Shop)",
    dek: "1910 N Ola food hall vs the Riverview motor company, parking until 4 p.m., 3% fee, and who is inside.",
    metaTitle: "Armature Works Tampa: Food Hall & Parking",
    metaDescription:
      "Armature Works Tampa guide: Heights food hall at 1910 N Ola, free parking until 4 p.m., 3% fee, and dining rooms inside.",
    primaryKeyword: "armature works tampa",
    keywords: [
      "armature works tampa",
      "armature works",
      "heights public market",
      "tampa heights food hall",
      "oak and ola",
    ],
  },
];

const now = "2026-11-02T18:00:00.000Z";
const updated = "2026-11-02T18:00:00.000Z";

const reports = [];

for (const draft of drafts) {
  const body = fs.readFileSync(draft.file, "utf8").replace(/\r\n/g, "\n").trim() + "\n";
  const words = body.split(/\s+/).filter(Boolean).length;
  if (words < 1200) {
    console.warn(`WARN ${draft.slug} under 1200 words: ${words}`);
  }
  if (draft.metaTitle.length > 60) {
    console.warn(`WARN metaTitle length ${draft.metaTitle.length}: ${draft.metaTitle}`);
  }
  if (draft.metaDescription.length < 140 || draft.metaDescription.length > 155) {
    console.warn(
      `WARN metaDescription length ${draft.metaDescription.length}: ${draft.metaDescription}`,
    );
  }

  const existing = articles.findIndex((a) => a.slug === draft.slug);
  const entry = {
    slug: draft.slug,
    pillar: draft.pillar,
    articleType: draft.articleType,
    plannerCategory: draft.plannerCategory,
    title: draft.title,
    dek: draft.dek,
    metaTitle: draft.metaTitle,
    metaDescription: draft.metaDescription,
    primaryKeyword: draft.primaryKeyword,
    keywords: draft.keywords,
    publishedAt: existing >= 0 ? articles[existing].publishedAt || now : now,
    updatedAt: updated,
    status: "published",
    readTime: readTime(words),
    body,
  };

  if (existing >= 0) articles[existing] = { ...articles[existing], ...entry };
  else articles.unshift(entry);

  reports.push({ slug: draft.slug, words, metaTitle: draft.metaTitle.length, metaDesc: draft.metaDescription.length });
  console.log(
    `${draft.slug}: words=${words} metaTitle=${draft.metaTitle.length} metaDesc=${draft.metaDescription.length}`,
  );
}

fs.writeFileSync(publishedPath, JSON.stringify(articles, null, 2) + "\n");
console.log(`Wrote ${publishedPath}; total articles=${articles.length}`);
fs.writeFileSync(
  "content/notes/batch1-publish-wordcounts.json",
  JSON.stringify(reports, null, 2) + "\n",
);
