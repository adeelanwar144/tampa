/**
 * Batch C fact packs: tampa-area-code + tampa-convention-center
 */
import { saveFactPack, type FactEntry, type FactPack } from "./fact-pack";

const CHECKED = "2026-11-02";
function f(c: string, v: string, n: string, u: string): FactEntry {
  return { claim: c, value: v, sourceName: n, sourceUrl: u, checkedAt: CHECKED };
}
function pack(slug: string, keyword: string, notes: string[], facts: FactEntry[]): FactPack {
  return { slug, keyword, checkedAt: CHECKED, notes, facts, allowedTokens: [] };
}

const area = pack(
  "tampa-area-code",
  "tampa area code",
  [
    "813 and 656 cover the same geography (overlay). 656 is not a different town.",
    "Neighbor NPAs 727/352/863/941 are boundaries, not Tampa codes.",
    "Mandatory 10-digit local dialing since Jan 22, 2022 (revised calendar).",
  ],
  [
    f(
      "813/656 overlay approval",
      "Florida PSC approved all-services distributed overlay for 813 NPA on March 31, 2020 (Docket 20190196-TP). 656 serves the same geographic area as 813.",
      "NANPA Planning Letter PL-552",
      "https://nationalnanpa.com/pdf/PL-552.pdf",
    ),
    f(
      "PL-552 supersedes PL-541",
      "PL-552 dated December 4, 2020 supersedes PL-541; revises permissive/mandatory dialing calendar after PSC Order PSC-2020-0479-PAA-TP",
      "NANPA Planning Letter PL-552",
      "https://nationalnanpa.com/pdf/PL-552.pdf",
    ),
    f(
      "Geography of 813/656",
      "813 serves greater Tampa metro including Oldsmar, Temple Terrace, Plant City, Zephyrhills; mainly Hillsborough and Pasco counties. 656 overlays the same area. Central office codes in 656 only when all assignable 813 prefixes are assigned.",
      "NANPA Planning Letter PL-552",
      "https://nationalnanpa.com/pdf/PL-552.pdf",
    ),
    f(
      "Dialing calendar (revised)",
      "Permissive 10-digit dialing started 12:01 a.m. ET April 17, 2021. Mandatory 10-digit dialing started 12:01 a.m. ET January 22, 2022. Earliest 656 CO code activation February 22, 2022. Earliest date 656 codes may be ordered through NANPA: December 18, 2021.",
      "NANPA Planning Letter PL-552",
      "https://nationalnanpa.com/pdf/PL-552.pdf",
    ),
    f(
      "656 in-service",
      "NANPA NPAs-introduced report lists FL 656 overlay of 813 in service February 22, 2022 (PL-552 / PL-541)",
      "NANPA — NPAs Introduced over the Last 10 Years",
      "https://nationalnanpa.com/enas/npasOverLast10YearsReport.do",
    ),
    f(
      "Existing numbers keep 813",
      "Overlay does not require customers to change existing area codes; new customers may receive 656 after 813 prefixes exhaust",
      "Florida elevator/newsroom overlay explainer citing PSC plan",
      "https://www2.myfloridalicense.com/hr/elevators/NewsRoom/2020-12-Florida-NPA-813.pdf",
    ),
    f(
      "Local dialing plan after mandatory date",
      "Local calls (home or foreign NPA in overlay): 10 digits; 1+10 allowed if provider permits. Toll: 1+10. Operator/credit/collect/third-party: 0+10.",
      "NANPA Planning Letter PL-552",
      "https://nationalnanpa.com/pdf/PL-552.pdf",
    ),
    f(
      "Neighbor NPAs (not Tampa codes)",
      "PL-541 rate-center map neighbors: 727 west, 352 north, 863 east, 941 south — boundaries, not extra Tampa codes",
      "Ben note citing PL-541 map + PL-552 geography",
      "https://www.nanpa.com/sites/default/files/planning_letters/PL-541.pdf",
    ),
    f(
      "Test number (historical only)",
      "Test number 656-656-1656 in service Nov 22, 2021 – Mar 22, 2022 for network testing — not a place of business",
      "NANPA Planning Letter PL-552",
      "https://nationalnanpa.com/pdf/PL-552.pdf",
    ),
    f(
      "Why permissive window moved",
      "PSC extended permissive dialing so alarm/elevator/medical devices could be reprogrammed on-site; national 988 timeline limited how far the window could slide. Same order also extended 850 on a different calendar — not Tampa.",
      "Ben note citing PSC-2020-0479-PAA-TP",
      "https://nationalnanpa.com/pdf/PL-552.pdf",
    ),
    f(
      "Fact sheet Pinellas caution",
      "Feb 2020 PSC fact sheet: Hillsborough and parts of Pasco and Pinellas including Tampa and Plant City. Does not name St. Petersburg or Clearwater as 813 cities. Oldsmar is the Pinellas city named in PL-552.",
      "Ben note citing PSC Feb 2020 fact sheet docket 20190196-TP",
      "https://nationalnanpa.com/pdf/PL-552.pdf",
    ),
    f(
      "Short answer",
      "Tampa area codes: 813 and overlay 656 on the same ground; dial 10 digits for local calls since Jan 22, 2022",
      "NANPA PL-552 synthesis",
      "https://nationalnanpa.com/pdf/PL-552.pdf",
    ),
  ],
);

const tcc = pack(
  "tampa-convention-center",
  "tampa convention center",
  [
    "City of Tampa facility — confirm open via tampaconventioncenter.com / tampa.gov.",
    "Event parking is a $5–$50 range — never invent a single event price.",
    "No box office; tickets come from the event organizer.",
  ],
  [
    f(
      "Open status",
      "Official Tampa Convention Center site live (City of Tampa) with contact, space stats, and sales phones — operating venue",
      "Tampa Convention Center",
      "https://www.tampaconventioncenter.com/",
    ),
    f(
      "Address",
      "333 S. Franklin Street, Tampa, FL 33602 (Downtown Tampa)",
      "City of Tampa / TCC materials via Ben note + TCC site",
      "https://www.tampaconventioncenter.com/",
    ),
    f(
      "Space stats",
      "600,000 sq ft flexible event space; 200,000 sq ft exhibit space; 36,000 sq ft ballroom; 50 breakout rooms",
      "Tampa Convention Center homepage",
      "https://www.tampaconventioncenter.com/",
    ),
    f(
      "Phones",
      "Main (813) 274-8511; toll-free 1-800-426-5630; sales (813) 274-7762; info@thetampacc.com",
      "Tampa Convention Center homepage",
      "https://www.tampaconventioncenter.com/",
    ),
    f(
      "Airport / Riverwalk context",
      "Attendee materials: about 15-minute drive from TPA; along Tampa Riverwalk described as 2.4 miles of walkable path; Garrison Channel / Hillsborough River views",
      "Ben note citing TCC attendee information",
      "https://www.tampaconventioncenter.com/",
    ),
    f(
      "TCC garage",
      "141 E. Brorein Street; 454 spaces; 11 ADA; 2 EV; max height 6'6\"; event rate $5–$50; non-event $3/hr, $18 daily max; no long-term; no pre-pay/reserved",
      "City of Tampa parking / Ben note",
      "https://www.tampa.gov/parking/info/parking-hourly-and-daily-rates",
    ),
    f(
      "Front drive meters",
      "333 S. Franklin Street curb: 36 metered spaces; $4/hour; visitor hourly Mon–Sun 8:00 a.m.–midnight; no overnight",
      "City of Tampa parking / Ben note",
      "https://www.tampa.gov/tcc/parking",
    ),
    f(
      "Nearby city garages",
      "Pam Iorio (301 Channelside): 790 spaces; Fort Brooke (107 N Franklin): 556 hourly; same event $5–$50 / non-event $3+$18 pattern; Fort Brooke max height 6'8\". Long-term pointed to Pam Iorio / Fort Brooke.",
      "City of Tampa TCC parking page / Ben note",
      "https://www.tampa.gov/tcc/parking",
    ),
    f(
      "Other nearby lots (Ben note)",
      "Selmon Expressway West 201 S Ashley: non-event $2/hr $14 max; Selmon CAMLS 301 S Florida weekends-only same $2/$14. Parking division (813) 274-8179.",
      "City of Tampa parking / Ben note",
      "https://www.tampa.gov/parking/info/parking-hourly-and-daily-rates",
    ),
    f(
      "Walkable hotels named by city",
      "Across the street: Tampa Marriott Water Street, JW Marriott, Embassy Suites Downtown. Westin Waterside 0.3 mi; Hilton Downtown 0.5 mi.",
      "Ben note citing City of Tampa attendee hotel list",
      "https://www.tampaconventioncenter.com/",
    ),
    f(
      "Streetcar / water taxi",
      "TECO Streetcar described free between downtown, Sparkman Wharf, Ybor; convention stop 10 Dick Greco Plaza. Pirate Water Taxi home dock stop 7 at Channel entrance; day-pass pricing not quoted in materials Ben saw. No fuel at TCC docks; Marjorie Park Yacht Basin on Davis Island sells fuel 8 a.m.–5 p.m. daily except city holidays, (813) 259-1604.",
      "Ben note citing TCC attendee info",
      "https://www.tampaconventioncenter.com/",
    ),
    f(
      "Attendee rules",
      "No box office — tickets from the event. No wheelchair/scooter rental by the building. Outside food/drink not allowed except dietary restriction/allergy cases. Starbucks and Kahwa named inside. Bag rules set by each event. Lost & found Security Command Center (813) 274-7791, kept 30 days. Complimentary Wi-Fi in public areas/meeting rooms/Sail Plaza; exhibitor internet paid separately.",
      "Ben note citing TCC FAQ/attendee materials",
      "https://www.tampaconventioncenter.com/",
    ),
    f(
      "What TCC does not host",
      "Does not host weddings, birthdays, family reunions, or other small private events. Food trucks limited by exclusive caterer; city said at capacity on property when Ben checked.",
      "Ben note citing TCC FAQ",
      "https://www.tampaconventioncenter.com/",
    ),
    f(
      "Garage approach tip",
      "Directions converge on Tampa Street middle lane into garage; I-275 exit 44 from bay side / exit 45A from south & Orlando approaches",
      "Ben note citing city driving directions",
      "https://www.tampa.gov/tcc/parking",
    ),
    f(
      "Awards claim",
      "Site: recognized Best Convention Center in the Southeast (Northstar Stella Awards) — industry award claim, not a visitor logistics fact",
      "Tampa Convention Center homepage",
      "https://www.tampaconventioncenter.com/",
    ),
  ],
);

async function main(): Promise<void> {
  for (const p of [area, tcc]) {
    saveFactPack(p);
    console.log(`Wrote ${p.slug}: ${p.facts.length} facts`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
