/**
 * Batch 3 fact packs (20 new URLs). checkedAt 2026-11-04.
 * npx tsx scripts/article-gen/write-batch-3-packs.ts
 */
import { saveFactPack, type FactEntry, type FactPack } from "./fact-pack";

const CHECKED = "2026-11-04";
function f(c: string, v: string, n: string, u: string): FactEntry {
  return { claim: c, value: v, sourceName: n, sourceUrl: u, checkedAt: CHECKED };
}
function pack(slug: string, keyword: string, notes: string[], facts: FactEntry[]): FactPack {
  return { slug, keyword, checkedAt: CHECKED, notes, facts, allowedTokens: [] };
}

const packs: FactPack[] = [
  pack(
    "tampa-beaches",
    "tampa beaches",
    [
      "City bay beaches ≠ Gulf beaches. Prefer Outdoors hub.",
      "Do not invent water quality grades; point to Healthy Beaches.",
    ],
    [
      f("City beaches count", "City of Tampa manages four beaches along Tampa Bay shores", "City of Tampa Beaches", "https://www.tampa.gov/parks-and-recreation/parks-and-facilities/beaches"),
      f("Hours", "Hours of operation sunrise to sunset", "City of Tampa Beaches", "https://www.tampa.gov/parks-and-recreation/parks-and-facilities/beaches"),
      f("Ben T Davis address", "Ben T. Davis Beach, 7740 W Courtney Campbell Causeway, 33607", "City of Tampa Beaches", "https://www.tampa.gov/parks-and-recreation/parks-and-facilities/beaches"),
      f("Ben T Davis parking", "Metered parking $2.50/hour", "City of Tampa Beaches", "https://www.tampa.gov/parks-and-recreation/parks-and-facilities/beaches"),
      f("Cypress Point address", "Cypress Point Park, 5620 W Cypress St, 33607", "City of Tampa Beaches", "https://www.tampa.gov/parks-and-recreation/parks-and-facilities/beaches"),
      f("Cypress Point parking", "Free parking Monday–Friday until noon; metered other times $1 first hour, $2 every hour afterward", "City of Tampa Beaches", "https://www.tampa.gov/parks-and-recreation/parks-and-facilities/beaches"),
      f("Davis Islands", "Davis Islands Seaplane Basin, 864 Severn Ave, 33606", "City of Tampa Beaches", "https://www.tampa.gov/parks-and-recreation/parks-and-facilities/beaches"),
      f("Picnic Island address", "Picnic Island Park, 7409 Picnic Island Blvd, 33616", "City of Tampa Picnic Island", "https://www.tampa.gov/parks-and-recreation/featured-parks/picnic-island-park"),
      f("Picnic Island hours", "Park hours sunrise to sunset; boat ramp open 24 hours", "City of Tampa Picnic Island", "https://www.tampa.gov/parks-and-recreation/featured-parks/picnic-island-park"),
      f("Picnic Island phone parks", "Park Administration (813) 274-8615", "City of Tampa Picnic Island", "https://www.tampa.gov/parks-and-recreation/featured-parks/picnic-island-park"),
      f("Healthy Beaches", "City points visitors to Florida DOH Healthy Beaches program for water test results before swimming", "City of Tampa Beaches", "https://www.tampa.gov/parks-and-recreation/parks-and-facilities/beaches"),
      f("Not Gulf", "These are Tampa Bay beaches, not Gulf barrier-island beaches in Pinellas", "Editorial / geography", "https://www.tampa.gov/parks-and-recreation/parks-and-facilities/beaches"),
      f("Bayshore not beach", "Bayshore Boulevard waterfront walk is not one of the four named city beaches", "Ben note + City beaches list", "https://www.tampa.gov/parks-and-recreation/parks-and-facilities/beaches"),
      f("Open status", "City beach pages live and listing facilities as managed parks — open sunrise–sunset as of Nov 4, 2026", "City of Tampa", "https://www.tampa.gov/parks-and-recreation/parks-and-facilities/beaches"),
      f("Checked", "November 4, 2026", "Pack metadata", "https://visitintampa.com/outdoors-beaches/tampa-beaches"),
      f("Link Clearwater", "Cross-link Tampa to Clearwater for Gulf beach day trips", "Internal", "https://visitintampa.com/guides/tampa-to-clearwater"),
      f("Link Riverwalk", "Cross-link Tampa Riverwalk for downtown water path (not a swimming beach)", "Internal", "https://visitintampa.com/outdoors-beaches/tampa-riverwalk"),
      f("Link map", "Cross-link Tampa map", "Internal", "https://visitintampa.com/getting-around/tampa-map"),
      f("Link overview", "Cross-link Tampa Florida overview", "Internal", "https://visitintampa.com/guides/tampa-florida-overview"),
      f("Cypress Point park page", "Cypress Point Park hours sunrise to sunset; phone (813) 274-8615", "City of Tampa Cypress Point", "https://www.tampa.gov/parks-and-recreation/featured-parks/cypress-point-park"),
      f("Word floor", "Minimum 1,200 words", "Editorial", "https://visitintampa.com/outdoors-beaches/tampa-beaches"),
      f("No Tampa Beach name", "City does not use a place name 'Tampa Beach' as a single branded strand", "City of Tampa Beaches", "https://www.tampa.gov/parks-and-recreation/parks-and-facilities/beaches"),
      f("Courtney Campbell context", "Ben T. Davis sits on the Courtney Campbell Causeway corridor toward Clearwater", "City + Ben note", "https://www.tampa.gov/parks-and-recreation/parks-and-facilities/beaches"),
      f("SUP yoga note", "City lists contracted SUP/beach yoga Sundays 9–10am at Cypress Point — confirm current schedule on city page", "City of Tampa Beaches", "https://www.tampa.gov/parks-and-recreation/parks-and-facilities/beaches"),
      f("Shelter reservations phone", "Shelter reservations (813) 274-8184 on Picnic Island / Cypress Point pages", "City of Tampa parks", "https://www.tampa.gov/parks-and-recreation/featured-parks/picnic-island-park"),
      f("Picnic Island dog beach", "Picnic Island has a separate gated dog beach near the boat ramp and pier (city page)", "City of Tampa Picnic Island", "https://www.tampa.gov/parks-and-recreation/featured-parks/picnic-island-park"),
      f("Picnic Island amenities", "Sand volleyball, disc golf, playground, fishing pier, boat ramp noted on city page", "City of Tampa Picnic Island", "https://www.tampa.gov/parks-and-recreation/featured-parks/picnic-island-park"),
      f("Trailer spaces", "Picnic Island boat ramp area: 13 vehicle-with-trailer spaces and 30 vehicle-only spaces (city page)", "City of Tampa Picnic Island", "https://www.tampa.gov/parks-and-recreation/featured-parks/picnic-island-park"),
    ],
  ),
  pack(
    "tampa-riverwalk",
    "tampa riverwalk",
    ["Path guide distinct from riverwalk hotels. Outdoors hub."],
    [
      f("Length", "Tampa Riverwalk extends 2.6 miles", "Friends of the Riverwalk FAQ", "https://thetampariverwalk.com/who-we-are/frequent-questions.html"),
      f("Endpoints FAQ", "FAQ: multi-use path from Armature Works to Sparkman Wharf connecting museums, shops, restaurants, parks", "Friends of the Riverwalk FAQ", "https://thetampariverwalk.com/who-we-are/frequent-questions.html"),
      f("Hours", "Open 24 hours a day", "Friends of the Riverwalk FAQ", "https://thetampariverwalk.com/who-we-are/frequent-questions.html"),
      f("Free", "Riverwalk is free to use (FAQ)", "Friends of the Riverwalk FAQ", "https://thetampariverwalk.com/who-we-are/frequent-questions.html"),
      f("Start note FAQ", "FAQ also says walk begins at Beneficial Drive and Channelside Drive and extends just past Armature Works — quote both endpoint phrasings carefully", "Friends of the Riverwalk FAQ", "https://thetampariverwalk.com/who-we-are/frequent-questions.html"),
      f("Home length", "Friends home page: stretches 2.6 miles along the Hillsborough River through downtown", "Friends of the Riverwalk", "https://thetampariverwalk.com/"),
      f("Nonprofit", "Friends of the Tampa Riverwalk is a local nonprofit working with the city", "Friends of the Riverwalk", "https://thetampariverwalk.com/"),
      f("City TCC blog", "City of Tampa Convention Center blog also cites 2.6-mile walking/biking path", "City of Tampa TCC blog", "https://www.tampa.gov/tcc/blog/riverwalk-tour"),
      f("Open status", "Public multi-use path; FAQ lists 24-hour operation as of Nov 4, 2026", "Friends of the Riverwalk FAQ", "https://thetampariverwalk.com/who-we-are/frequent-questions.html"),
      f("Checked", "November 4, 2026", "Pack metadata", "https://visitintampa.com/outdoors-beaches/tampa-riverwalk"),
      f("Link hotels", "Cross-link Riverwalk hotels guide", "Internal", "https://visitintampa.com/guides/tampa-riverwalk-hotels"),
      f("Link Ulele", "Cross-link Ulele on the river", "Internal", "https://visitintampa.com/food-and-drink/ulele-tampa"),
      f("Link Armature", "Cross-link Armature Works", "Internal", "https://visitintampa.com/food-and-drink/armature-works-tampa"),
      f("Link Aquarium", "Cross-link Florida Aquarium", "Internal", "https://visitintampa.com/things-to-do/florida-aquarium-tampa"),
      f("Link TCC", "Cross-link Convention Center", "Internal", "https://visitintampa.com/guides/tampa-convention-center"),
      f("Word floor", "Minimum 1,200 words", "Editorial", "https://visitintampa.com/outdoors-beaches/tampa-riverwalk"),
      f("Not a beach", "Riverwalk is a downtown path, not a swimming beach", "Clarification", "https://thetampariverwalk.com/"),
      f("Art leisure hub", "FAQ: hub for art, leisure, performances, fitness", "Friends of the Riverwalk FAQ", "https://thetampariverwalk.com/who-we-are/frequent-questions.html"),
      f("Route PDF note", "Friends walking-route PDF describes an approx 2.4-mile walk ~90 minutes — treat as a route sample, not a replacement for the 2.6-mile corridor figure", "Friends Riverwalk PDF", "https://thetampariverwalk.com/"),
      f("Hillsborough River", "Path follows the Hillsborough River waterfront downtown", "Friends of the Riverwalk", "https://thetampariverwalk.com/"),
      f("Sparkman Wharf end", "Sparkman Wharf end of corridor per FAQ", "Friends of the Riverwalk FAQ", "https://thetampariverwalk.com/who-we-are/frequent-questions.html"),
      f("Armature Works end", "Armature Works end of corridor per FAQ", "Friends of the Riverwalk FAQ", "https://thetampariverwalk.com/who-we-are/frequent-questions.html"),
      f("Multi-use", "Multi-use path (walk/bike) per city TCC description", "City of Tampa TCC blog", "https://www.tampa.gov/tcc/blog/riverwalk-tour"),
      f("Start anywhere", "FAQ: you can start wherever you like along the path", "Friends of the Riverwalk FAQ", "https://thetampariverwalk.com/who-we-are/frequent-questions.html"),
      f("Official site", "https://thetampariverwalk.com/", "Friends of the Riverwalk", "https://thetampariverwalk.com/"),
      f("No fee myth", "Do not invent a ticket price; path is free", "Friends FAQ", "https://thetampariverwalk.com/who-we-are/frequent-questions.html"),
      f("Museum cluster", "Connects museums along the waterfront (FAQ) — name specific museums only if in note", "Friends FAQ", "https://thetampariverwalk.com/who-we-are/frequent-questions.html"),
      f("Last updated cue", "Include Last updated when citing hours/length", "Editorial", "https://visitintampa.com/outdoors-beaches/tampa-riverwalk"),
    ],
  ),
  pack(
    "tampa-bay-downs",
    "tampa bay downs",
    [
      "VISIT + racing season only. No betting how-to, no poker how-to, no handicapping.",
      "Correct name is Tampa Bay Downs (not Tampa Downs).",
    ],
    [
      f("Official name", "Tampa Bay Downs — live thoroughbred racing, poker, and golf (track self-description)", "Tampa Bay Downs", "https://www.tampabaydowns.com/"),
      f("Address", "11225 Race Track Road, Tampa, Florida 33626", "Tampa Bay Downs Admission", "https://www.tampabaydowns.com/visitor-info/admission-info/"),
      f("Phone", "(813) 855-4401", "Tampa Bay Downs Admission", "https://www.tampabaydowns.com/visitor-info/admission-info/"),
      f("Mailing", "Mailing address PO Box 2007, Oldsmar, Florida 34677", "Tampa Bay Downs Admission", "https://www.tampabaydowns.com/visitor-info/admission-info/"),
      f("Season 2026-27", "Live racing returns November 18, 2026 – May 2, 2027", "Tampa Bay Downs Admission", "https://www.tampabaydowns.com/visitor-info/admission-info/"),
      f("Gates", "Gates open at 11:00 am on race days", "Tampa Bay Downs Admission", "https://www.tampabaydowns.com/visitor-info/admission-info/"),
      f("Post time", "Post time approximately 12:15 pm on race days", "Tampa Bay Downs Admission", "https://www.tampabaydowns.com/visitor-info/admission-info/"),
      f("GA price", "General admission $3; FREE on Wednesdays", "Tampa Bay Downs Admission", "https://www.tampabaydowns.com/visitor-info/admission-info/"),
      f("Gate tickets", "Walk up and buy tickets at the gate on any race day; special events may offer advance tickets", "Tampa Bay Downs Admission", "https://www.tampabaydowns.com/visitor-info/admission-info/"),
      f("Calendar days", "2026–27 racing calendar: approximately 90 live racing days", "Tampa Bay Downs 2026-27 Calendar PDF", "https://www.tampabaydowns.com/prdownloads/race-cal-archives/2026-2027-season/TBD-Racing-Calendar-2026-27.pdf"),
      f("Opening day", "Opening Day November 18, 2026", "Tampa Bay Downs 2026-27 Calendar PDF", "https://www.tampabaydowns.com/prdownloads/race-cal-archives/2026-2027-season/TBD-Racing-Calendar-2026-27.pdf"),
      f("Closing day", "Fan Appreciation Day / season end May 2, 2027", "Tampa Bay Downs 2026-27 Calendar PDF", "https://www.tampabaydowns.com/prdownloads/race-cal-archives/2026-2027-season/TBD-Racing-Calendar-2026-27.pdf"),
      f("Closed holidays", "Closed Thanksgiving 11-26-26, Christmas 12-25-26, Easter 3-28-27", "Tampa Bay Downs 2026-27 Calendar PDF", "https://www.tampabaydowns.com/prdownloads/race-cal-archives/2026-2027-season/TBD-Racing-Calendar-2026-27.pdf"),
      f("Special noon posts", "Special noon post times Saturday March 6, 2027 and Saturday May 1, 2027", "Tampa Bay Downs 2026-27 Calendar PDF", "https://www.tampabaydowns.com/prdownloads/race-cal-archives/2026-2027-season/TBD-Racing-Calendar-2026-27.pdf"),
      f("Anniversary", "101st anniversary season of thoroughbred racing (horsemen resources)", "Tampa Bay Downs Horsemen", "https://www.tampabaydowns.com/horsemen/horsemen-resources/"),
      f("Not downtown", "Street address is Tampa 33626 on NW side of bay area — not a downtown riverfront track", "Tampa Bay Downs + Ben note", "https://www.tampabaydowns.com/visitor-info/admission-info/"),
      f("Open status", "Track publishing 2026–27 live season and visitor admission pages — operating venue as of Nov 4, 2026", "Tampa Bay Downs", "https://www.tampabaydowns.com/"),
      f("Checked", "November 4, 2026", "Pack metadata", "https://visitintampa.com/events/tampa-bay-downs"),
      f("No betting how-to", "Do not explain how to wager, read a ticket, or play poker", "Editorial / AdSense", "https://visitintampa.com/events/tampa-bay-downs"),
      f("Simulcast offseason", "Site notes offseason simulcast, Silks Poker Room, Downs Golf Practice Facility exist — mention as amenities without how-to-play", "Tampa Bay Downs home", "https://www.tampabaydowns.com/"),
      f("Link events", "Cross-link Tampa events hub", "Internal", "https://visitintampa.com/events/tampa-events"),
      f("Link map", "Cross-link Tampa map", "Internal", "https://visitintampa.com/getting-around/tampa-map"),
      f("Link overview", "Cross-link Tampa Florida overview", "Internal", "https://visitintampa.com/guides/tampa-florida-overview"),
      f("Link TPA", "Cross-link Tampa International Airport for northwest approach context", "Internal", "https://visitintampa.com/getting-around/tampa-international-airport"),
      f("Word floor", "Minimum 1,200 words", "Editorial", "https://visitintampa.com/events/tampa-bay-downs"),
      f("Subject to change", "Racing calendar subject to change without notice", "Tampa Bay Downs Calendar PDF", "https://www.tampabaydowns.com/prdownloads/race-cal-archives/2026-2027-season/TBD-Racing-Calendar-2026-27.pdf"),
      f("Web accessibility phone", "If site access issues: 813-298-1717 or webaccess@tampabaydowns.com", "Tampa Bay Downs Admission", "https://www.tampabaydowns.com/visitor-info/admission-info/"),
      f("Directions page", "Track publishes directions/visitor info — send readers to official directions rather than inventing ETAs", "Tampa Bay Downs", "https://www.tampabaydowns.com/visitor-info/admission-info/"),
      f("Toll-free note", "Ben note lists Florida toll-free 866-823-6967 — only use if also confirmed on official page; otherwise omit", "Editorial", "https://www.tampabaydowns.com/"),
      f("Live vs simulcast", "Distinguish live racing days from simulcast-only days using official calendar legend", "Tampa Bay Downs Calendar", "https://www.tampabaydowns.com/racing-calendar/"),
    ],
  ),
];

async function main() {
  for (const p of packs) {
    saveFactPack(p);
    console.log(`saved ${p.slug} facts=${p.facts.length}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
