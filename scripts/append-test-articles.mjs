import fs from "fs";

const publishedPath = "src/data/published-articles.json";
const articles = JSON.parse(fs.readFileSync(publishedPath, "utf8"));

function readTime(words) {
  return `${Math.max(1, Math.round(words / 220))} min read`;
}

function metaDesc(text, max = 155) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return cleaned.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

const drafts = [
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
];

const now = "2026-11-02T12:00:00.000Z";
const updated = "2026-11-02T12:00:00.000Z";

for (const draft of drafts) {
  const body = fs.readFileSync(draft.file, "utf8").replace(/\r\n/g, "\n").trim() + "\n";
  const words = body.split(/\s+/).filter(Boolean).length;
  if (words < 1000 || words > 1800) {
    console.warn(`WARN ${draft.slug} word count ${words}`);
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
    publishedAt: now,
    updatedAt: updated,
    status: "published",
    readTime: readTime(words),
    body,
  };

  if (existing >= 0) articles[existing] = { ...articles[existing], ...entry };
  else articles.unshift(entry);

  console.log(
    `${draft.slug}: words=${words} metaTitle=${draft.metaTitle.length} metaDesc=${draft.metaDescription.length}`,
  );
}

fs.writeFileSync(publishedPath, JSON.stringify(articles, null, 2) + "\n");
console.log("wrote", publishedPath, "total", articles.length);
