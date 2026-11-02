import fs from "fs";

const publishedPath = "src/data/published-articles.json";
const articles = JSON.parse(fs.readFileSync(publishedPath, "utf8"));

function readTime(words) {
  return `${Math.max(1, Math.round(words / 220))} min read`;
}

const BATCH1 = [
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
    keywords: ["florida aquarium tampa", "tampa aquarium", "aquarium in tampa", "florida aquarium", "channelside"],
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
    keywords: ["international plaza tampa", "tampa mall", "bay street tampa", "westshore shopping", "international plaza"],
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
    keywords: ["tampa international airport", "tpa airport", "flights to tampa", "tampa airport parking", "tpa"],
  },
  {
    file: "content/notes/adventure-island-tampa.md",
    slug: "adventure-island-tampa",
    pillar: "things-to-do",
    articleType: "attraction",
    plannerCategory: "Things to Do & Attractions",
    title: "Visiting Adventure Island Tampa: My Honest Water Park Guide",
    dek: "Why “Tampa water park” means Adventure Island, seasonal calendar, tickets, parking, and nearby lookalikes.",
    metaTitle: "Adventure Island Tampa: Water Park Guide",
    metaDescription:
      "Adventure Island Tampa guide covering the closed 2026 season, tickets, parking, 2027 reopen plans, and nearby water spots people confuse with it.",
    primaryKeyword: "adventure island tampa",
    keywords: ["adventure island tampa", "tampa water park", "adventure island tickets", "busch gardens water park", "tampa waterpark"],
  },
  {
    file: "content/notes/skatepark-of-tampa.md",
    slug: "skatepark-of-tampa",
    pillar: "things-to-do",
    articleType: "attraction",
    plannerCategory: "Things to Do & Attractions",
    title: "Skatepark of Tampa (SPoT): Hours, Rates, and How to Get There",
    dek: "4215 E Columbus Drive: current hours, day rates, BMX days, waivers, and I-4 exit 3 directions.",
    metaTitle: "Skatepark of Tampa: Hours, Rates & Directions",
    metaDescription:
      "Skatepark of Tampa (SPoT): Columbus Drive address, current Aug–Dec 2026 hours, day rates, BMX days, helmet rules, waivers, and I-4 exit three.",
    primaryKeyword: "skatepark of tampa",
    keywords: ["skatepark of tampa", "tampa skatepark", "spot tampa", "skatepark of tampa hours", "skate park tampa"],
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
      "Tampa flea market guide: Big Top closed in 2020; Oldsmar weekend booth hours and free parking; Ybor Saturday Market seasonal times explained.",
    primaryKeyword: "tampa flea market",
    keywords: ["tampa flea market", "flea market tampa", "big top flea market", "oldsmar flea market", "ybor saturday market"],
  },
  {
    file: "content/notes/terra-gaucha-tampa.md",
    slug: "terra-gaucha-tampa",
    pillar: "food-and-drink",
    articleType: "restaurant",
    plannerCategory: "Restaurants & Food",
    title: "Terra Gaucha Tampa: My Honest Guide (Dale Mabry Churrascaria)",
    dek: "Dale Mabry churrascaria: menu tiers, hours, prices, parking, dress code, and how it differs from Texas de Brazil.",
    metaTitle: "Terra Gaucha Tampa: Brazilian Steakhouse Guide",
    metaDescription:
      "Terra Gaucha Tampa Dale Mabry guide covering churrascaria hours, what rodizio includes, parking tips, and how it differs from Texas de Brazil.",
    primaryKeyword: "terra gaucha tampa",
    keywords: ["terra gaucha tampa", "brazilian steakhouse tampa", "terra gaucha", "churrascaria tampa", "dale mabry steakhouse"],
  },
  {
    file: "content/notes/rusty-pelican-tampa.md",
    slug: "rusty-pelican-tampa",
    pillar: "food-and-drink",
    articleType: "restaurant",
    plannerCategory: "Restaurants & Food",
    title: "Rusty Pelican Tampa: My Honest Rocky Point Guide",
    dek: "Rocky Point waterfront seafood: menu highlights, brunch, happy hour, parking, reservations, and the Miami mix-up.",
    metaTitle: "Rusty Pelican Tampa: Rocky Point Dining Guide",
    metaDescription:
      "Rusty Pelican Tampa Rocky Point guide: reservations, waterfront dining tips, hours notes, parking help, and how the Tampa room differs from Miami.",
    primaryKeyword: "rusty pelican tampa",
    keywords: ["rusty pelican tampa", "rusty pelican", "rocky point tampa restaurants", "waterfront dining tampa", "tampa seafood restaurant"],
  },
  {
    file: "content/notes/barrymore-hotel-tampa.md",
    slug: "barrymore-hotel-tampa",
    pillar: "guides",
    articleType: "hotel",
    plannerCategory: "Hotels & Stays",
    title: "Staying at the Barrymore Hotel Tampa: My Honest Riverwalk Guide",
    dek: "Downtown Riverwalk hotel with clear parking and pet fees—and a shuttle that does not go to TPA.",
    metaTitle: "Barrymore Hotel Tampa: Parking, Pets, Shuttle",
    metaDescription:
      "Barrymore Hotel Tampa Riverwalk guide: nightly parking, flat pet fee, 2-mile complimentary shuttle limits, Gaudin restaurant hours, downtown tips.",
    primaryKeyword: "barrymore hotel tampa",
    keywords: ["barrymore hotel tampa", "barrymore hotel", "tampa riverwalk hotel", "downtown tampa hotel", "barrymore tampa parking"],
  },
  {
    file: "content/notes/tampa-to-orlando.md",
    slug: "tampa-to-orlando",
    pillar: "guides",
    articleType: "practical-guide",
    plannerCategory: "Getting Around",
    title: "Tampa to Orlando: My Drive Guide (I-4 Miles, Tolls, Bus, Train)",
    dek: "I-4 mileposts, Disney vs Universal exits, Express toll peaks, stops, and car vs bus vs train.",
    metaTitle: "Tampa to Orlando: I-4 Miles, Tolls & Bus",
    metaDescription:
      "Tampa to Orlando drive guide covering I-4 miles to Disney and downtown, Express toll rules, FlixBus times, Amtrak notes, and Brightline status.",
    primaryKeyword: "tampa to orlando",
    keywords: ["tampa to orlando", "orlando to tampa", "i-4 tampa orlando", "tampa to disney", "flixbus tampa orlando"],
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
      "Tampa to Clearwater guide covering FDOT 23 city miles, Clearwater Beach versus city, Courtney Campbell Causeway tips, and TPA SR 60 tie-ins.",
    primaryKeyword: "tampa to clearwater",
    keywords: ["tampa to clearwater", "clearwater to tampa", "how far is clearwater from tampa", "courtney campbell causeway", "tampa to clearwater beach"],
  },
  {
    file: "content/notes/tampa-museum-of-art.md",
    slug: "tampa-museum-of-art",
    pillar: "things-to-do",
    articleType: "attraction",
    plannerCategory: "Things to Do & Attractions",
    title: "Tampa Museum of Art: My Downtown Visit Guide",
    dek: "Gasparilla Plaza hours, tickets, Thursday Art on the House, parking without a museum lot, and current shows.",
    metaTitle: "Tampa Museum of Art: Hours, Tickets, Parking",
    metaDescription:
      "Tampa Museum of Art guide: hours, adult tickets, Thursday Art on the House pay-as-you-will, Poe garage parking tips, and current exhibitions.",
    primaryKeyword: "tampa museum of art",
    keywords: ["tampa museum of art", "tampa art museum", "art museum tampa", "tampa museum of art tickets", "art museum in tampa"],
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
      "Armature Works Tampa Heights food hall guide: 1910 N Ola address, free parking until 4 p.m., venue fee explained, and the dining rooms inside.",
    primaryKeyword: "armature works tampa",
    keywords: ["armature works tampa", "armature works", "heights public market", "tampa heights food hall", "oak and ola"],
  },
];

const now = "2026-11-02T20:00:00.000Z";

// Publish batch 1 from markdown
for (const draft of BATCH1) {
  const body = fs.readFileSync(draft.file, "utf8").replace(/\r\n/g, "\n").trim() + "\n";
  const words = body.split(/\s+/).filter(Boolean).length;
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
    publishedAt: existing >= 0 && articles[existing].publishedAt ? articles[existing].publishedAt : now,
    updatedAt: now,
    status: "published",
    readTime: readTime(words),
    body,
  };
  if (existing >= 0) articles[existing] = { ...articles[existing], ...entry };
  else articles.unshift(entry);
  console.log(`PUBLISH ${draft.slug} words=${words}`);
}

/** Inbound links: add a sentence into existing posts if not already present */
const inbound = [
  {
    targetSlug: "florida-aquarium-tampa",
    href: "/things-to-do/florida-aquarium-tampa",
    label: "Florida Aquarium",
    into: ["things-to-do-in-tampa", "tampa-zoo", "ulele-tampa"],
    sentence:
      "For a downtown Channelside stop when you want an indoor attraction, see my [Florida Aquarium](/things-to-do/florida-aquarium-tampa) guide.",
  },
  {
    targetSlug: "international-plaza-tampa",
    href: "/shopping/international-plaza-tampa",
    label: "International Plaza",
    into: ["westshore-marriott-hotel-tampa", "texas-de-brazil-tampa", "tampa-international-airport"],
    sentence:
      "For the Westshore mall people mean by “Tampa Mall,” use my [International Plaza](/shopping/international-plaza-tampa) notes.",
  },
  {
    targetSlug: "tampa-international-airport",
    href: "/getting-around/tampa-international-airport",
    label: "TPA",
    into: ["things-to-do-in-tampa", "westshore-marriott-hotel-tampa", "tampa-to-naples"],
    sentence:
      "Flying in first? Start with my [Tampa International Airport](/getting-around/tampa-international-airport) arrival guide.",
  },
  {
    targetSlug: "adventure-island-tampa",
    href: "/things-to-do/adventure-island-tampa",
    label: "Adventure Island",
    into: ["tampa-zoo", "things-to-do-in-tampa", "things-to-do-on-saturday-in-tampa"],
    sentence:
      "Looking for the seasonal water park next to Busch Gardens? See [Adventure Island Tampa](/things-to-do/adventure-island-tampa).",
  },
  {
    targetSlug: "skatepark-of-tampa",
    href: "/things-to-do/skatepark-of-tampa",
    label: "Skatepark of Tampa",
    into: ["ybor-city-tampa-fl-33605", "trampoline-park-tampa-hillsborough", "things-to-do-in-tampa"],
    sentence:
      "For the skatepark east of Ybor off I-4 exit 3, read [Skatepark of Tampa](/things-to-do/skatepark-of-tampa).",
  },
  {
    targetSlug: "tampa-flea-market",
    href: "/shopping/tampa-flea-market",
    label: "Tampa flea market",
    into: ["ybor-city-tampa-fl-33605", "international-plaza-tampa", "things-to-do-on-saturday-in-tampa"],
    sentence:
      "Hunting a flea market? Big Top is closed—see [Tampa flea market options](/shopping/tampa-flea-market) (Oldsmar and Ybor Saturday Market).",
  },
  {
    targetSlug: "terra-gaucha-tampa",
    href: "/food-and-drink/terra-gaucha-tampa",
    label: "Terra Gaucha",
    into: ["texas-de-brazil-tampa", "wrights-gourmet-house-tampa", "yummy-house-tampa"],
    sentence:
      "For the Dale Mabry churrascaria (not Boy Scout), see [Terra Gaucha Tampa](/food-and-drink/terra-gaucha-tampa).",
  },
  {
    targetSlug: "rusty-pelican-tampa",
    href: "/food-and-drink/rusty-pelican-tampa",
    label: "Rusty Pelican",
    into: ["tampa-international-airport", "international-plaza-tampa", "tampa-to-clearwater"],
    sentence:
      "For Rocky Point waterfront seafood near the airport corridor, see [Rusty Pelican Tampa](/food-and-drink/rusty-pelican-tampa).",
  },
  {
    targetSlug: "barrymore-hotel-tampa",
    href: "/guides/barrymore-hotel-tampa",
    label: "Barrymore Hotel",
    into: ["the-westin-tampa-waterside", "the-tampa-edition", "westshore-marriott-hotel-tampa"],
    sentence:
      "Comparing downtown Riverwalk stays? I also covered the [Barrymore Hotel Tampa](/guides/barrymore-hotel-tampa).",
  },
  {
    targetSlug: "tampa-to-orlando",
    href: "/guides/tampa-to-orlando",
    label: "Tampa to Orlando",
    into: ["tampa-to-naples", "tampa-to-clearwater", "tampa-international-airport"],
    sentence:
      "Heading to Disney or downtown Orlando instead? Use my [Tampa to Orlando](/guides/tampa-to-orlando) I-4 guide.",
  },
  {
    targetSlug: "tampa-to-clearwater",
    href: "/guides/tampa-to-clearwater",
    label: "Tampa to Clearwater",
    into: ["tampa-to-orlando", "tampa-to-naples", "tampa-international-airport"],
    sentence:
      "For the beach hop across the bay, see [Tampa to Clearwater](/guides/tampa-to-clearwater).",
  },
  {
    targetSlug: "tampa-museum-of-art",
    href: "/things-to-do/tampa-museum-of-art",
    label: "Tampa Museum of Art",
    into: ["things-to-do-in-tampa", "ulele-tampa", "armature-works-tampa"],
    sentence:
      "For the Riverwalk art museum on Gasparilla Plaza, see [Tampa Museum of Art](/things-to-do/tampa-museum-of-art).",
  },
  {
    targetSlug: "armature-works-tampa",
    href: "/food-and-drink/armature-works-tampa",
    label: "Armature Works",
    into: ["ulele-tampa", "the-pearl-tampa", "things-to-do-in-tampa"],
    sentence:
      "For the Heights food hall on North Ola (not the motor shop), see [Armature Works Tampa](/food-and-drink/armature-works-tampa).",
  },
];

const linkReport = [];

for (const item of inbound) {
  let added = 0;
  for (const slug of item.into) {
    const a = articles.find((x) => x.slug === slug);
    if (!a) {
      console.warn(`missing host ${slug}`);
      continue;
    }
    if (a.body.includes(item.href)) {
      added++;
      continue;
    }
    // Insert before Final Thoughts if present, else before last FAQ, else append
    const marker = /\n## Final Thoughts\n/;
    if (marker.test(a.body)) {
      a.body = a.body.replace(marker, `\n${item.sentence}\n\n## Final Thoughts\n`);
    } else {
      a.body = a.body.trimEnd() + `\n\n${item.sentence}\n`;
    }
    a.updatedAt = now;
    added++;
    console.log(`LINK ${slug} → ${item.targetSlug}`);
  }
  linkReport.push({ target: item.targetSlug, hostsLinked: added });
}

fs.writeFileSync(publishedPath, JSON.stringify(articles, null, 2) + "\n");
console.log(
  "done",
  articles.filter((a) => a.status === "published").length,
  "published;",
  JSON.stringify(linkReport),
);
