/**
 * Fact packs: tampa-rv-show-2026 + tampa-stadium-guide
 * npx tsx scripts/article-gen/write-batch-b-packs-2.ts
 */
import { saveFactPack, type FactEntry, type FactPack } from "./fact-pack";

const CHECKED = "2026-11-02";
function f(claim: string, value: string, sourceName: string, sourceUrl: string): FactEntry {
  return { claim, value, sourceName, sourceUrl, checkedAt: CHECKED };
}
function pack(slug: string, keyword: string, notes: string[], facts: FactEntry[]): FactPack {
  return { slug, keyword, checkedAt: CHECKED, notes, facts, allowedTokens: [] };
}

const rv = pack(
  "tampa-rv-show-2026",
  "tampa rv show 2026",
  [
    "Two 2026 Tampa fairgrounds RV shows — SuperShow (Jan, already past as of note date) vs Fall (Nov 5–8, still ahead as of 2026-11-02).",
    "Do not mix $15 SuperShow admission with $5 Fall admission.",
    "FRVTA SuperShow hub page now leads with 2027; use fairgrounds/FRVTA planning sources + Ben note for 2026 SuperShow dates.",
  ],
  [
    f(
      "Two shows, same fairgrounds",
      "Both the Florida RV SuperShow (January) and the Tampa Bay Fall RV Show (November) use Florida State Fairgrounds, 4800 US Highway 301 North, Tampa, FL 33610. They are different weekends and different prices.",
      "FRVTA Fall show page + Florida State Fairgrounds event pages",
      "https://www.frvta.org/show/tampa-bay-fall-rv-show/",
    ),
    f(
      "2026 Florida RV SuperShow dates (past)",
      "2026 Florida RV SuperShow: January 14–18, 2026. Public hours per fairgrounds/Ben note: Wed–Sat 9:00 a.m.–6:00 p.m.; Sun 9:00 a.m.–4:00 p.m. As of November 2026 this show has already happened.",
      "Ben note + FRVTA planning page citing Jan 14–18, 2026",
      "https://www.frvta.org/planning-your-visit-to-the-florida-rv-supershow/",
    ),
    f(
      "2026 SuperShow admission / parking (fairgrounds)",
      "Adults $15 per person (2-day pass); children under 16 free. Parking $10 online / $12 onsite. Senior Citizen’s Day Wed–Fri $2 off; First Responders & Military $2 off every day.",
      "Florida State Fairgrounds / Ben note for 2026 RV SuperShow",
      "https://floridastatefairgrounds.com/",
    ),
    f(
      "2026 SuperShow character (organizer pitch)",
      "Manufacturer-supported consumer show with hundreds of RVs and accessory exhibitors, seminars, campground booths, General RV Store, free entertainment — per FRVTA/fairgrounds descriptions. Do not invent attendance for 2026; FRVTA later listed 2026 attendance 70,635 on the 2027 SuperShow page.",
      "FRVTA SuperShow materials + 2027 page attendance note",
      "https://www.frvta.org/show/florida-rv-supershow/",
    ),
    f(
      "Tampa Bay Fall RV Show 2026 dates",
      "November 5–8, 2026 at Florida State Fairgrounds, 4800 US Highway 301 North, Tampa, FL 33610",
      "FRVTA — Tampa Bay Fall RV Show",
      "https://www.frvta.org/show/tampa-bay-fall-rv-show/",
    ),
    f(
      "Fall RV Show hours",
      "9:00 a.m.–5:00 p.m. Thursday–Saturday; 9:00 a.m.–4:00 p.m. Sunday",
      "FRVTA — Tampa Bay Fall RV Show",
      "https://www.frvta.org/show/tampa-bay-fall-rv-show/",
    ),
    f(
      "Fall RV Show admission",
      "Adults $5.00; children 16 and under free. Online $1 off before the show. At gate: seniors $1 off Thursday only; Military / 1st Responders $1 off all days. Discounts not valid with other discounts.",
      "FRVTA — Tampa Bay Fall RV Show",
      "https://www.frvta.org/show/tampa-bay-fall-rv-show/",
    ),
    f(
      "Fall RV Show parking",
      "Cars: $12 onsite / $10 online presale. RVs: $20 onsite / $18 online. Parking handled by Florida State Fairgrounds; contact 813-621-7821 or info@FloridaStateFair.com",
      "FRVTA — Tampa Bay Fall RV Show",
      "https://www.frvta.org/show/tampa-bay-fall-rv-show/",
    ),
    f(
      "Fall participating dealers (published)",
      "Blue Compass RV; General RV Center; Lazydays powered by Campers Inn; North Trail RV",
      "FRVTA — Tampa Bay Fall RV Show",
      "https://www.frvta.org/show/tampa-bay-fall-rv-show/",
    ),
    f(
      "Fall 2025 attendance (prior year only)",
      "2025 attendance 5,403 — prior-year figure only; not a 2026 forecast",
      "FRVTA — Tampa Bay Fall RV Show",
      "https://www.frvta.org/show/tampa-bay-fall-rv-show/",
    ),
    f(
      "Pets at Fall show",
      "Welcome if kept on a leash or in a carrier; clean up after them",
      "FRVTA — Tampa Bay Fall RV Show",
      "https://www.frvta.org/show/tampa-bay-fall-rv-show/",
    ),
    f(
      "FRVTA office (not the gate)",
      "Florida RV Trade Association office: 5407 Boran Place, Tampa, FL 33610; phone (813) 741-0488; info@frvta.org",
      "FRVTA site footer",
      "https://www.frvta.org/show/tampa-bay-fall-rv-show/",
    ),
    f(
      "Fairgrounds other venue names (navigation trap)",
      "Same property includes MidFlorida Amphitheater, Bob Thomas Equestrian Center, TECO Arena gate, Cracker Country, Expo/Entertainment Halls, Florida Center, Special Events Center — wrong gate ≠ wrong show weekend but can still strand a visitor.",
      "Ben note citing fairgrounds entrance names",
      "https://floridastatefairgrounds.com/",
    ),
    f(
      "2027 SuperShow already listed",
      "FRVTA SuperShow page (checked 2026-11-02) lists 2027 Florida RV SuperShow Jan 12 industry day; public Jan 13–17, 2027; adults $15 (2-day); children under 16 free; parking $12 car onsite / $10 online coming soon; $20 RV",
      "FRVTA — Florida RV SuperShow",
      "https://www.frvta.org/show/florida-rv-supershow/",
    ),
    f(
      "Phrase disambiguation",
      "Searches for tampa rv show 2026 / rv show tampa can mean either January SuperShow or November Fall show. $15 + 2-day pass ≈ SuperShow; $5 ≈ Fall.",
      "Synthesis of FRVTA pages above",
      "https://www.frvta.org/shows/",
    ),
    f(
      "Where to enter SuperShow (fairgrounds)",
      "Fairgrounds SuperShow listing: enter via MLK Jr Blvd or US Hwy 301",
      "Ben note / fairgrounds 2026 SuperShow listing",
      "https://floridastatefairgrounds.com/",
    ),
    f(
      "Open/closed status — Fall show",
      "Fall show is upcoming as of 2026-11-02 (starts Nov 5). Official FRVTA page actively lists dates, hours, dealers, admission — confirmed scheduled/open for ticketing.",
      "FRVTA — Tampa Bay Fall RV Show",
      "https://www.frvta.org/show/tampa-bay-fall-rv-show/",
    ),
    f(
      "Open/closed status — 2026 SuperShow",
      "2026 SuperShow already concluded (Jan 14–18, 2026). Article must not sell it as still open.",
      "FRVTA planning page + calendar",
      "https://www.frvta.org/planning-your-visit-to-the-florida-rv-supershow/",
    ),
    f(
      "Checked date / today context",
      "Fact pack checked November 2, 2026 — three days before Fall show opening",
      "Pack metadata",
      "https://www.frvta.org/show/tampa-bay-fall-rv-show/",
    ),
    f(
      "Do not invent dealer roster beyond published Fall list",
      "Only quote Blue Compass, General RV, Lazydays powered by Campers Inn, North Trail unless FRVTA updates the page",
      "FRVTA — Tampa Bay Fall RV Show",
      "https://www.frvta.org/show/tampa-bay-fall-rv-show/",
    ),
  ],
);

const stadium = pack(
  "tampa-stadium-guide",
  "tampa stadium",
  [
    "Raymond James Stadium ≠ Benchmark International Arena ≠ Tropicana Field (St. Pete).",
    "No invented parking dollar amounts — event-variable.",
    "Venue open status: major active sports venues with official sites — confirmed operating.",
  ],
  [
    f(
      "Raymond James Stadium address",
      "4201 N. Dale Mabry Hwy, Tampa, FL 33607",
      "Raymond James Stadium / Ben notes",
      "https://www.raymondjamesstadium.com/",
    ),
    f(
      "Primary tenants / uses (USF athletics)",
      "Home of NFL Tampa Bay Buccaneers and USF Bulls football since 1998; also ReliaQuest Bowl, Gasparilla Bowl, concerts; USF cites ~65,000 seats",
      "USF Athletics Raymond James Stadium page (via Ben note)",
      "https://gousfbulls.com/",
    ),
    f(
      "Stadium debut / naming rights",
      "Opened September 20, 1998; named for Raymond James Financial (St. Petersburg HQ); naming rights through 2027 season per USF account",
      "USF Athletics / stadium A-to-Z via Ben notes",
      "https://www.raymondjamesstadium.com/",
    ),
    f(
      "Super Bowls hosted (USF list)",
      "XXXV (2001), XLIII (2009), LV (2021); also 2017 CFP National Championship (Clemson over Alabama) per USF",
      "USF Athletics Raymond James Stadium notes",
      "https://gousfbulls.com/",
    ),
    f(
      "Pirate ship landmark",
      "~103-foot replica pirate ship in north end zone (USF description); stadium guide: built 1998, Buccaneers-owned, closed to public during events, cannons at Bucs games",
      "USF + stadium A-to-Z via Ben notes",
      "https://www.raymondjamesstadium.com/",
    ),
    f(
      "Parking payment / pricing rule",
      "All lots cashless/contactless, major credit cards; price varies by event; advance parking separate; lot open times event-by-event — do not invent a dollar figure",
      "Raymond James Stadium directions / FAQ via Ben note",
      "https://www.raymondjamesstadium.com/",
    ),
    f(
      "Approx parking capacity (A-to-Z)",
      "Approximately 10,000 on-site spots and approximately 15,000 off-site (stadium A-to-Z)",
      "Stadium A-to-Z via Ben note",
      "https://www.raymondjamesstadium.com/",
    ),
    f(
      "RV / camper lots",
      "Buccaneers games: RVs/buses/campers in Publix Lot 14 off MLK Blvd. Most other events: Lot 8 off Himes Ave. No overnight stays on stadium property.",
      "Stadium getting-here / A-to-Z via Ben note",
      "https://www.raymondjamesstadium.com/",
    ),
    f(
      "Rideshare staging",
      "Uber/Lyft often staged at George M. Steinbrenner Field; some events use mass-transit turnaround; concerts may change — follow event-specific instructions",
      "Stadium directions / A-to-Z via Ben note",
      "https://www.raymondjamesstadium.com/",
    ),
    f(
      "Mobile tickets / bag policy",
      "Mobile tickets only (Apple Wallet / Google Wallet preferred; no screenshots). No-bag policy: clutch ≤ 4.5 × 6.5 inches; lockers on Tom McEwen Blvd south of Suzuki Marine gate (fee not named in guide)",
      "Stadium A-to-Z via Ben note",
      "https://www.raymondjamesstadium.com/",
    ),
    f(
      "Kid ticket rules vary by event",
      "Bucs / Gasparilla Bowl: every age needs a ticket. USF / ReliaQuest Bowl: 3 and under free if not taking a seat. Monster Jam / Supercross / some concerts: 2 and under free if not taking a seat. Always use the event’s rule.",
      "Stadium event details / A-to-Z via Ben note",
      "https://www.raymondjamesstadium.com/",
    ),
    f(
      "Stadium office phones",
      "Normal hours 813-350-6500; event days 813-350-6501; Buccaneers tickets 813-879-2827; USF ticket ops 813-974-3002 / 1-800-GO-BULLS; guest services text 813-680-2827; tours 813-350-6553",
      "Stadium A-to-Z via Ben note",
      "https://www.raymondjamesstadium.com/",
    ),
    f(
      "Ticket office location (conflicting official wording)",
      "A-to-Z: South Plaza between Suzuki Marine and Fifth Third Bank gates. Some event pages: between Gates C and D. Note the conflict; do not invent a single door.",
      "Stadium A-to-Z + event pages via Ben note",
      "https://www.raymondjamesstadium.com/",
    ),
    f(
      "Benchmark International Arena (not a stadium)",
      "401 Channelside Drive, Tampa, FL 33602; phone 813-301-6500; home of Tampa Bay Lightning; formerly Amalie Arena (naming rights announced Aug 13, 2025 per Ben note)",
      "Benchmark International Arena official site",
      "https://www.benchmarkintlarena.com/",
    ),
    f(
      "Arena features (official)",
      "Tesla coils; ~11,000 sq ft Mich Ultra Sky Deck; five-manual 105-rank digital pipe organ; three-time Stanley Cup champion Lightning home",
      "Benchmark International Arena — Arena Info",
      "https://www.benchmarkintlarena.com/arena-info/",
    ),
    f(
      "Tropicana Field is not in Tampa",
      "Rays ballpark: 1 Tropicana Dr, St. Petersburg, FL 33705; mobile tickets via MLB Ballpark app — wrong city for “tampa stadium” football/arena searches",
      "Ben note citing club address",
      "https://www.mlb.com/rays",
    ),
    f(
      "Tampa Sports Authority landlord note",
      "Stadium A-to-Z: Authority also landlord for Benchmark International Arena and Steinbrenner Field — three different sites",
      "Stadium A-to-Z via Ben note",
      "https://www.raymondjamesstadium.com/",
    ),
    f(
      "Wi-Fi network name",
      "bucswifi (stadium guide)",
      "Stadium A-to-Z via Ben note",
      "https://www.raymondjamesstadium.com/",
    ),
    f(
      "Open status — Ray Jay",
      "Official raymondjamesstadium.com live; active NFL/USF home — confirmed operating",
      "https://www.raymondjamesstadium.com/",
      "https://www.raymondjamesstadium.com/",
    ),
    f(
      "Open status — Benchmark Arena",
      "Official benchmarkintlarena.com live with Lightning schedule listings — confirmed operating",
      "https://www.benchmarkintlarena.com/",
      "https://www.benchmarkintlarena.com/",
    ),
    f(
      "Alcohol / decide-to-ride (high level)",
      "Two alcoholic drinks per person per purchase; none brought in/out; 21+ ID. Sales stop timing differs by stand/quarter in guide. Decide-to-ride designated-driver program at alcohol events (21+, license) for soft-drink coupon / possible rideshare discount — details at guest services",
      "Stadium A-to-Z via Ben note",
      "https://www.raymondjamesstadium.com/",
    ),
    f(
      "Club / suite high-level figures (guide)",
      "Hyundai West Club ~60,000 sq ft; East Club ~64,000 sq ft with Bar 76; 134 suites seating 8–36; renovation begun 2016 expected to exceed $180 million (guide claims — label as stadium guide figures)",
      "Stadium A-to-Z via Ben note",
      "https://www.raymondjamesstadium.com/",
    ),
  ],
);

async function main(): Promise<void> {
  for (const p of [rv, stadium]) {
    saveFactPack(p);
    console.log(`Wrote ${p.slug}: ${p.facts.length} facts`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
