/**
 * Batch C hub fact packs (30+ facts each) with internal hub-link inventory.
 * npx tsx scripts/article-gen/write-batch-c-hubs.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { saveFactPack, type FactEntry, type FactPack } from "./fact-pack";

const CHECKED = "2026-11-02";
const ROOT = process.cwd();

function f(claim: string, value: string, sourceName: string, sourceUrl: string): FactEntry {
  return { claim, value, sourceName, sourceUrl, checkedAt: CHECKED };
}

function pack(slug: string, keyword: string, notes: string[], facts: FactEntry[]): FactPack {
  return { slug, keyword, checkedAt: CHECKED, notes, facts, allowedTokens: [] };
}

function pillarPath(pillar: string, slug: string): string {
  switch (pillar) {
    case "events":
      return `/events/${slug}`;
    case "things-to-do":
      return `/things-to-do/${slug}`;
    case "food-and-drink":
      return `/food-and-drink/${slug}`;
    case "getting-around":
      return `/getting-around/${slug}`;
    case "shopping":
      return `/shopping/${slug}`;
    default:
      return `/guides/${slug}`;
  }
}

type InvItem = { slug: string; pillar: string; title: string };
type Inv = Record<string, InvItem[]>;

function hubLinkFacts(items: InvItem[], hubLabel: string): FactEntry[] {
  return items.map((item, i) =>
    f(
      `${hubLabel} hub link ${i + 1}`,
      `Internal link target: ${pillarPath(item.pillar, item.slug)} — ${item.title}. Article MUST link this related guide somewhere in the hub body.`,
      "Visit In Tampa published inventory",
      `https://visitintampa.com${pillarPath(item.pillar, item.slug)}`,
    ),
  );
}

const inv = JSON.parse(
  readFileSync(join(ROOT, "output/remaining/_hub-link-inventory.json"), "utf8"),
) as Inv;

const hotelsCore: FactEntry[] = [
  f("Hub purpose", "This page is the Tampa hotels hub — orient by neighborhood (downtown/Riverwalk/Water Street, Westshore, Hard Rock) and link out to individual hotel guides; do not invent nightly rates", "Visit In Tampa editorial", "https://visitintampa.com/guides/tampa-hotels"),
  f("City Hall / downtown pin", "City of Tampa contact: 306 East Jackson Street, Tampa, FL 33602; (813) 274-8211", "City of Tampa", "https://www.tampa.gov/"),
  f("TPA distance context", "Tampa International Airport is the main arrival airport for hotel guests; hotel pages often quote miles from TPA — use only numbers from child guides/packs", "Tampa International Airport", "https://www.tampaairport.com/"),
  f("Convention cluster", "Tampa Convention Center at 333 S Franklin St anchors downtown hotel demand; city lists Marriott Water Street, JW, Embassy Suites across the street; Westin Waterside ~0.3 mi; Hilton Downtown ~0.5 mi", "Tampa Convention Center / City attendee materials", "https://www.tampaconventioncenter.com/"),
  f("Riverwalk path length (TCC materials)", "Tampa Riverwalk described as about 2.4 miles of walkable path in convention-center attendee copy", "Tampa Convention Center attendee info", "https://www.tampaconventioncenter.com/"),
  f("Hotel Tampa Riverwalk reno", "Hotel Tampa Riverwalk renovations through November 30, 2026; pool and F&B closed during renovations; fitness open 24/7 — confirm on hotel FAQ", "Hotel Tampa Riverwalk FAQ", "https://www.hoteltampariverwalk.com/faq"),
  f("Marriott Water Street destination fee", "Destination fee listed at $20/night on Marriott rooms page; confirm when booking", "Marriott Water Street rooms", "https://www.marriott.com/en-us/hotels/tpamc-tampa-marriott-water-street/rooms/"),
  f("Visit Tampa Bay role", "Visit Tampa Bay publishes meeting/hotel listings for downtown properties — use as directory context, not rate quotes", "Visit Tampa Bay", "https://www.visittampabay.com/"),
  f("Friends of the Riverwalk hotel list", "Friends of the Riverwalk groups stays along the Riverwalk (Hotel Tampa Riverwalk, Hilton Downtown, Hyatt Place/House, Marriott, JW, Barrymore)", "Friends of the Riverwalk — Hotels", "https://thetampariverwalk.com/visit/hotels.html"),
  f("Hard Rock is not downtown waterfront", "Seminole Hard Rock Tampa is a separate hotel/entertainment campus — link the dedicated guide; do not treat it as a Riverwalk hotel", "Seminole Hard Rock Tampa guide", "https://visitintampa.com/guides/seminole-hard-rock-tampa"),
  f("Westshore vs downtown", "Westshore Marriott sits on N Westshore Blvd near malls/airport corridor — different trip from Water Street", "Westshore Marriott guide", "https://visitintampa.com/guides/westshore-marriott-hotel-tampa"),
  f("No invented ADR", "Do not invent average daily rates or star ratings not in note/pack", "Editorial rule", "https://visitintampa.com/guides/tampa-hotels"),
  f("Parking theme", "Downtown parking is often valet or city garages (Pam Iorio etc.); quote garage numbers only from child articles/packs", "City of Tampa parking", "https://www.tampa.gov/parking/info/parking-hourly-and-daily-rates"),
  f("Streetcar context", "TECO Streetcar connects downtown / Channelside / Ybor — useful for hotel guests without a car", "HART / City materials via notes", "https://www.tampa.gov/"),
  f("Checked date", "November 2, 2026", "Pack metadata", "https://visitintampa.com/guides/tampa-hotels"),
  f("Open/closed rule", "Only feature hotels with confirmed-open official sites; Hyatt Regency name is historical — property is Hilton Tampa Downtown", "Open/closed gate 2026-11-02", "https://www.hilton.com/"),
  f("Barrymore near not on-path", "Barrymore uses Riverwalk in the name but is near, not on, the path — hub should say so and link the Barrymore guide", "Barrymore / Riverwalk hotels guides", "https://visitintampa.com/guides/barrymore-hotel-tampa"),
  f("EDITION / Westin guides exist", "Link The Tampa EDITION and Westin Tampa Waterside individual guides rather than re-copying full fee tables", "Published guides", "https://visitintampa.com/guides/the-tampa-edition"),
  f("Directory / places", "Directory and places sections may list additional lodging — hub should point readers to /directory and /places for browsing, without inventing listing details", "Visit In Tampa directory", "https://visitintampa.com/directory"),
  f("Word-count target", "Hub article target 1,800–2,500 words covering neighborhoods, when to stay where, and outbound links to every hotel guide in the pack", "Editorial brief", "https://visitintampa.com/guides/tampa-hotels"),
  f("Also link riverwalk hub", "Must link /guides/tampa-riverwalk-hotels as the Riverwalk-specific hotel sorter", "Riverwalk hotels guide", "https://visitintampa.com/guides/tampa-riverwalk-hotels"),
  f("Map companion", "Link /getting-around/tampa-map for placing neighborhoods", "Tampa map guide", "https://visitintampa.com/getting-around/tampa-map"),
  f("Airport arrival companion", "Link /getting-around/tampa-international-airport for arrival logistics", "TPA guide", "https://visitintampa.com/getting-around/tampa-international-airport"),
];

const eventsCore: FactEntry[] = [
  f("Hub purpose", "Tampa events hub — sports, shows, fairgrounds RV, trampoline/Topgolf style attractions; link child guides; do not invent ticket prices or single-game schedules", "Visit In Tampa editorial", "https://visitintampa.com/events/tampa-events"),
  f("Raymond James Stadium", "4201 N Dale Mabry Hwy, Tampa, FL 33607 — Bucs / USF / bowls; see stadium guide", "Raymond James Stadium", "https://www.raymondjamesstadium.com/"),
  f("Benchmark International Arena", "401 Channelside Drive — Lightning home; formerly Amalie Arena", "Benchmark International Arena", "https://www.benchmarkintlarena.com/"),
  f("Tropicana Field", "1 Tropicana Dr, St. Petersburg — Rays home; not in Tampa city", "Rays / Tropicana guides", "https://visitintampa.com/events/tropicana-field"),
  f("RV shows", "Florida RV SuperShow (Jan) and Tampa Bay Fall RV Show (Nov) at Florida State Fairgrounds — see tampa-rv-show guide", "FRVTA", "https://www.frvta.org/shows/"),
  f("Fairgrounds address", "4800 US Highway 301 North, Tampa, FL 33610", "FRVTA / fairgrounds", "https://floridastatefairgrounds.com/"),
  f("Straz / TBPAC", "Performing arts campus covered in TBPAC guide — link for theater nights", "TBPAC guide", "https://visitintampa.com/things-to-do/tbpac-tampa"),
  f("Tampa Theatre", "1926 movie palace — link tampa-theatre guide", "Tampa Theatre guide", "https://visitintampa.com/things-to-do/tampa-theatre"),
  f("Topgolf", "10690 Palm River Road — link topgolf-tampa", "Topgolf guide", "https://visitintampa.com/events/topgolf-tampa"),
  f("Trampoline parks", "Altitude, Sky Zone, Urban Air — link trampoline-parks-tampa", "Trampoline parks guide", "https://visitintampa.com/events/trampoline-parks-tampa"),
  f("TPC Tampa", "TPC Tampa Bay in Lutz — golf events/play; link tpc-tampa", "TPC guide", "https://visitintampa.com/events/tpc-tampa"),
  f("Tarpons", "Yankees Single-A at Steinbrenner Field — link tampa-tarpons", "Tarpons guide", "https://visitintampa.com/events/tampa-tarpons"),
  f("Weekend listicles", "things-to-do-this-weekend / Saturday guides exist under things-to-do — cross-link for soft calendars", "Weekend guides", "https://visitintampa.com/things-to-do/things-to-do-in-tampa-this-weekend"),
  f("No invented calendar", "Do not invent a master events calendar or prices; point to team/venue official sites and child guides", "Editorial rule", "https://visitintampa.com/events/tampa-events"),
  f("Checked date", "November 2, 2026", "Pack metadata", "https://visitintampa.com/events/tampa-events"),
  f("Word-count target", "1,800–2,500 words; cover sports triangle, downtown entertainment, fairgrounds, family attractions", "Editorial brief", "https://visitintampa.com/events/tampa-events"),
  f("Lightning tickets companion", "Link tampa-lightning-tickets separately from the Lightning overview", "Tickets guide", "https://visitintampa.com/events/tampa-lightning-tickets"),
  f("Rays schedule companion", "Link tampa-rays-schedule for how to read home/away/today", "Schedule guide", "https://visitintampa.com/events/tampa-rays-schedule"),
  f("Bucs companion", "Link tampa-buccaneers for Ray Jay tickets/parking/bags", "Bucs guide", "https://visitintampa.com/events/tampa-buccaneers"),
  f("Stadium disambiguation", "Link tampa-stadium-guide early — Ray Jay vs arena vs Trop", "Stadium guide", "https://visitintampa.com/events/tampa-stadium-guide"),
  f("Directory events", "Point to /events pillar index and /directory for browsing", "Site navigation", "https://visitintampa.com/events"),
  f("Convention events", "Some public events use Tampa Convention Center — link convention-center draft when published; for now name TCC address 333 S Franklin without inventing ticket desks", "TCC", "https://www.tampaconventioncenter.com/"),
];

const attractionsCore: FactEntry[] = [
  f("Hub purpose", "Tampa attractions hub — aquarium, zoo, museums, Riverwalk, Ybor, water park, skatepark, theater; link child guides; no invented ticket prices", "Visit In Tampa editorial", "https://visitintampa.com/things-to-do/tampa-attractions"),
  f("Florida Aquarium", "Downtown Channelside aquarium — link florida-aquarium-tampa", "Aquarium guide", "https://visitintampa.com/things-to-do/florida-aquarium-tampa"),
  f("ZooTampa", "ZooTampa at Lowry Park — link tampa-zoo", "Zoo guide", "https://visitintampa.com/things-to-do/tampa-zoo"),
  f("Adventure Island", "Seasonal water park — link adventure-island-tampa; note seasonal closure messaging from that guide", "Adventure Island guide", "https://visitintampa.com/things-to-do/adventure-island-tampa"),
  f("Tampa Museum of Art", "120 W Gasparilla Plaza — link tampa-museum-of-art", "Museum guide", "https://visitintampa.com/things-to-do/tampa-museum-of-art"),
  f("Skatepark of Tampa", "SPoT hours/rates guide — link skatepark-of-tampa", "SPoT guide", "https://visitintampa.com/things-to-do/skatepark-of-tampa"),
  f("Riverwalk", "Downtown pedestrian waterfront path — pair with riverwalk hotels + things-to-do listicles", "Riverwalk context", "https://thetampariverwalk.com/"),
  f("Ybor City", "Historic cigar district / 33605 — link ybor-city-tampa-fl-33605", "Ybor guide", "https://visitintampa.com/guides/ybor-city-tampa-fl-33605"),
  f("Things to do listicle", "Link things-to-do-in-tampa as the curated favorites list", "Things to do guide", "https://visitintampa.com/things-to-do/things-to-do-in-tampa"),
  f("Saturday / weekend", "Link Saturday and this-weekend guides for day-planning", "Weekend guides", "https://visitintampa.com/things-to-do/things-to-do-on-saturday-in-tampa"),
  f("Straz / Theatre", "Link tbpac-tampa and tampa-theatre for performing arts", "Arts guides", "https://visitintampa.com/things-to-do/tbpac-tampa"),
  f("Trampoline / Topgolf", "Active indoor attractions — link trampoline-parks-tampa and topgolf-tampa", "Active guides", "https://visitintampa.com/events/trampoline-parks-tampa"),
  f("Busch Gardens mention rule", "If note mentions Busch Gardens, keep high-level and do not invent ticket prices; point to official site", "Editorial rule", "https://visitintampa.com/things-to-do/tampa-attractions"),
  f("Checked date", "November 2, 2026", "Pack metadata", "https://visitintampa.com/things-to-do/tampa-attractions"),
  f("Word-count target", "1,800–2,500 words organized by downtown / north Tampa / historic / active", "Editorial brief", "https://visitintampa.com/things-to-do/tampa-attractions"),
  f("Map companion", "Link tampa-map for geography", "Map guide", "https://visitintampa.com/getting-around/tampa-map"),
  f("Shopping companions", "Link tampa-flea-market and international-plaza-tampa when covering rainy-day/shopping adjacent attractions", "Shopping guides", "https://visitintampa.com/shopping/international-plaza-tampa"),
  f("No invented hours", "Hours belong in child guides; hub summarizes and links", "Editorial rule", "https://visitintampa.com/things-to-do/tampa-attractions"),
  f("Places directory", "Point readers to /places and /things-to-do indexes", "Site navigation", "https://visitintampa.com/things-to-do"),
  f("City beaches note", "City bay beaches ≠ Gulf barrier islands — if note covers beaches, keep that distinction", "City of Tampa / map notes", "https://www.tampa.gov/"),
];

const restaurantsCore: FactEntry[] = [
  f("Hub purpose", "Tampa restaurants hub — food halls, steakhouses, waterfront, Brazilian, Chinese, Water Street; link each published restaurant guide; no invented prices", "Visit In Tampa editorial", "https://visitintampa.com/food-and-drink/tampa-restaurants"),
  f("Armature Works", "Tampa Heights food hall — link armature-works-tampa", "Armature Works guide", "https://visitintampa.com/food-and-drink/armature-works-tampa"),
  f("Ulele", "Tampa Heights / river restaurant — link ulele-tampa", "Ulele guide", "https://visitintampa.com/food-and-drink/ulele-tampa"),
  f("Rusty Pelican", "Rocky Point waterfront — link rusty-pelican-tampa", "Rusty Pelican guide", "https://visitintampa.com/food-and-drink/rusty-pelican-tampa"),
  f("The Pearl", "Water Street gastropub — link the-pearl-tampa", "Pearl guide", "https://visitintampa.com/food-and-drink/the-pearl-tampa"),
  f("Yard House", "Water Street — link yard-house-tampa", "Yard House guide", "https://visitintampa.com/food-and-drink/yard-house-tampa"),
  f("Terra Gaucha", "Dale Mabry churrascaria — link terra-gaucha-tampa", "Terra Gaucha guide", "https://visitintampa.com/food-and-drink/terra-gaucha-tampa"),
  f("Texas de Brazil", "Boy Scout Blvd churrascaria — link texas-de-brazil-tampa", "Texas de Brazil guide", "https://visitintampa.com/food-and-drink/texas-de-brazil-tampa"),
  f("Yummy House", "Chinese — link yummy-house-tampa", "Yummy House guide", "https://visitintampa.com/food-and-drink/yummy-house-tampa"),
  f("Wright's Gourmet", "South Tampa classic — link wrights-gourmet-house-tampa", "Wright's guide", "https://visitintampa.com/food-and-drink/wrights-gourmet-house-tampa"),
  f("Open/closed rule", "Only feature restaurants confirmed open via official site/recent official social/news; hold unknowns", "Editorial rule", "https://visitintampa.com/food-and-drink/tampa-restaurants"),
  f("Reservations theme", "Reservation culture varies — tell readers to check each child guide / OpenTable without inventing wait times", "Editorial rule", "https://visitintampa.com/food-and-drink/tampa-restaurants"),
  f("Neighborhood clusters", "Organize by Water Street/downtown, Tampa Heights, Rocky Point, South Tampa, Dale Mabry corridor", "Editorial structure", "https://visitintampa.com/food-and-drink/tampa-restaurants"),
  f("Checked date", "November 2, 2026", "Pack metadata", "https://visitintampa.com/food-and-drink/tampa-restaurants"),
  f("Word-count target", "1,800–2,500 words", "Editorial brief", "https://visitintampa.com/food-and-drink/tampa-restaurants"),
  f("Food-and-drink index", "Link /food-and-drink pillar hub", "Site navigation", "https://visitintampa.com/food-and-drink"),
  f("Hotels for dinner plans", "Cross-link tampa-hotels / riverwalk-hotels for visitors pairing dinner and lodging", "Hotels hubs", "https://visitintampa.com/guides/tampa-hotels"),
  f("Ybor dining", "Ybor nightlife/dining belongs with Ybor guide — link ybor-city-tampa-fl-33605 rather than inventing restaurant lists", "Ybor guide", "https://visitintampa.com/guides/ybor-city-tampa-fl-33605"),
  f("No menu scraping", "Do not invent signature dishes or prices not in note/pack/child guides", "Editorial rule", "https://visitintampa.com/food-and-drink/tampa-restaurants"),
  f("Directory places", "Point to /places for additional food listings without fabricating details", "Places", "https://visitintampa.com/places"),
  f("Attractions cross-link", "Pair dining with /things-to-do/tampa-attractions and /things-to-do/things-to-do-in-tampa for day-and-dinner itineraries", "Attractions companions", "https://visitintampa.com/things-to-do/tampa-attractions"),
];

const overviewCore: FactEntry[] = [
  f("Hub purpose", "Tampa Florida overview hub — geography, population, ZIP/area code, airport, day trips, map; link every practical companion guide", "Visit In Tampa editorial", "https://visitintampa.com/guides/tampa-florida-overview"),
  f("City population Jul 1 2025", "Tampa city 413,554 (Census V2025)", "Census QuickFacts Tampa city", "https://www.census.gov/quickfacts/fact/table/tampacityflorida/PST045225"),
  f("Metro population Jul 1 2025", "Tampa–St. Pete–Clearwater MSA 3,418,895", "FRED TMAPOP / Census metro", "https://fred.stlouisfed.org/series/TMAPOP"),
  f("City Hall", "306 E Jackson St, Tampa, FL 33602; (813) 274-8211", "City of Tampa", "https://www.tampa.gov/"),
  f("Area codes", "813 with 656 overlay; mandatory 10-digit dialing since Jan 22, 2022", "NANPA PL-552", "https://nationalnanpa.com/pdf/PL-552.pdf"),
  f("Time zone", "Eastern Time — link what-time-zone-is-tampa-florida", "Time zone guide", "https://visitintampa.com/guides/what-time-zone-is-tampa-florida"),
  f("ZIP reality", "Many 336xx codes — link tampa-usa-zip-code, tampa-zip-code, zip-code-hillsborough-tampa-fl", "ZIP guides", "https://visitintampa.com/guides/tampa-usa-zip-code"),
  f("Map guide", "Link tampa-map for city limits vs bay lines", "Map guide", "https://visitintampa.com/getting-around/tampa-map"),
  f("Airport", "TPA — link tampa-international-airport", "TPA guide", "https://visitintampa.com/getting-around/tampa-international-airport"),
  f("Day trip Miami", "~280 miles / 4.5–5.5 hr estimate — link tampa-to-miami", "Miami drive guide", "https://visitintampa.com/guides/tampa-to-miami"),
  f("Day trip Fort Myers", "FDOT ~124/125 — link tampa-to-fort-myers", "Fort Myers guide", "https://visitintampa.com/guides/tampa-to-fort-myers"),
  f("Day trip St Pete", "Link tampa-to-st-petersburg", "St Pete guide", "https://visitintampa.com/guides/tampa-to-st-petersburg"),
  f("Day trip Clearwater", "Link tampa-to-clearwater", "Clearwater guide", "https://visitintampa.com/guides/tampa-to-clearwater"),
  f("Day trip Orlando", "Link tampa-to-orlando", "Orlando guide", "https://visitintampa.com/guides/tampa-to-orlando"),
  f("Population companion", "Link tampa-population for city vs metro deep dive", "Population guide", "https://visitintampa.com/guides/tampa-population"),
  f("Attractions / hotels / food / events hubs", "Cross-link the other Batch C hubs when published; until then link existing things-to-do-in-tampa, tampa-hotels child pages, food guides, events sports guides", "Hub network", "https://visitintampa.com/"),
  f("Checked date", "November 2, 2026", "Pack metadata", "https://visitintampa.com/guides/tampa-florida-overview"),
  f("Word-count target", "1,800–2,500 words", "Editorial brief", "https://visitintampa.com/guides/tampa-florida-overview"),
  f("Hillsborough vs city", "Hillsborough County population and mailing city ≠ city limits — keep boundaries clear via map/ZIP/population guides", "Census / map notes", "https://www.census.gov/quickfacts/fact/table/tampacityflorida/PST045225"),
  f("Visit Tampa Bay", "Official tourism marketing site for broader destination framing — not a substitute for Census/FDOT numbers", "Visit Tampa Bay", "https://www.visittampabay.com/"),
  f("Neighborhoods", "Point to /neighborhoods for local area pages without inventing neighborhood stats", "Neighborhoods index", "https://visitintampa.com/neighborhoods"),
];

function buildHub(
  slug: string,
  keyword: string,
  invKey: keyof Inv,
  core: FactEntry[],
  extraNotes: string[],
): FactPack {
  const links = hubLinkFacts(inv[invKey] ?? [], keyword);
  const facts = [...core, ...links];
  if (facts.length < 30) {
    throw new Error(`${slug} only ${facts.length} facts`);
  }
  return pack(
    slug,
    keyword,
    [
      ...extraNotes,
      `Hub article: link every related guide listed in the fact pack hub-link facts.`,
      `Target length 1,800–2,500 words. Minimum acceptable for checks: 1,800.`,
      `Do not invent prices/hours/schedules; defer to child guides and official URLs in the pack.`,
    ],
    facts,
  );
}

async function main(): Promise<void> {
  const hubs = [
    buildHub("tampa-hotels", "tampa hotels", "hotels", hotelsCore, [
      "Organize by downtown/Riverwalk/Water Street, Westshore, Hard Rock campus.",
    ]),
    buildHub("tampa-events", "tampa events", "events", eventsCore, [
      "Lead with sports venues disambiguation, then fairgrounds/family/active.",
    ]),
    buildHub("tampa-attractions", "tampa attractions", "attractions", attractionsCore, [
      "Cover downtown waterfront, north Tampa parks, historic Ybor, active indoor.",
    ]),
    buildHub("tampa-restaurants", "tampa restaurants", "restaurants", restaurantsCore, [
      "Only restaurants with published guides / confirmed open status.",
    ]),
    buildHub("tampa-florida-overview", "tampa florida", "overview", overviewCore, [
      "Orientation hub for first-time visitors and factual Tampa Florida queries.",
    ]),
  ];
  for (const p of hubs) {
    saveFactPack(p);
    console.log(`Wrote ${p.slug}: ${p.facts.length} facts`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
