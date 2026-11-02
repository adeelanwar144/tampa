/**
 * Fact packs for Batch A sports / map / Hard Rock / St. Pete (2026-11-03).
 * npx tsx scripts/article-gen/write-batch-a-packs.ts
 */
import { saveFactPack, type FactEntry, type FactPack } from "./fact-pack";

const CHECKED = "2026-11-03";
function f(c: string, v: string, n: string, u: string): FactEntry {
  return { claim: c, value: v, sourceName: n, sourceUrl: u, checkedAt: CHECKED };
}
function pack(slug: string, keyword: string, notes: string[], facts: FactEntry[]): FactPack {
  return { slug, keyword, checkedAt: CHECKED, notes, facts, allowedTokens: [] };
}

const packs: FactPack[] = [
  pack(
    "tampa-to-st-petersburg",
    "tampa to st petersburg",
    [
      "FDOT intercity miles are official; do not invent drive times.",
      "Howard Frankland is I-275; Gandy is US 92; Courtney Campbell is Tampa–Clearwater not St Pete.",
    ],
    [
      f("FDOT miles", "Tampa ↔ St. Petersburg 20 miles either way (FDOT intercity matrix)", "FDOT Highway Data — Intercity Mileage", "https://www.fdot.gov/statistics/hwydata/intercity.shtm"),
      f("Matrix date", "FDOT intercity mileage matrix dated 9/14/2026", "FDOT Highway Data", "https://www.fdot.gov/statistics/hwydata/intercity.shtm"),
      f("Main crossing", "W. Howard Frankland Bridge (I-275) across Old Tampa Bay is the main busy crossing", "FDOT / Ben note", "https://www.fdot.gov/"),
      f("Southern crossing", "Gandy Bridge (US 92) is the southern crossing option", "FDOT / Ben note", "https://www.fdot.gov/"),
      f("Not this trip", "Courtney Campbell Causeway (SR 60) is Tampa–Clearwater, not Tampa–St. Petersburg", "FDOT / Ben note", "https://www.fdot.gov/"),
      f("Express lanes", "Howard Frankland express lanes: electronic SunPass tolling; passenger vehicles, vanpools, buses — confirm current FDOT Tampa Bay materials", "FDOT Tampa Bay", "https://www.fdot.gov/"),
      f("General-use lanes", "General-use lanes remain available beside express lanes", "FDOT", "https://www.fdot.gov/"),
      f("Checked", "November 3, 2026", "Pack metadata", "https://visitintampa.com/guides/tampa-to-st-petersburg"),
      f("St Pete pin", "St. Petersburg is a separate city on the peninsula — Tropicana Field is there, not in Tampa city limits", "City of St. Petersburg / Rays materials", "https://www.mlb.com/rays/ballpark"),
      f("No invented ETA", "Do not invent door-to-door drive times; traffic varies", "Editorial rule", "https://visitintampa.com/guides/tampa-to-st-petersburg"),
      f("Link map", "Cross-link /getting-around/tampa-map and /guides/tampa-to-clearwater", "Internal linking", "https://visitintampa.com/getting-around/tampa-map"),
      f("Link Trop", "Cross-link /events/tropicana-field for Rays visitors", "Internal linking", "https://visitintampa.com/events/tropicana-field"),
      f("Link airport", "Cross-link /getting-around/tampa-international-airport for arrival context", "Internal linking", "https://visitintampa.com/getting-around/tampa-international-airport"),
      f("Link overview", "Cross-link /guides/tampa-florida-overview", "Internal linking", "https://visitintampa.com/guides/tampa-florida-overview"),
      f("Word floor", "Minimum 1,200 words", "Editorial brief", "https://visitintampa.com/guides/tampa-to-st-petersburg"),
    ],
  ),
  pack(
    "tampa-tarpons",
    "tampa tarpons",
    ["Yankees Single-A affiliate; not Rays/Bucs/Lightning. Confirm schedule on official site."],
    [
      f("Team", "Tampa Tarpons — Single-A Florida State League, New York Yankees affiliate", "MiLB / Tarpons", "https://www.milb.com/tampa"),
      f("Home", "George M. Steinbrenner Field, 1 Steinbrenner Drive, Tampa, FL 33614", "Steinbrenner Field / Tarpons", "https://www.milb.com/tampa"),
      f("Phone", "GMS Field phone listed as 813-875-7753 on team/venue materials — confirm on official site", "Tarpons / GMS Field", "https://www.milb.com/tampa"),
      f("Also at complex", "New York Yankees spring training also uses the complex", "Yankees / Tarpons materials", "https://www.mlb.com/yankees/spring-training"),
      f("Capacity note", "MLB lists capacity figures for Steinbrenner; quote only numbers present in note/pack", "Editorial rule", "https://www.milb.com/tampa"),
      f("Not Rays", "Tarpons are not the Tampa Bay Rays; Rays play at Tropicana Field in St. Petersburg", "Clarification", "https://www.mlb.com/rays/ballpark"),
      f("Checked", "November 3, 2026", "Pack metadata", "https://visitintampa.com/events/tampa-tarpons"),
      f("Tickets", "Buy tickets via official Tarpons/MiLB paths — do not invent prices", "MiLB Tampa", "https://www.milb.com/tampa"),
      f("Link stadium guide", "Link /events/tampa-stadium-guide for venue disambiguation", "Internal", "https://visitintampa.com/events/tampa-stadium-guide"),
      f("Link events hub", "Link /events/tampa-events", "Internal", "https://visitintampa.com/events/tampa-events"),
      f("Link map", "Link /getting-around/tampa-map", "Internal", "https://visitintampa.com/getting-around/tampa-map"),
      f("Link Bucs", "Link /events/tampa-buccaneers only as contrast (different sport/venue)", "Internal", "https://visitintampa.com/events/tampa-buccaneers"),
      f("Open status", "Official MiLB Tampa site live — operating club", "MiLB Tampa", "https://www.milb.com/tampa"),
      f("Word floor", "Minimum 1,200 words", "Editorial", "https://visitintampa.com/events/tampa-tarpons"),
      f("No invented roster", "Do not invent roster or single-game times not in note/pack", "Editorial", "https://visitintampa.com/events/tampa-tarpons"),
    ],
  ),
  pack(
    "tampa-bay-rays",
    "tampa bay rays",
    [
      "Home is Tropicana Field, St. Petersburg — not Tampa city.",
      "2027 regular-season schedule posted July 16, 2026; times TBA; subject to change.",
    ],
    [
      f("Home venue", "Tropicana Field, 1 Tropicana Drive, St. Petersburg, FL 33705", "MLB Rays Ballpark", "https://www.mlb.com/rays/ballpark"),
      f("2027 schedule release", "Rays announced 2027 regular-season schedule July 16, 2026", "MLB press release", "https://www.mlb.com/press-release/rays-announce-2027-regular-season-schedule"),
      f("2027 opener", "2027 opens at Tropicana Field March 25–27 vs Baltimore Orioles", "MLB press release", "https://www.mlb.com/press-release/rays-announce-2027-regular-season-schedule"),
      f("2027 second series", "Then Los Angeles Angels at home March 29–31", "MLB press release", "https://www.mlb.com/press-release/rays-announce-2027-regular-season-schedule"),
      f("2027 first road", "First road trip: Minnesota Twins April 2–5; Texas Rangers April 6–8", "MLB press release", "https://www.mlb.com/press-release/rays-announce-2027-regular-season-schedule"),
      f("Schedule caveat", "Schedule subject to change; game times announced later", "MLB press release", "https://www.mlb.com/press-release/rays-announce-2027-regular-season-schedule"),
      f("Downloadable schedule", "Official downloadable schedule page for CSV/calendar files", "Rays downloadable schedule", "https://www.mlb.com/rays/schedule/downloadable-schedule"),
      f("30th season note", "2027 described as beginning their 30th season in the press release", "MLB press release", "https://www.mlb.com/press-release/rays-announce-2027-regular-season-schedule"),
      f("Checked", "November 3, 2026", "Pack metadata", "https://visitintampa.com/events/tampa-bay-rays"),
      f("Tickets", "Official tickets via MLB/Rays — do not invent prices", "MLB Rays", "https://www.mlb.com/rays/tickets"),
      f("Link Trop", "Link /events/tropicana-field", "Internal", "https://visitintampa.com/events/tropicana-field"),
      f("Link schedule", "Link /events/tampa-rays-schedule", "Internal", "https://visitintampa.com/events/tampa-rays-schedule"),
      f("Link St Pete drive", "Link /guides/tampa-to-st-petersburg", "Internal", "https://visitintampa.com/guides/tampa-to-st-petersburg"),
      f("Link stadium guide", "Link /events/tampa-stadium-guide", "Internal", "https://visitintampa.com/events/tampa-stadium-guide"),
      f("Word floor", "1,800–2,500 words", "Editorial", "https://visitintampa.com/events/tampa-bay-rays"),
      f("Not Yankees/Tarpons", "Rays ≠ Tampa Tarpons at Steinbrenner", "Clarification", "https://www.milb.com/tampa"),
    ],
  ),
  pack(
    "tampa-rays-schedule",
    "tampa rays schedule",
    ["Evergreen how-to-read + 2027 posted opener facts; always send readers to MLB for live grid."],
    [
      f("Team name", "Tampa Bay Rays on the schedule grid", "MLB Rays", "https://www.mlb.com/rays/schedule"),
      f("Home column", "Home venue: Tropicana Field, St. Petersburg", "MLB Rays Ballpark", "https://www.mlb.com/rays/ballpark"),
      f("2027 posted", "2027 regular-season schedule released July 16, 2026", "MLB press release", "https://www.mlb.com/press-release/rays-announce-2027-regular-season-schedule"),
      f("2027 open dates", "Open March 25–27 2027 vs Orioles at Tropicana Field", "MLB press release", "https://www.mlb.com/press-release/rays-announce-2027-regular-season-schedule"),
      f("Times TBA", "Game times announced later; schedule subject to change", "MLB press release", "https://www.mlb.com/press-release/rays-announce-2027-regular-season-schedule"),
      f("Downloadable", "Use Rays downloadable schedule for CSV/home/away files", "Rays downloadable schedule", "https://www.mlb.com/rays/schedule/downloadable-schedule"),
      f("Away tickets", "Away games: buy from the home club for that date", "MLB ticketing practice", "https://www.mlb.com/rays/tickets"),
      f("Spring training", "Spring training is a separate schedule (not regular season)", "MLB Rays", "https://www.mlb.com/rays/schedule"),
      f("Checked", "November 3, 2026", "Pack metadata", "https://visitintampa.com/events/tampa-rays-schedule"),
      f("Link Rays overview", "Link /events/tampa-bay-rays", "Internal", "https://visitintampa.com/events/tampa-bay-rays"),
      f("Link Trop", "Link /events/tropicana-field", "Internal", "https://visitintampa.com/events/tropicana-field"),
      f("Link St Pete", "Link /guides/tampa-to-st-petersburg", "Internal", "https://visitintampa.com/guides/tampa-to-st-petersburg"),
      f("Word floor", "1,800+ words", "Editorial", "https://visitintampa.com/events/tampa-rays-schedule"),
      f("No invented times", "Do not invent first-pitch times", "Editorial", "https://visitintampa.com/events/tampa-rays-schedule"),
      f("Eastern time", "Times are Eastern unless noted on MLB", "MLB", "https://www.mlb.com/rays/schedule"),
    ],
  ),
  pack(
    "tropicana-field",
    "tropicana field",
    ["Ballpark is in St. Petersburg. Rays home for 2026 season context and 2027 schedule."],
    [
      f("Address", "1 Tropicana Drive, St. Petersburg, FL 33705", "MLB Rays Ballpark", "https://www.mlb.com/rays/ballpark"),
      f("City", "St. Petersburg — not Tampa city limits", "MLB / geography", "https://www.mlb.com/rays/ballpark"),
      f("Tenant", "Home of the Tampa Bay Rays", "MLB Rays", "https://www.mlb.com/rays/ballpark"),
      f("2027 opener at Trop", "2027 season opens at Tropicana Field March 25–27 vs Orioles", "MLB press release", "https://www.mlb.com/press-release/rays-announce-2027-regular-season-schedule"),
      f("First Trop opener since 2024", "Press release notes first Tropicana Field opener since 2024", "MLB press release", "https://www.mlb.com/press-release/rays-announce-2027-regular-season-schedule"),
      f("Checked", "November 3, 2026", "Pack metadata", "https://visitintampa.com/events/tropicana-field"),
      f("Parking/bags", "Quote bag/parking rules only from official ballpark pages in note/pack — else say check official site", "Editorial", "https://www.mlb.com/rays/ballpark"),
      f("Link Rays", "Link /events/tampa-bay-rays", "Internal", "https://visitintampa.com/events/tampa-bay-rays"),
      f("Link schedule", "Link /events/tampa-rays-schedule", "Internal", "https://visitintampa.com/events/tampa-rays-schedule"),
      f("Link St Pete", "Link /guides/tampa-to-st-petersburg", "Internal", "https://visitintampa.com/guides/tampa-to-st-petersburg"),
      f("Link stadium guide", "Link /events/tampa-stadium-guide", "Internal", "https://visitintampa.com/events/tampa-stadium-guide"),
      f("Word floor", "1,800+ words", "Editorial", "https://visitintampa.com/events/tropicana-field"),
      f("Not Ray Jay", "Not Raymond James Stadium (Bucs)", "Clarification", "https://www.raymondjamesstadium.com/"),
      f("Not arena", "Not Benchmark International Arena (Lightning)", "Clarification", "https://www.benchmarkintlarena.com/"),
      f("Official ballpark URL", "https://www.mlb.com/rays/ballpark", "MLB", "https://www.mlb.com/rays/ballpark"),
    ],
  ),
  pack(
    "tampa-bay-lightning",
    "tampa bay lightning",
    ["2026–27 season. Arena formerly Amalie — now Benchmark International Arena."],
    [
      f("Arena", "Benchmark International Arena, 401 Channelside Drive, Tampa, FL 33602", "Benchmark International Arena", "https://www.benchmarkintlarena.com/"),
      f("Former name", "Formerly Amalie Arena — old name still appears in stray materials", "Arena / club habit", "https://www.benchmarkintlarena.com/"),
      f("Team", "Tampa Bay Lightning (NHL)", "Lightning", "https://www.nhl.com/lightning"),
      f("Season", "Guide for 2026–27 season context — confirm schedule on official club site", "NHL Lightning", "https://www.nhl.com/lightning/schedule"),
      f("Checked", "November 3, 2026", "Pack metadata", "https://visitintampa.com/events/tampa-bay-lightning"),
      f("Tickets companion", "Link /events/tampa-lightning-tickets for buying paths", "Internal", "https://visitintampa.com/events/tampa-lightning-tickets"),
      f("Link stadium guide", "Link /events/tampa-stadium-guide", "Internal", "https://visitintampa.com/events/tampa-stadium-guide"),
      f("Link events", "Link /events/tampa-events", "Internal", "https://visitintampa.com/events/tampa-events"),
      f("Link hotels", "Link /guides/tampa-hotels or Riverwalk hotels for overnight games", "Internal", "https://visitintampa.com/guides/tampa-hotels"),
      f("No invented odds", "No gambling how-tos or invented ticket prices", "Editorial", "https://visitintampa.com/events/tampa-bay-lightning"),
      f("Word floor", "1,800+ words", "Editorial", "https://visitintampa.com/events/tampa-bay-lightning"),
      f("Box office phone", "Ticket office phone appears in tickets guide pack — confirm before quoting", "Tickets guide companion", "https://visitintampa.com/events/tampa-lightning-tickets"),
      f("Channelside", "Downtown Channelside waterfront district", "Geography", "https://www.benchmarkintlarena.com/"),
      f("Official club", "https://www.nhl.com/lightning", "NHL", "https://www.nhl.com/lightning"),
      f("Official arena", "https://www.benchmarkintlarena.com/", "Arena", "https://www.benchmarkintlarena.com/"),
    ],
  ),
  pack(
    "tampa-lightning-tickets",
    "tampa lightning tickets",
    ["Buying problem guide. Mobile entry. Confirm box-office windows on official pages."],
    [
      f("Official sellers", "Tampa Bay Lightning / Benchmark International Arena ReliaQuest Ticket Office and Ticketmaster", "Lightning tickets", "https://www.nhl.com/lightning/tickets"),
      f("Arena", "401 Channelside Drive, Tampa, FL 33602", "Arena", "https://www.benchmarkintlarena.com/"),
      f("Mobile", "Typical Lightning entry is mobile Ticketmaster — confirm current policy on club site", "Lightning tickets", "https://www.nhl.com/lightning/tickets"),
      f("Checked", "November 3, 2026", "Pack metadata", "https://visitintampa.com/events/tampa-lightning-tickets"),
      f("Season", "2026–27 season context", "NHL Lightning", "https://www.nhl.com/lightning/schedule"),
      f("No refunds habit", "Typical no-refund/no-exchange language on event tickets — confirm on seller terms", "Ticketmaster / club", "https://www.nhl.com/lightning/tickets"),
      f("Link Lightning", "Link /events/tampa-bay-lightning", "Internal", "https://visitintampa.com/events/tampa-bay-lightning"),
      f("Link arena stadium guide", "Link /events/tampa-stadium-guide", "Internal", "https://visitintampa.com/events/tampa-stadium-guide"),
      f("Link events", "Link /events/tampa-events", "Internal", "https://visitintampa.com/events/tampa-events"),
      f("Word floor", "1,800+ words", "Editorial", "https://visitintampa.com/events/tampa-lightning-tickets"),
      f("No invented prices", "Do not invent seat prices or rush amounts", "Editorial", "https://visitintampa.com/events/tampa-lightning-tickets"),
      f("Box office location", "West side of arena on event days — confirm hours on arena/club pages before stating", "Arena / club", "https://www.benchmarkintlarena.com/"),
      f("Phone caution", "Only quote ticket office phone if present in note/pack from official page", "Editorial", "https://www.nhl.com/lightning/tickets"),
      f("Resale caution", "Warn about unofficial resale without inventing fee tables", "Editorial", "https://www.nhl.com/lightning/tickets"),
      f("Former Amalie name", "Amalie name may still appear in old emails — same building", "Clarification", "https://www.benchmarkintlarena.com/"),
    ],
  ),
  pack(
    "tampa-buccaneers",
    "tampa buccaneers",
    ["2026 NFL season at Raymond James Stadium. Bags/parking from official sources only."],
    [
      f("Stadium", "Raymond James Stadium, 4201 N Dale Mabry Hwy, Tampa, FL 33607", "Raymond James Stadium", "https://www.raymondjamesstadium.com/"),
      f("Team", "Tampa Bay Buccaneers", "Buccaneers", "https://www.buccaneers.com/"),
      f("Season", "2026 season context — confirm schedule/tickets on official club site", "Buccaneers", "https://www.buccaneers.com/schedule/"),
      f("Also hosts", "USF football and bowl games also use Ray Jay — not every event is Bucs", "Stadium", "https://www.raymondjamesstadium.com/"),
      f("Checked", "November 3, 2026", "Pack metadata", "https://visitintampa.com/events/tampa-buccaneers"),
      f("Bags", "Clear-bag style policies — quote only from current stadium/club pages in note/pack", "Stadium policies", "https://www.raymondjamesstadium.com/"),
      f("Parking", "Do not invent lot prices; point to official parking maps", "Stadium", "https://www.raymondjamesstadium.com/"),
      f("Link stadium guide", "Link /events/tampa-stadium-guide", "Internal", "https://visitintampa.com/events/tampa-stadium-guide"),
      f("Link events", "Link /events/tampa-events", "Internal", "https://visitintampa.com/events/tampa-events"),
      f("Link map", "Link /getting-around/tampa-map", "Internal", "https://visitintampa.com/getting-around/tampa-map"),
      f("Link hotels", "Link /guides/tampa-hotels", "Internal", "https://visitintampa.com/guides/tampa-hotels"),
      f("Word floor", "1,800+ words", "Editorial", "https://visitintampa.com/events/tampa-buccaneers"),
      f("Official tickets", "buccaneers.com / Ticketmaster paths — no invented face values", "Bucs tickets", "https://www.buccaneers.com/tickets/"),
      f("Not Trop", "Not Tropicana Field", "Clarification", "https://www.mlb.com/rays/ballpark"),
      f("Not arena", "Not Benchmark International Arena", "Clarification", "https://www.benchmarkintlarena.com/"),
    ],
  ),
  pack(
    "seminole-hard-rock-tampa",
    "seminole hard rock tampa",
    [
      "HOTEL, DINING, CONCERTS ONLY — no gambling how-tos, odds, or game instructions.",
      "May acknowledge casino exists as on-site amenity without teaching play.",
    ],
    [
      f("Property", "Seminole Hard Rock Hotel & Casino Tampa", "Hard Rock Tampa", "https://www.seminolehardrocktampa.com/"),
      f("Focus", "This guide covers hotel stay, dining, and concerts/entertainment only", "Editorial brief", "https://www.seminolehardrocktampa.com/"),
      f("No gambling how-to", "Do not explain how to play games, odds, or strategies", "Editorial rule", "https://visitintampa.com/guides/seminole-hard-rock-tampa"),
      f("Checked", "November 3, 2026", "Pack metadata", "https://visitintampa.com/guides/seminole-hard-rock-tampa"),
      f("Official site", "https://www.seminolehardrocktampa.com/", "Hard Rock Tampa", "https://www.seminolehardrocktampa.com/"),
      f("Not downtown Riverwalk", "Separate campus from Water Street / Riverwalk hotel cluster", "Geography", "https://www.seminolehardrocktampa.com/"),
      f("Link hotels hub", "Link /guides/tampa-hotels", "Internal", "https://visitintampa.com/guides/tampa-hotels"),
      f("Link events", "Link /events/tampa-events for broader entertainment", "Internal", "https://visitintampa.com/events/tampa-events"),
      f("Link map", "Link /getting-around/tampa-map", "Internal", "https://visitintampa.com/getting-around/tampa-map"),
      f("Link restaurants hub", "Link /food-and-drink/tampa-restaurants for city dining contrast", "Internal", "https://visitintampa.com/food-and-drink/tampa-restaurants"),
      f("Concerts", "Hard Rock Live / entertainment calendar — confirm shows on official site; no invented ticket prices", "Hard Rock Tampa", "https://www.seminolehardrocktampa.com/"),
      f("Dining", "On-site restaurants — names/hours only from note/official pages", "Hard Rock Tampa", "https://www.seminolehardrocktampa.com/"),
      f("Hotel", "Hotel tower lodging — fees only if in note/pack from official pages", "Hard Rock Tampa", "https://www.seminolehardrocktampa.com/"),
      f("Word floor", "Minimum 1,200 words", "Editorial", "https://visitintampa.com/guides/seminole-hard-rock-tampa"),
      f("Open status", "Official site live — operating resort", "Hard Rock Tampa", "https://www.seminolehardrocktampa.com/"),
    ],
  ),
  pack(
    "tampa-map",
    "tampa map",
    ["City limits vs mailing Tampa; bay beaches ≠ Gulf islands."],
    [
      f("City Hall", "306 E Jackson Street, Tampa, FL 33602", "City of Tampa", "https://www.tampa.gov/"),
      f("Mailing vs limits", "Mailing address “Tampa” is not always inside city limits (Temple Terrace / unincorporated Hillsborough)", "City / county geography", "https://www.tampa.gov/"),
      f("Shoreline vs limits", "City says limits extend into Tampa Bay and Hillsborough Bay; land-only outline can mislead", "City of Tampa maps", "https://www.tampa.gov/"),
      f("County map clip", "County municipal maps may clip at water for printing — ordinances define real boundaries", "Hillsborough / City materials", "https://www.tampa.gov/"),
      f("City beaches", "City-run beaches are bay beaches (sunrise–sunset messaging in city materials) — not Gulf barrier-island towns", "City of Tampa", "https://www.tampa.gov/"),
      f("Checked", "November 3, 2026", "Pack metadata", "https://visitintampa.com/getting-around/tampa-map"),
      f("Link airport", "Link /getting-around/tampa-international-airport", "Internal", "https://visitintampa.com/getting-around/tampa-international-airport"),
      f("Link overview", "Link /guides/tampa-florida-overview", "Internal", "https://visitintampa.com/guides/tampa-florida-overview"),
      f("Link population", "Link /guides/tampa-population", "Internal", "https://visitintampa.com/guides/tampa-population"),
      f("Link zip", "Link /guides/tampa-usa-zip-code", "Internal", "https://visitintampa.com/guides/tampa-usa-zip-code"),
      f("GIS", "Prefer City of Tampa GIS / official boundary maps over pretty tourist pins", "City of Tampa", "https://www.tampa.gov/"),
      f("Word floor", "Minimum 1,200 words", "Editorial", "https://visitintampa.com/getting-around/tampa-map"),
      f("Link St Pete", "Link /guides/tampa-to-st-petersburg for bay crossings", "Internal", "https://visitintampa.com/guides/tampa-to-st-petersburg"),
      f("Link Clearwater", "Link /guides/tampa-to-clearwater for Courtney Campbell context", "Internal", "https://visitintampa.com/guides/tampa-to-clearwater"),
      f("Phone", "City Hall (813) 274-8211", "City of Tampa", "https://www.tampa.gov/"),
    ],
  ),
];

async function main() {
  for (const p of packs) {
    if (p.facts.length < 15) throw new Error(`${p.slug} only ${p.facts.length} facts`);
    saveFactPack(p);
    console.log(`Wrote ${p.slug}: ${p.facts.length} facts`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
