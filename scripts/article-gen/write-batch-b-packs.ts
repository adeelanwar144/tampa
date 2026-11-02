/**
 * Fact packs for Batch B non-venue drafts (2026-11-02).
 * Run: npx tsx scripts/article-gen/write-batch-b-packs.ts
 */
import { saveFactPack, type FactEntry, type FactPack } from "./fact-pack";

const CHECKED = "2026-11-02";

function f(
  claim: string,
  value: string,
  sourceName: string,
  sourceUrl: string,
): FactEntry {
  return { claim, value, sourceName, sourceUrl, checkedAt: CHECKED };
}

function pack(
  slug: string,
  keyword: string,
  notes: string[],
  facts: FactEntry[],
): FactPack {
  return { slug, keyword, checkedAt: CHECKED, notes, facts, allowedTokens: [] };
}

const population = pack(
  "tampa-population",
  "tampa population",
  [
    "City vs metro vs metro division must stay separate; never blend 413,554 with 3,418,895.",
    "2020-2024 ACS sample figures are not the July 1, 2025 headcount.",
    "Vintage V2025 series is not comparable across vintages.",
  ],
  [
    f(
      "City population estimate July 1, 2025",
      "Tampa city, Florida: 413,554 (V2025)",
      "U.S. Census Bureau QuickFacts — Tampa city, Florida",
      "https://www.census.gov/quickfacts/fact/table/tampacityflorida/PST045225",
    ),
    f(
      "City estimates base April 1, 2020 (V2025)",
      "385,336",
      "U.S. Census Bureau QuickFacts — Tampa city, Florida",
      "https://www.census.gov/quickfacts/fact/table/tampacityflorida/PST045225",
    ),
    f(
      "City percent change April 1, 2020 base to July 1, 2025",
      "7.3%",
      "U.S. Census Bureau QuickFacts — Tampa city, Florida",
      "https://www.census.gov/quickfacts/fact/table/tampacityflorida/PST045225",
    ),
    f(
      "City Census count April 1, 2020",
      "384,959 (distinct from estimates base 385,336)",
      "U.S. Census Bureau QuickFacts — Tampa city, Florida",
      "https://www.census.gov/quickfacts/fact/table/tampacityflorida/PST045225",
    ),
    f(
      "City Census count April 1, 2010",
      "335,709",
      "U.S. Census Bureau QuickFacts — Tampa city, Florida",
      "https://www.census.gov/quickfacts/fact/table/tampacityflorida/PST045225",
    ),
    f(
      "Age / origin shares (QuickFacts)",
      "Under 18: 19.4%; 65+: 13.7%; Hispanic or Latino: 26.2%; foreign-born 2020–2024: 19.4%; language other than English at home age 5+: 28.3%",
      "U.S. Census Bureau QuickFacts — Tampa city, Florida",
      "https://www.census.gov/quickfacts/fact/table/tampacityflorida/PST045225",
    ),
    f(
      "Households and income (ACS 2020–2024 window)",
      "Households 166,278; persons per household 2.31; median household income (2024 dollars) $75,475; persons in poverty 15.5%; median gross rent $1,701; median owner-occupied value $420,400; mean travel time to work 24.8 minutes",
      "U.S. Census Bureau QuickFacts — Tampa city, Florida",
      "https://www.census.gov/quickfacts/fact/table/tampacityflorida/PST045225",
    ),
    f(
      "Land area and 2020 density",
      "Land area 2020: 114.02 sq mi; population per square mile 2020: 3,376.4. Do not divide 413,554 by 114.02 and call it a census density.",
      "U.S. Census Bureau QuickFacts — Tampa city, Florida",
      "https://www.census.gov/quickfacts/fact/table/tampacityflorida/PST045225",
    ),
    f(
      "Retail sales 2022 (Economic Census units)",
      "Total retail sales 2022: 11,377,387 (in $1,000s); retail sales per capita $28,563",
      "U.S. Census Bureau QuickFacts — Tampa city, Florida",
      "https://www.census.gov/quickfacts/fact/table/tampacityflorida/PST045225",
    ),
    f(
      "MSA population July 1, 2025",
      "Tampa–St. Petersburg–Clearwater, FL MSA: 3,418,895 (July 1, 2025). April 1, 2020 estimates base 3,175,282. Not the city figure.",
      "FRED / U.S. Census Bureau metro estimates (TMAPOP)",
      "https://fred.stlouisfed.org/series/TMAPOP",
    ),
    f(
      "MSA annual July 1 series (same vintage)",
      "2020: 3,187,831; 2021: 3,230,962; 2022: 3,307,164; 2023: 3,370,351; 2024: 3,405,357; 2025: 3,418,895. Change 2024→2025: +13,538",
      "Ben note from Census metro components; FRED confirms 2025 = 3,418.895 thousand",
      "https://www.census.gov/data/datasets/time-series/demo/popest/2020s-total-metro-and-micro-statistical-areas.html",
    ),
    f(
      "Tampa FL metropolitan division July 1, 2025 (note transcription)",
      "Tampa, FL metropolitan division ≈ 2,470,332; component counties in that note: Hernando 221,701; Hillsborough 1,574,115; Pasco 674,516. Division ≠ city.",
      "Ben note citing Census metro/micro components release (March 2026 vintage context)",
      "https://www.census.gov/data/datasets/time-series/demo/popest/2020s-total-metro-and-micro-statistical-areas.html",
    ),
    f(
      "St. Petersburg–Clearwater–Largo division / Pinellas (note transcription)",
      "July 1, 2025 estimate 948,563; July 1, 2024 960,397; April 1, 2020 base 959,090. 2025 below 2024 — do not invent a cause.",
      "Ben note citing Census metro/micro components",
      "https://www.census.gov/data/datasets/time-series/demo/popest/2020s-total-metro-and-micro-statistical-areas.html",
    ),
    f(
      "Vintage year meaning",
      "V2025 means final year of the 2020–2025 series; different vintage years are not comparable. Housing units July 1, 2025 for the city are flagged not applicable (X) on QuickFacts.",
      "U.S. Census Bureau QuickFacts notes — Tampa city, Florida",
      "https://www.census.gov/quickfacts/fact/table/tampacityflorida/PST045225",
    ),
    f(
      "City CSV cross-check (Florida cities file)",
      "sub-est2025_12.csv lists Tampa city, Florida ending July 1, 2025 estimate 413554 (matches QuickFacts)",
      "U.S. Census Bureau — City and Town Population Totals 2020–2025 (Florida)",
      "https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/cities/totals/sub-est2025_12.csv",
    ),
    f(
      "Race / sex QuickFacts shares",
      "Female 49.8%; White alone 49.0%; Black alone 20.4%; Asian alone 4.9%; Two or More Races 19.9%; White alone not Hispanic 44.3%",
      "U.S. Census Bureau QuickFacts — Tampa city, Florida",
      "https://www.census.gov/quickfacts/fact/table/tampacityflorida/PST045225",
    ),
    f(
      "Education / health QuickFacts",
      "High school graduate or higher age 25+ 90.2%; bachelor’s or higher 45.7%; disability under 65 8.1%; without health insurance under 65 12.1%",
      "U.S. Census Bureau QuickFacts — Tampa city, Florida",
      "https://www.census.gov/quickfacts/fact/table/tampacityflorida/PST045225",
    ),
    f(
      "Labor force QuickFacts",
      "Civilian labor force age 16+ 66.1%; female labor force 62.3%; per capita income (2024 dollars, 2020–2024) $52,528",
      "U.S. Census Bureau QuickFacts — Tampa city, Florida",
      "https://www.census.gov/quickfacts/fact/table/tampacityflorida/PST045225",
    ),
    f(
      "Housing tenure QuickFacts",
      "Owner-occupied housing unit rate 2020–2024: 50.3%; median selected monthly owner costs with mortgage $2,179; without mortgage $640",
      "U.S. Census Bureau QuickFacts — Tampa city, Florida",
      "https://www.census.gov/quickfacts/fact/table/tampacityflorida/PST045225",
    ),
    f(
      "2010 land area / density (contrast)",
      "2010 land area 113.41 sq mi; 2010 population per square mile 2,960.2 — census-year figures, not July 1, 2025 density",
      "U.S. Census Bureau QuickFacts — Tampa city, Florida",
      "https://www.census.gov/quickfacts/fact/table/tampacityflorida/PST045225",
    ),
    f(
      "Metro dataset landing page",
      "Census publishes MSA/micro population totals and components 2020–2025 (Vintage 2025) on the metro-micro statistical areas estimates page",
      "U.S. Census Bureau — Metro and Micro Statistical Area Population Totals 2020–2025",
      "https://www.census.gov/data/datasets/time-series/demo/popest/2020s-total-metro-and-micro-statistical-areas.html",
    ),
  ],
);

const zip = pack(
  "tampa-usa-zip-code",
  "tampa usa zip code",
  [
    "There is no single Tampa ZIP; do not invent a master code.",
    "USA/country belongs on its own line for international pieces — not between city and ZIP.",
    "FL = Florida on the city line; FL = floor as a unit designator on the street line — different slots.",
  ],
  [
    f(
      "USPS last-line format",
      "Last line: city name, two-letter state abbreviation, then ZIP or ZIP+4. At least one space between city, state, and ZIP+4; two spaces preferred between state and ZIP+4. Example form: TAMPA FL 33602 (or ZIP+4).",
      "USPS Publication 28 — §224 Format",
      "https://pe.usps.com/text/pub28/pub28c2_009.htm",
    ),
    f(
      "Florida state abbreviation",
      "FL",
      "USPS Publication 28 — Appendix B two-letter state abbreviations",
      "https://pe.usps.com/text/pub28/28apb.htm",
    ),
    f(
      "ZIP vs ZIP+4",
      "Use ZIP+4 when known; otherwise the five-digit ZIP. ZIP+4 format is five digits, hyphen, four digits. Do not invent a +4.",
      "USPS DMM 602 Addressing — ZIP Code / ZIP+4",
      "https://pe.usps.com/teXt/dmm300/602.htm",
    ),
    f(
      "Address element order (domestic)",
      "Recipient; street (with unit); city and state; ZIP. Country is not part of the domestic last line.",
      "USPS DMM 602 Addressing — Address Elements",
      "https://pe.usps.com/teXt/dmm300/602.htm",
    ),
    f(
      "International mail country line",
      "For international pieces, country name alone on the bottom line, preferably full capitals, no abbreviations; ZIP stays with city/state above — not on the country line.",
      "USPS international addressing standards (via Ben note + Pub 28 / international guidance)",
      "https://pe.usps.com/text/pub28/pub28c2_001.htm",
    ),
    f(
      "City of Tampa main contact address / ZIP",
      "306 East Jackson Street, Tampa, Florida 33602; phone (813) 274-8211. Spells Florida out on letterhead; USPS prefers FL on the last line.",
      "City of Tampa — homepage contact",
      "https://www.tampa.gov/",
    ),
    f(
      "City-published example ZIPs (not a complete list)",
      "Examples from city materials in Ben’s note: Courtney Campbell beach 7740 W Courtney Campbell Causeway 33607; Cypress Point 5620 W Cypress St 33607; Davis Islands seaplane basin 864 Severn Ave 33606; Picnic Island 7409 Picnic Island Blvd 33616; parks office 3402 W Columbus Dr 33607. Multiple codes for one city government.",
      "City of Tampa materials as transcribed in Ben note; contact hub confirms 33602 for City Hall",
      "https://www.tampa.gov/",
    ),
    f(
      "Phone country / area codes are not ZIP codes",
      "Country calling code +1; Tampa local area codes include 813 (and 656 per Ben note). Neither substitutes for a ZIP.",
      "Ben note + City of Tampa contact phone (813) 274-8211",
      "https://www.tampa.gov/",
    ),
    f(
      "Foreign return address on domestic mail",
      "USPS rule effective December 14, 2023: domestic shipments with a foreign return address are no longer accepted; undeliverable pieces with foreign returns go to dead mail. Foreign returns belong on international mail with customs forms.",
      "Ben note citing USPS rule effective Dec 14, 2023",
      "https://pe.usps.com/teXt/dmm300/602.htm",
    ),
    f(
      "Unit designator FL vs state FL",
      "USPS secondary-unit abbreviations include FL for floor; state abbreviation for Florida is also FL. Floor/unit belongs with the street line; state belongs on the city line.",
      "USPS Publication 28 addressing standards",
      "https://pe.usps.com/CPIM/ftp/pubs/Pub28/pub28.pdf",
    ),
    f(
      "Phrase trap",
      "“tampa usa zip code” scrambles USPS order. Correct domestic shape is Tampa FL #####; country (UNITED STATES / USA) only as its own bottom line when the piece is international.",
      "USPS Pub 28 last-line rules + international country-line practice",
      "https://pe.usps.com/text/pub28/pub28c2_009.htm",
    ),
    f(
      "3-digit ZIP prefix / SCF Tampa",
      "USPS DMM labeling list L002 shows 3-digit destination 336 labeled TAMPA FL 336 (SCF Tampa FL 335 context on the same sheet). Confirms Tampa is a multi-ZIP 336xx area, not one code.",
      "USPS FAST — DMM L002 label list",
      "https://fast.usps.com/fast/fastApp/resources/labelListFileDownloadFile.action?effectiveDate=12%2F01%2F2024&fileName=DMM_L002.pdf",
    ),
    f(
      "USPS facilities using Tampa city name (examples)",
      "Examples from USPS Florida facility list: Commerce 401 N Ashley St Tampa FL 33602; Carrollwood 12651 N Dale Mabry Hwy Tampa FL 33618; Forest Hills 11800 N Florida Ave Tampa FL 33612; Hilldale 3201 W Hillsborough Ave Tampa FL 33614; Interbay 4520 W Oakellar Ave Tampa FL 33611; CFS 6013 Benjamin Rd Tampa FL 33634 — several different 336xx codes under Tampa.",
      "USPS Florida newsroom facility list (2022 ops resume release)",
      "https://about.usps.com/newsroom/local-releases/fl/2022/0929-usps-resumes-operations-in-central-and-southwest-florida.htm",
    ),
    f(
      "Punctuation rule",
      "Except for the hyphen in ZIP+4, punctuation may be omitted in the delivery address block.",
      "USPS Publication 28 — last-line / punctuation guidance",
      "https://pe.usps.com/CPIM/ftp/pubs/Pub28/pub28.pdf",
    ),
    f(
      "Dual address delivery rule",
      "Mail with both a street address and a PO Box is delivered to the address immediately above the city/state (or to the PO Box if both are on the same line); ZIP must match that chosen delivery element.",
      "USPS DMM 602 — Dual Address",
      "https://pe.usps.com/teXt/dmm300/602.htm",
    ),
    f(
      "What the article must not do",
      "Do not publish a single “tampa usa zip code” number as universal. Do not put USA between city and ZIP. Do not put +1 or 813 in the postal field.",
      "USPS Pub 28 + City of Tampa contact examples",
      "https://pe.usps.com/text/pub28/pub28c2_009.htm",
    ),
    f(
      "ZIP Lookup product exists",
      "USPS provides ZipCodeLookup / address tools so a street + city + state returns the matching ZIP / ZIP+4 — preferred over guessing a citywide code.",
      "USPS Web Tools — Address Information API overview",
      "https://www.usps.com/business/web-tools-apis/address-information-api.htm",
    ),
    f(
      "Mailing city vs city limits",
      "A “Tampa” mailing city on a piece is a USPS last-line name; it is not proof the parcel sits inside Tampa city limits. Article should separate mailing city from municipal boundary.",
      "USPS City State product concept (Pub 28) + local reporting practice",
      "https://pe.usps.com/text/pub28/pub28c2_001.htm",
    ),
  ],
);

const fortMyers = pack(
  "tampa-to-fort-myers",
  "tampa to fort myers",
  [
    "Keep FDOT city-pair miles separate from airport (RSW) and Fort Myers Beach destinations.",
    "Do not average 124 and 125 into 124.5.",
    "Alligator Alley tolls are east–west after Naples — not on the Tampa↔Fort Myers I-75 segment.",
  ],
  [
    f(
      "FDOT intercity spreadsheet currency",
      "Florida Official Intercity Highway Mileage spreadsheet last updated 9/14/2026. Live Excel download Cloudflare-blocked 2026-11-02; city-pair miles below from Ben note transcription — re-open viewer before publish.",
      "FDOT — Florida Official Intercity Highway Mileage",
      "https://www.fdot.gov/statistics/hwydata/intercity.shtm",
    ),
    f(
      "FDOT Tampa–Fort Myers city-pair",
      "Tampa to Fort Myers 124 miles; Fort Myers to Tampa 125 miles (directional one-mile difference). Do not average.",
      "Ben note transcription of FDOT Official Intercity Highway Mileage",
      "https://www.fdot.gov/statistics/hwydata/intercity.shtm",
    ),
    f(
      "Other destination miles (not the city pair)",
      "Ben note separately recorded ~126 miles Tampa–Fort Myers (non-FDOT directions count); Tampa to RSW ~138 miles; Tampa to Fort Myers Beach ~149 miles. Keep separate from FDOT 124/125.",
      "Ben note (labeled comparison, not FDOT matrix)",
      "https://www.fdot.gov/statistics/hwydata/intercity.shtm",
    ),
    f(
      "OSRM routed drive (downtown coords)",
      "OSRM driving Tampa downtown → Fort Myers downtown ≈ 125.6 miles / ~2.4 hours duration model (2026-11-02). Aligns with FDOT ~124–125 city-pair band; still label drive-time as estimate.",
      "OSRM public router",
      "https://router.project-osrm.org/",
    ),
    f(
      "Related FDOT pairs (context only)",
      "Examples from Ben note of FDOT table: Tampa–Sarasota 52 both ways; Sarasota–Fort Myers 74 both ways; Tampa–Venice 71; Venice–Fort Myers 53; Tampa–Bradenton 41 / reverse 40; Bradenton–Fort Myers 86; Tampa–Naples 164 / reverse 162; Fort Myers–Naples 37; Punta Gorda–Tampa 103; Punta Gorda–Fort Myers 24. Do not stack pairs to invent a Tampa–Fort Myers total.",
      "Ben note transcription of FDOT matrix",
      "https://www.fdot.gov/statistics/hwydata/intercity.shtm",
    ),
    f(
      "I-75 Florida length / character near Fort Myers",
      "I-75 in Florida ~470.741 miles Miami Lakes to Georgia line. After Alligator Alley, interstate turns north near County Road 951 / exit 101 east of Naples and is toll-free for the rest of its Florida length; corridor passes Bonita Springs, Fort Myers, Punta Gorda, Port Charlotte, Venice, Sarasota, Bradenton toward Tampa Bay.",
      "Ben note citing FDOT / Turnpike corridor description",
      "https://www.fdot.gov/statistics/hwydata/intercity.shtm",
    ),
    f(
      "Alligator Alley is a different trip segment",
      "Alligator Alley is the tolled east–west Everglades stretch (Sunrise exit 19 ↔ Naples-area exit 101). It is not part of the north–south Tampa↔Fort Myers drive. Ben note cites historical two-axle toll $3.75 as of July 1, 2023 — confirm current Turnpike card before quoting a live toll for Alley trips.",
      "Florida’s Turnpike / Ben note",
      "https://floridasturnpike.com/tolls/toll-rates/",
    ),
    f(
      "FDOT Tampa–Miami pair (contrast only)",
      "FDOT Tampa→Miami 250 / Miami→Tampa 248 — longer south Florida pair; do not use as Fort Myers distance.",
      "Ben note transcription of FDOT matrix",
      "https://www.fdot.gov/statistics/hwydata/intercity.shtm",
    ),
    f(
      "Drive-time estimate label",
      "Estimate only: OSRM ~2.4 hours downtown-to-downtown; real trips vary with traffic, construction, and whether the destination is city / RSW / beach. Do not publish 124÷70 as “the” drive time.",
      "OSRM + labeled estimate practice",
      "https://router.project-osrm.org/",
    ),
    f(
      "I-75 vs I-275 fork near Tampa Bay",
      "I-275 splits near Ellenton (I-75 exit 228 area) toward St. Petersburg via Sunshine Skyway / Howard Frankland; I-75 stays east through Brandon / Temple Terrace / New Tampa. Downtown Tampa connections off the I-75 bypass include Selmon (SR 618, exit 256) and I-4 (exit 261).",
      "Ben note citing FDOT corridor / interchange context",
      "https://www.fdot.gov/statistics/hwydata/intercity.shtm",
    ),
    f(
      "Sunshine Skyway toll (wrong fork)",
      "Skyway is a ~4.1-mile tolled bridge on the I-275 Pinellas path — not on I-75 Tampa↔Fort Myers. Turnpike West Central Florida card effective April 12, 2026: North Plaza southbound / South Plaza northbound — $1.16 SunPass / $1.62 Toll-by-Plate (2 axle).",
      "Florida’s Turnpike West Central Florida schedule (via Ben note)",
      "https://floridasturnpike.com/tolls/toll-rates/",
    ),
    f(
      "Tampa International relative location",
      "TPA states the airport is just five miles west of downtown at 4100 George J. Bean Parkway. From the south (Fort Myers side), TPA directions use I-75 North to I-4 west, then I-275 south to exit 39.",
      "Tampa International Airport directions (via Ben note)",
      "https://www.tampaairport.com/",
    ),
    f(
      "RSW location relative to Fort Myers / I-75",
      "Southwest Florida International: 11000 Terminal Access Road, Fort Myers, FL 33913; southeast of Fort Myers city, roughly three miles east of I-75; use exit 128 then Treeline Avenue.",
      "RSW / Ben note",
      "https://www.flylcpa.com/",
    ),
    f(
      "Fort Myers Beach approach (chamber sequence)",
      "From I-75: exit 131 Daniels Parkway west → Tamiami Trail / Cleveland Ave / US 41 → Gladiolus → Summerlin → San Carlos Boulevard to the beach. Separate ~149-mile Tampa–beach figure is not FDOT’s city pair.",
      "Fort Myers Beach chamber directions via Ben note",
      "https://www.fdot.gov/statistics/hwydata/intercity.shtm",
    ),
    f(
      "US 41 parallel",
      "South of Tampa, Tamiami Trail / US 41 is the town-through parallel; I-75 is the eastern bypass. No separate FDOT Tampa–Fort Myers mileage for US 41 only in the note — do not invent one.",
      "Ben note",
      "https://www.fdot.gov/statistics/hwydata/intercity.shtm",
    ),
    f(
      "Cape Coral / beach not in FDOT city list",
      "Cape Coral and Fort Myers Beach are not among the FDOT measured city pairs; do not invent a Cape Coral mile from the Fort Myers figure.",
      "Ben note citing FDOT city-pair list limits",
      "https://www.fdot.gov/statistics/hwydata/intercity.shtm",
    ),
    f(
      "Clearwater–Fort Myers FDOT contrast",
      "Clearwater to Fort Myers 128 / Fort Myers to Clearwater 129 — nearby gulf pair, not Tampa’s 124/125.",
      "Ben note transcription of FDOT matrix",
      "https://www.fdot.gov/statistics/hwydata/intercity.shtm",
    ),
    f(
      "I-275 length note",
      "I-275 ~60.237 miles beginning at I-75 exit 228 near Palmetto — relevant only if the traveler wrongly forks toward Pinellas instead of staying on I-75 south/north for Fort Myers.",
      "Ben note citing FDOT mileage",
      "https://www.fdot.gov/statistics/hwydata/intercity.shtm",
    ),
    f(
      "Practical routing summary",
      "City-to-city: quote FDOT 124 south / 125 north and stay on I-75. Airport pin: exit 128 (not the 124). Beach pin: exit 131 + chamber surface sequence; quote 149 only as the separate beach count. Do not continue to exit 101 / Alligator Alley unless Miami is the destination.",
      "Synthesis of FDOT + RSW + chamber facts above",
      "https://www.fdot.gov/statistics/hwydata/intercity.shtm",
    ),
  ],
);

async function main(): Promise<void> {
  for (const p of [population, zip, fortMyers]) {
    saveFactPack(p);
    console.log(`Wrote ${p.slug}: ${p.facts.length} facts`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
