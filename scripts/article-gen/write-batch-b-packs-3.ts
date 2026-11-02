/**
 * Fact packs: trampoline-parks-tampa + tampa-riverwalk-hotels (open-confirmed only)
 */
import { saveFactPack, type FactEntry, type FactPack } from "./fact-pack";

const CHECKED = "2026-11-02";
function f(claim: string, value: string, sourceName: string, sourceUrl: string): FactEntry {
  return { claim, value, sourceName, sourceUrl, checkedAt: CHECKED };
}
function pack(slug: string, keyword: string, notes: string[], facts: FactEntry[]): FactPack {
  return { slug, keyword, checkedAt: CHECKED, notes, facts, allowedTokens: [] };
}

const tramp = pack(
  "trampoline-parks-tampa",
  "trampoline parks tampa",
  [
    "Only Altitude Tampa (Hillsborough Ave) confirmed open 2026-11-02. Do not present other parks as open Tampa options without confirmation.",
    "Get Air New Port Richey is not Tampa — near-miss only.",
    "Do not invent ticket prices; Ben notes hours that may be stale — prefer confirming calendar or omit exact clocks if unconfirmed.",
  ],
  [
    f(
      "Altitude Tampa open status",
      "Official Altitude location page live with booking/party CTAs as of 2026-11-02 — treated as currently open",
      "Altitude Trampoline Park — Tampa / Drew Park location",
      "https://www.altitudetrampolinepark.com/locations/florida/tampa/4340-west-hillsborough-ave/",
    ),
    f(
      "Altitude Tampa address",
      "4340 West Hillsborough Avenue, Tampa (Drew Park area)",
      "Altitude official Tampa location page",
      "https://www.altitudetrampolinepark.com/locations/florida/tampa/4340-west-hillsborough-ave/",
    ),
    f(
      "Altitude Tampa phones / email (Ben note)",
      "Primary call number (813) 399-1529; second number (813) 503-4428 unlabeled; email chesley@altitudetampa.com",
      "Ben trampoline notes citing Altitude",
      "https://www.altitudetrampolinepark.com/locations/florida/tampa/4340-west-hillsborough-ave/",
    ),
    f(
      "Hours caution",
      "Ben note recorded Sun 11 a.m.–9 p.m.; Mon–Thu 10 a.m.–10 p.m.; Fri 10 a.m.–11 p.m.; Sat 9:30 a.m.–11 p.m. Third-party lists differ (earlier closes). Article must say hours change and to confirm on the official hours/calendar before visiting — do not present stale clocks as guaranteed.",
      "Ben note + Altitude hours/calendar URL",
      "https://www.altitudetrampolinepark.com/locations/tampa/hours-calendar",
    ),
    f(
      "Open jump booking stack",
      "Altitude Tampa uses CenterEdge online open-jump booking; waivers required; safety socks required but not included; credit card + matching ID to redeem",
      "Altitude Tampa CenterEdge open-jump area",
      "https://altitudetampa.centeredgeonline.com/",
    ),
    f(
      "Offerings (brand-level, location page)",
      "Trampolines, air bags, dodgeball/battle beam style attractions, birthday parties, group/private park buyouts at participating locations",
      "Altitude Tampa location page",
      "https://www.altitudetrampolinepark.com/locations/florida/tampa/4340-west-hillsborough-ave/",
    ),
    f(
      "Get Air New Port Richey is not Tampa",
      "7431 SR 54, New Port Richey, FL 34653; phone (727) 347-7701 — Pasco County, not a Tampa trampoline park",
      "Ben note",
      "https://www.altitudetrampolinepark.com/locations/florida/tampa/4340-west-hillsborough-ave/",
    ),
    f(
      "Article scope rule",
      "Center the Tampa answer on Altitude Hillsborough Ave. Hold any other named Tampa trampoline business until open status is confirmed from an official site or recent official social/news.",
      "Open/closed gate 2026-11-02",
      "https://www.altitudetrampolinepark.com/locations/florida/tampa/4340-west-hillsborough-ave/",
    ),
    f(
      "Safety / waiver",
      "Altitude emphasizes safety orientation video, signed waiver, and park rules before jumping",
      "Altitude Tampa location page safety section",
      "https://www.altitudetrampolinepark.com/locations/florida/tampa/4340-west-hillsborough-ave/",
    ),
    f(
      "No invented prices",
      "Do not invent jump-session prices, sock prices, or party package dollars unless pulled from an official booking page into the pack",
      "Pack rule",
      "https://www.altitudetrampolinepark.com/locations/florida/tampa/4340-west-hillsborough-ave/",
    ),
    f(
      "Keyword variants",
      "Searches include trampoline park Tampa, trampoline parks Tampa, Altitude Tampa, Hillsborough Ave trampoline",
      "Ben notes titles",
      "https://www.altitudetrampolinepark.com/locations/florida/tampa/4340-west-hillsborough-ave/",
    ),
    f(
      "Checked date",
      "November 2, 2026",
      "Pack metadata",
      "https://www.altitudetrampolinepark.com/locations/florida/tampa/4340-west-hillsborough-ave/",
    ),
  ],
);

const river = pack(
  "tampa-riverwalk-hotels",
  "tampa riverwalk hotels",
  [
    "Only include hotels with confirmed-open official sites (see OPEN-STATUS.md).",
    "No invented nightly rates.",
    "Hotel Tampa Riverwalk: open during renovations through Nov 30, 2026 with pool and F&B closed.",
    "Address conflicts (505 vs 700 for Marriott) — match phone to reservation.",
  ],
  [
    f(
      "Hotel Tampa Riverwalk — open + renovations",
      "200 North Ashley Drive, Tampa, FL 33602; phone (813) 223-2222; reservations (813) 761-3201. Official site live. Renovations through November 30, 2026 (work 9 a.m.–5 p.m.); pool and all food & beverage closed during renovations; fitness center open 24/7. Check-in 4:00 p.m.; check-out 11:00 a.m. Claims direct Riverwalk access.",
      "Hotel Tampa Riverwalk official FAQ / contact",
      "https://www.hoteltampariverwalk.com/faq",
    ),
    f(
      "Hotel Tampa Riverwalk room count (schema)",
      "Site schema describes 275 oversized rooms (confirm on property materials; do not invent rates)",
      "Hotel Tampa Riverwalk homepage schema",
      "https://www.hoteltampariverwalk.com/",
    ),
    f(
      "Tampa Marriott Water Street — open",
      "505 Water Street, Tampa, FL 33602; +1 813-221-4900. Marriott overview live. Visit Tampa Bay / Friends of the Riverwalk describe steps-from / Riverwalk terrace. Destination fee applies (listed at $20/night on Marriott rooms page); confirm when booking. Check-in 4:00 p.m.; check-out 11:00 a.m.",
      "Marriott — Tampa Marriott Water Street",
      "https://www.marriott.com/en-us/hotels/tpamc-tampa-marriott-water-street/overview/",
    ),
    f(
      "Marriott room-count conflict",
      "Visit Tampa Bay sleeping rooms figure 727 / 28 suites / 27 floors appears in Ben riverwalk note; other meeting figures differ (719 / Friends 717). Label as conflicting published counts — do not invent a fourth number.",
      "Ben riverwalk hotels note + Visit Tampa Bay / Friends figures",
      "https://www.marriott.com/en-us/hotels/tpamc-tampa-marriott-water-street/overview/",
    ),
    f(
      "JW Marriott Tampa Water Street — open",
      "510 Water Street, Tampa, FL 33602; +1 813-221-4950. Marriott overview live. Check-in 4:00 p.m.; check-out 11:00 a.m.; valet $55 daily (hotel-published). Pets not allowed. ~519 rooms/suites per Marriott/Visit Tampa Bay pairing with Marriott to 1,246 combined.",
      "Marriott — JW Marriott Tampa Water Street",
      "https://www.marriott.com/en-us/hotels/tpajd-jw-marriott-tampa-water-street/overview/",
    ),
    f(
      "Embassy Suites Tampa Downtown Convention Center — open",
      "513 South Florida Avenue, Tampa, FL 33602; +1 813-769-8300. Hilton page live. Skybridge to Tampa Convention Center; steps from Riverwalk per Hilton location copy. Check-in 4 p.m.; check-out 11 a.m.; 360 suites.",
      "Hilton — Embassy Suites Tampa Downtown Convention Center",
      "https://www.hilton.com/en/hotels/tpaeses-embassy-suites-tampa-downtown-convention-center/",
    ),
    f(
      "Barrymore Hotel — open (near Riverwalk; Ben did not claim direct path)",
      "111 West Fortune Street, Tampa, FL 33602; (813) 223-1351. Official site live with booking. Check-in 3:00 p.m.; check-out 11:00 a.m.; pool sunrise–sunset; shuttle 8:00 a.m.–10:00 p.m. within 2 miles (not airport). Ben classified as near, not direct-access Riverwalk hotel.",
      "The Barrymore Hotel Tampa Riverwalk",
      "https://www.barrymorehotel.com/",
    ),
    f(
      "Barrymore parking / pet (Ben note)",
      "Self-parking $20/night and pet fee $75/stay appear in Ben note — confirm at booking; do not invent room rates",
      "Ben riverwalk hotels note",
      "https://www.barrymorehotel.com/",
    ),
    f(
      "Held / excluded without this pack’s open confirmation",
      "Do not feature Hyatt Place/Hyatt Regency pair, Hilton Tampa Downtown, Westin Harbour Island, Tampa EDITION, or Aloft as Riverwalk hotels in this draft unless separately confirmed open and Riverwalk-claim verified",
      "Open/closed gate 2026-11-02",
      "https://www.tampa.gov/",
    ),
    f(
      "City distance note (Hotel Tampa Riverwalk)",
      "City of Tampa materials put Hotel Tampa Riverwalk about 0.8 miles from the convention center (Ben note)",
      "Ben note citing City of Tampa / downtown partnership",
      "https://www.tampa.gov/",
    ),
    f(
      "Address pin conflicts",
      "Some city materials historically list Marriott at 700 S Florida Ave vs 505 Water Street; JW sometimes mixed with 505. Match the reservation phone before following a map pin.",
      "Ben riverwalk hotels note",
      "https://www.marriott.com/en-us/hotels/tpamc-tampa-marriott-water-street/overview/",
    ),
    f(
      "Friends of the Riverwalk framing",
      "Friends of the Riverwalk groups “stays along the Riverwalk”; Hotel Tampa Riverwalk is the plainest direct-access claim among Ben’s list",
      "Ben note",
      "https://www.hoteltampariverwalk.com/",
    ),
    f(
      "No nightly rates",
      "Ben never obtained nightly rates from these properties; article must not invent ADR figures",
      "Ben riverwalk hotels note",
      "https://www.hoteltampariverwalk.com/",
    ),
    f(
      "Related published Marriott guide",
      "Site already has a dedicated Tampa Marriott Water Street guide — link rather than re-litigate every fee detail",
      "Published site article",
      "https://www.marriott.com/en-us/hotels/tpamc-tampa-marriott-water-street/overview/",
    ),
    f(
      "Checked date",
      "November 2, 2026",
      "Pack metadata",
      "https://www.hoteltampariverwalk.com/",
    ),
  ],
);

async function main(): Promise<void> {
  for (const p of [tramp, river]) {
    saveFactPack(p);
    console.log(`Wrote ${p.slug}: ${p.facts.length} facts`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
