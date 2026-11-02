import fs from "fs";

const publishedPath = "src/data/published-articles.json";
const articles = JSON.parse(fs.readFileSync(publishedPath, "utf8"));

const slugs = [
  "florida-aquarium-tampa",
  "international-plaza-tampa",
  "tampa-international-airport",
  "adventure-island-tampa",
  "skatepark-of-tampa",
  "tampa-flea-market",
  "terra-gaucha-tampa",
  "rusty-pelican-tampa",
  "barrymore-hotel-tampa",
  "tampa-to-orlando",
  "tampa-to-clearwater",
  "tampa-museum-of-art",
  "armature-works-tampa",
];

const fileBySlug = Object.fromEntries(
  slugs.map((s) => [s, `content/notes/${s}.md`]),
);

function readTime(words) {
  return `${Math.max(1, Math.round(words / 220))} min read`;
}

const updated = "2026-11-02T19:30:00.000Z";
const report = [];

for (const slug of slugs) {
  const file = fileBySlug[slug];
  const body = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n").trim() + "\n";
  const words = body.split(/\s+/).filter(Boolean).length;
  const idx = articles.findIndex((a) => a.slug === slug);
  if (idx < 0) throw new Error("missing " + slug);
  articles[idx] = {
    ...articles[idx],
    body,
    status: "draft",
    updatedAt: updated,
    readTime: readTime(words),
  };
  report.push({ slug, words, status: "draft" });
  console.log(`${slug}: ${words} words → draft`);
}

fs.writeFileSync(publishedPath, JSON.stringify(articles, null, 2) + "\n");
fs.writeFileSync(
  "content/notes/batch1-refresh-list.md",
  `# Batch 1 refresh list (date-bound facts)

Check these on or before the date shown. Remove or rewrite the claim if the official source has changed.

| Article | Date-bound fact | Check by | Official source |
|---|---|---|---|
| adventure-island-tampa | Closed for 2026 season; reopen messaging for 2027 | **2027-02-01** (and again when 2027 calendar posts) | https://adventureisland.com/park-info/ |
| skatepark-of-tampa | Regular hours window **Aug 10 – Dec 20, 2026** | **2026-12-15** (before window ends) | https://skateparkoftampa.com/pages/hours-page |
| skatepark-of-tampa | Non-member skate **$20**; membership rates | **2026-12-15** | https://skateparkoftampa.com/pages/rates |
| tampa-museum-of-art | Adult **$25**; Art on the House Thu 4–8 | **2027-01-15** | https://tampamuseum.org/visit/ |
| tampa-museum-of-art | Exhibition end dates (Hockney through **2027-02-28**, Egypt through **2028-06-25**, etc.) | **As each end date approaches** | https://tampamuseum.org/ |
| terra-gaucha-tampa | Posted lunch/dinner prices and hours | **2027-01-15** | https://terragaucha.com/location-tampa/ |
| barrymore-hotel-tampa | Parking **$20**/night; pet fee **$75**; Gaudin hours | **2027-01-15** | https://www.barrymorehotel.com/faqs |
| rusty-pelican-tampa | Restaurant hours vs Visit Tampa Bay directories | **2027-01-15** | https://www.therustypelicantampa.com/reservations |
| armature-works-tampa | Building hours; free lot until 4 p.m.; after-4 rates | **2027-01-15** | https://www.armatureworks.com/location/armature-works/ |
| tampa-to-orlando | Brightline Tampa extension still “planning” (city materials **2026-05-27**) | **2027-03-01** | City of Tampa transportation / Brightline updates |
| tampa-to-orlando | FlixBus times/fares; Amtrak Floridian/thruway times | **2027-01-15** | FlixBus; Amtrak |
| tampa-to-orlando | I-4 Express peak guidance (weekday 6–9 a.m., 3–7 p.m.) | **2027-06-01** | https://i4express.com/faqs/ |
| tampa-to-clearwater | FDOT intercity mileage matrix (updated **2026-09-14**) | **2027-09-14** | https://www.fdot.gov/statistics/hwydata/intercity.shtm |
| tampa-flea-market | Oldsmar Sat–Sun 8 a.m.–3 p.m.; remaining acreage after 2026 sale | **2027-01-15** | https://www.oldsmarfleamarket.com/ |
| tampa-flea-market | Ybor Saturday Market seasonal hours (Oct–Apr 9–3; May–Sep 9–1) | **2027-04-01** and **2027-09-01** | Ybor market / FDACS listing |
| florida-aquarium-tampa | Seasonal hours (Jun–Jul to 6 p.m.); Tide Pool / cruise add-on prices | **2027-05-15** | https://www.flaquarium.org/ |
| international-plaza-tampa | Mall hours; valet rates; Bay Street redevelopment timeline | **2027-02-01** | https://www.simon.com/mall/international-plaza |
| tampa-international-airport | Parking max rates; $5 rideshare fee; airline airside map | **2027-01-15** | https://www.tampaairport.com/ |

Sports / later batches (placeholder for upcoming articles): Bucs 2026 season schedule, Lightning 2026–27, Rays 2027 Tropicana return—add rows when those articles are drafted.
`,
);

console.log(JSON.stringify(report, null, 2));
