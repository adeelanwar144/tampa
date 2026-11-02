/**
 * One-shot writer for expanded Marriott + Tampa–Miami fact packs (2026-11-02).
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

const marriottFacts: FactEntry[] = [
  f(
    "Hotel name and street address",
    "Tampa Marriott Water Street, 505 Water Street, Tampa, FL 33602",
    "Marriott — Tampa Marriott Water Street overview",
    "https://www.marriott.com/en-us/hotels/tpamc-tampa-marriott-water-street/overview/",
  ),
  f(
    "Local phone",
    "+1 813-221-4900",
    "Marriott — Tampa Marriott Water Street overview",
    "https://www.marriott.com/en-us/hotels/tpamc-tampa-marriott-water-street/overview/",
  ),
  f(
    "Toll-free booking line",
    "+1-800-228-9290",
    "Marriott — Tampa Marriott Water Street overview",
    "https://www.marriott.com/en-us/hotels/tpamc-tampa-marriott-water-street/overview/",
  ),
  f(
    "Check-in / check-out / minimum age",
    "Check-in 4:00 p.m.; check-out 11:00 a.m.; minimum age to check in 18",
    "Marriott — Property Details / FAQ",
    "https://www.marriott.com/en-us/hotels/tpamc-tampa-marriott-water-street/overview/",
  ),
  f(
    "Destination fee (current Marriott rooms page)",
    "Destination fee currently $20 daily excluding tax. Inclusions: daily $20 food and beverage credit; daily fitness/wellness classes; daily beverage tasting; choice of admission for two on a round-trip water taxi, one hour of water sports, OR one hour of bike rentals; enhanced daily Wi-Fi. Rate and inclusions subject to change.",
    "Marriott — Rooms & Suites / Destination Fee Inclusions",
    "https://www.marriott.com/en-us/hotels/tpamc-tampa-marriott-water-street/rooms/",
  ),
  f(
    "Pet policy",
    "Pets welcome; max 2 pets per room; max 50.0 lbs per pet; non-refundable pet fee $150.00 per stay",
    "Marriott — Pet Policy / FAQ",
    "https://www.marriott.com/en-us/hotels/tpamc-tampa-marriott-water-street/overview/",
  ),
  f(
    "Valet parking (hotel-published)",
    "Daily valet $55.00; short-term daytime valet $35.00; hotel asks guests to contact property for self-parking options; Pam Iorio Parking Garage listed 0.2 miles for public/off-site parking",
    "Marriott — Parking / FAQ",
    "https://www.marriott.com/en-us/hotels/tpamc-tampa-marriott-water-street/overview/",
  ),
  f(
    "Pam Iorio Garage self-park rates (City of Tampa)",
    "Pam Iorio Parking Garage at 301 Channelside Drive: non-event rate $3 per hour, daily maximum $18; event rates $5.00 to $50.00 subject to event. City garage hourly table confirms Pam Iorio $3 / $3 / $18 daily max. Tax not included on monthly rates page.",
    "City of Tampa — TCC parking + Hourly And Daily Parking Rates",
    "https://www.tampa.gov/parking/info/parking-hourly-and-daily-rates",
  ),
  f(
    "Pam Iorio Garage capacity notes",
    "790 total spaces; 350 monthly contracted; 41 ADA; 2 EV charging stations; visitor hourly parking Mon–Sun overnight up to 6:00 a.m.",
    "City of Tampa — Pam Iorio Garage (TCC parking page)",
    "https://www.tampa.gov/tcc/parking",
  ),
  f(
    "Airport distance / shuttle",
    "Tampa International Airport about 9.0 miles from property; no hotel shuttle. St. Pete–Clearwater International about 22.0 miles; no hotel shuttle.",
    "Marriott — Getting Here",
    "https://www.marriott.com/en-us/hotels/tpamc-tampa-marriott-water-street/overview/",
  ),
  f(
    "Room count",
    "Visit Tampa Bay lists Number of Sleeping Rooms (Include Suites): 727; Number of Suites: 28; Number of Floors: 27. Marriott meetings page also references ~699 guest rooms and 28 suites at this hotel (combined Water Street collection with JW is larger).",
    "Visit Tampa Bay listing + Marriott meetings page",
    "https://www.visittampabay.com/listings/tampa-marriott-water-street/4650/",
  ),
  f(
    "Pool",
    "Outdoor rooftop pool listed as complimentary amenity; cabanas/palapas available for $100.00; Pool Bar & Grill on rooftop",
    "Marriott — Property Amenities / Dining",
    "https://www.marriott.com/en-us/hotels/tpamc-tampa-marriott-water-street/overview/",
  ),
  f(
    "Fitness center",
    "On-site fitness center listed complimentary; newly redesigned with cardio and free-weight equipment",
    "Marriott — Property Amenities / Fitness",
    "https://www.marriott.com/en-us/hotels/tpamc-tampa-marriott-water-street/overview/",
  ),
  f(
    "Wi-Fi",
    "In-room Wi-Fi available; Marriott Bonvoy members receive complimentary in-room Internet when booking direct. Destination fee includes enhanced daily Wi-Fi.",
    "Marriott — FAQ + Destination Fee Inclusions",
    "https://www.marriott.com/en-us/hotels/tpamc-tampa-marriott-water-street/rooms/",
  ),
  f(
    "On-site restaurants and outlets (this hotel)",
    "On-property: Riverwalk Terrace; PERK; Anchor and Brine; Lona by Chef Richard Sandoval; Pool Bar & Grill; Bright Ice; A La Carte (room service / grab-and-go). Marriott FAQ lists these seven.",
    "Marriott — Dining FAQ",
    "https://www.marriott.com/en-us/hotels/tpamc-tampa-marriott-water-street/dining/",
  ),
  f(
    "Riverwalk Terrace hours",
    "Mon–Fri 6:30 a.m.–11:00 a.m.; Sat–Sun 6:30 a.m.–1:00 p.m.; phone +1 813-204-6391; smart casual; breakfast/brunch",
    "Marriott — Dining",
    "https://www.marriott.com/en-us/hotels/tpamc-tampa-marriott-water-street/dining/",
  ),
  f(
    "PERK hours",
    "Every day 6:00 a.m.–6:00 p.m.; cashless coffee, teas, pastries, grab-and-go",
    "Marriott — Dining",
    "https://www.marriott.com/en-us/hotels/tpamc-tampa-marriott-water-street/dining/",
  ),
  f(
    "Anchor and Brine hours",
    "Mon–Thu & Sun 11:00 a.m.–10:00 p.m.; Fri–Sat 11:00 a.m.–11:00 p.m.; phone +1 813-431-6951; seafood-forward; cashless",
    "Marriott — Dining",
    "https://www.marriott.com/en-us/hotels/tpamc-tampa-marriott-water-street/dining/",
  ),
  f(
    "Lona by Chef Richard Sandoval hours",
    "Every day 4:00 p.m.–11:00 p.m.; phone +1 813-204-6390; modern Mexican; cashless; smart casual",
    "Marriott — Dining",
    "https://www.marriott.com/en-us/hotels/tpamc-tampa-marriott-water-street/dining/",
  ),
  f(
    "Pool Bar & Grill hours",
    "Fri–Sun 11:00 a.m.–5:00 p.m.; closed Mon–Thu",
    "Marriott — Dining",
    "https://www.marriott.com/en-us/hotels/tpamc-tampa-marriott-water-street/dining/",
  ),
  f(
    "Bright Ice hours",
    "Fri–Sat 1:00 p.m.–10:00 p.m.; Sun 1:00 p.m.–9:30 p.m.",
    "Marriott — Dining",
    "https://www.marriott.com/en-us/hotels/tpamc-tampa-marriott-water-street/dining/",
  ),
  f(
    "A La Carte / room service hours",
    "Mon–Thu & Sun 6:30 a.m.–10:00 p.m.; Fri–Sat 6:30 a.m.–11:00 p.m.",
    "Marriott — Dining",
    "https://www.marriott.com/en-us/hotels/tpamc-tampa-marriott-water-street/dining/",
  ),
  f(
    "Skybridge / Convention Center / JW neighbor",
    "Connected to JW Marriott Tampa Water Street via glass skybridge on the third floor; adjacent to Tampa Convention Center. Neighbor JW is 510 Water Street.",
    "Marriott overview",
    "https://www.marriott.com/en-us/hotels/tpamc-tampa-marriott-water-street/overview/",
  ),
  f(
    "Meeting space",
    "About 50,000 square feet of renovated meeting space at Tampa Marriott Water Street",
    "Marriott overview",
    "https://www.marriott.com/en-us/hotels/tpamc-tampa-marriott-water-street/overview/",
  ),
  f(
    "UPS Business Center hours",
    "Mon–Fri 8 a.m.–6 p.m.; Sat 10 a.m.–2 p.m.; Sun closed; second level",
    "Marriott — Business Center",
    "https://www.marriott.com/en-us/hotels/tpamc-tampa-marriott-water-street/overview/",
  ),
  f(
    "Guaranteed early check-in / late check-out",
    "Starting at $100+ tax for guaranteed early arrival or late departure",
    "Marriott — Rooms",
    "https://www.marriott.com/en-us/hotels/tpamc-tampa-marriott-water-street/rooms/",
  ),
  f(
    "Smoke-free / EV",
    "Smoke-free property; electric car charging stations listed (subject to availability)",
    "Marriott overview",
    "https://www.marriott.com/en-us/hotels/tpamc-tampa-marriott-water-street/overview/",
  ),
  f(
    "Walking — Riverwalk",
    "Hotel is on the Tampa Riverwalk / waterfront; Marriott describes Riverwalk access as steps from the property (not a remote walk).",
    "Marriott overview / destination copy",
    "https://www.marriott.com/en-us/hotels/tpamc-tampa-marriott-water-street/overview/",
  ),
  f(
    "Walking — Benchmark International Arena (formerly Amalie Arena)",
    "OSRM pedestrian route from hotel geocode (505 Water Street) to 401 Channelside Drive ≈ 0.32 miles / about 1–7 minutes walking (routing estimate; confirm on map day-of).",
    "OpenStreetMap Nominatim + OSRM foot routing (checked 2026-11-02)",
    "https://www.openstreetmap.org/",
  ),
  f(
    "Walking — Florida Aquarium",
    "OSRM pedestrian route to 701 Channelside Drive ≈ 0.77 miles (routing estimate).",
    "OpenStreetMap Nominatim + OSRM foot routing (checked 2026-11-02)",
    "https://www.openstreetmap.org/",
  ),
  f(
    "Walking — Sparkman Wharf",
    "OSRM pedestrian route toward 615 Channelside Drive ≈ 0.43 miles (routing estimate).",
    "OpenStreetMap Nominatim + OSRM foot routing (checked 2026-11-02)",
    "https://www.openstreetmap.org/",
  ),
  f(
    "Walking — Port Tampa Bay cruise area (third-party distance)",
    "Third-party hotel listing distances Port of Tampa / Port Tampa Bay area about 0.5 miles (0.8 km) from the hotel. Confirm cruise terminal number and walking path on Port Tampa Bay / map day-of; OSM cruise-terminal geocode failed during this check.",
    "Sembo hotel distance listing (cross-check; not Port Tampa Bay official)",
    "https://www.sembo.co.uk/places/tampa-florida-united-states-of-america/hotels/37-16915/tampa-marriott-water-street",
  ),
  f(
    "Nearby landmarks named by Marriott",
    "Marriott lists proximity to Tampa Riverwalk, Florida Aquarium, Benchmark International Arena, and Sparkman Wharf",
    "Marriott overview",
    "https://www.marriott.com/en-us/hotels/tpamc-tampa-marriott-water-street/overview/",
  ),
];

const miamiFacts: FactEntry[] = [
  f(
    "FDOT intercity mileage spreadsheet currency",
    "Florida Official Intercity Highway Mileage spreadsheet last updated 9/14/2026 on FDOT’s intercity page. Automated download of the live spreadsheet was blocked by Cloudflare on 2026-11-02 during this pack build; city-pair miles below are taken from Ben’s rewritten note that transcribed the FDOT table (re-open the viewer/spreadsheet before publish to re-verify).",
    "FDOT — Florida Official Intercity Highway Mileage",
    "https://www.fdot.gov/statistics/hwydata/intercity.shtm",
  ),
  f(
    "FDOT Tampa–Miami city-pair miles (from Ben note transcription of FDOT table)",
    "Per Ben’s note citing FDOT’s official intercity table: Tampa to Miami 250 miles; Miami to Tampa 248 miles (two-mile directional difference on the same pair). Related FDOT pairs in that note: Tampa–Fort Lauderdale 236 / reverse 234; Tampa–Miami Beach 253; Tampa–West Palm Beach 197; Tampa–Orlando 85 both ways. Do not average 248 and 250.",
    "Ben note transcription of FDOT Official Intercity Highway Mileage (re-verify on FDOT before publish)",
    "https://www.fdot.gov/statistics/hwydata/intercity.shtm",
  ),
  f(
    "Driving-directions distance vs FDOT (labeled comparison)",
    "Ben note also records a driving-directions figure of about 280 miles (451 km) Tampa–Miami with an associated typical-traffic drive time of 3 hours 55 minutes at about 71.5 mph average—and a separate “about 4 hours” line on the same estimate. Straight-line about 205 miles (331 km). These are NOT the FDOT city-pair miles; article must keep FDOT 248/250 separate from the 280-mile directions figure.",
    "Ben note (driving-directions vs FDOT comparison)",
    "https://www.fdot.gov/statistics/hwydata/intercity.shtm",
  ),
  f(
    "I-75 south end milepost (Florida)",
    "I-75 mile 0.000 at interchange of SR 826 (Palmetto Expressway) and SR 924 (Gratigny Parkway) on the Hialeah–Miami Lakes line",
    "FDOT — 2026 Interchange Report (I-75)",
    "https://fdotwww.blob.core.windows.net/sitefinity/docs/default-source/statistics/mileage-rpts/interchange_2026.pdf?sfvrsn=9cc3e80b_8",
  ),
  f(
    "I-75 / I-4 area near Tampa (route A core segment)",
    "I-4 interchange east of Tampa listed as exit 261 at about mile 260.729 on I-75. Interstate segment from that interchange to the Palmetto ≈ 261 miles. This is NOT downtown-to-beach door-to-door mileage.",
    "FDOT — 2026 Interchange Report (I-75)",
    "https://fdotwww.blob.core.windows.net/sitefinity/docs/default-source/statistics/mileage-rpts/interchange_2026.pdf?sfvrsn=9cc3e80b_8",
  ),
  f(
    "Route A description — I-75 / Alligator Alley",
    "Common Gulf-coast drive: I-75 south past Bradenton/Sarasota/Fort Myers/Naples, then east across Alligator Alley (tolled Everglades stretch) toward Miami-Dade. I-75 ends at the Palmetto/Gratigny, not on the beach.",
    "FDOT interchange report + Florida’s Turnpike Alligator Alley card",
    "https://floridasturnpike.com/wp-content/uploads/2026/07/South-Florida-8-3-2026.pdf",
  ),
  f(
    "Alligator Alley 2-axle tolls (Route A tolls)",
    "Effective August 3, 2026: East Toll Plaza (MP 25) and West Toll Plaza (MP 100) — SunPass $3.18 (2 axle); TOLL-BY-PLATE $3.51 (2 axle); 3/4/5 axle SunPass $6.36 / $9.54 / $12.72. Same plazas listed eastbound and westbound on the card. Confirm whether one plaza or both apply for a single crossing on signage/SunPass before quoting a trip total.",
    "Florida’s Turnpike — South Florida toll rates PDF (Alligator Alley)",
    "https://floridasturnpike.com/wp-content/uploads/2026/07/South-Florida-8-3-2026.pdf",
  ),
  f(
    "Route B description — Florida’s Turnpike via Orlando area",
    "Alternate inland drive uses Florida’s Turnpike (SR 91) corridor via the Orlando area rather than Alligator Alley. Enter/exit points vary (e.g., I-4 / Orlando area exits, or Wildwood / I-75 connection north of Orlando). Trip toll is the sum of plazas and ramps passed—not a single flat fee.",
    "Florida’s Turnpike — Toll Rates hub + Toll Calculator",
    "https://floridasturnpike.com/tolls/toll-rates/",
  ),
  f(
    "Turnpike sample plaza rates useful for Route B (2-axle SunPass)",
    "Central Florida mainline examples (FDOT sheets): Leesburg Plaza area and Three Lakes Plaza $4.13 SunPass (2 axle) appear on Central Florida cards; South Florida SR 91 / SR 821 sheets list many additional plazas (e.g., Lantana Plaza $0.60 SunPass 2-axle on South Florida card). Exact Tampa→Miami Turnpike trip total must be calculated in the official SunPass Toll Calculator for the chosen exits—do not invent a summed total in the article.",
    "Florida’s Turnpike Central/South Florida rate PDFs + Toll Calculator",
    "https://floridasturnpike.com/TollCalc/",
  ),
  f(
    "Drive-time ESTIMATE (labeled estimate only)",
    "ESTIMATE ONLY for the ~261-mile I-75 interchange-to-Palmetto segment: at a constant 70 mph with no stops, 261 ÷ 70 ≈ 3.7 hours (about 3 hours 45 minutes). This is NOT a door-to-door Tampa–Miami drive time. Real trips add city access miles, fuel/rest stops, Everglades/Alley conditions, and Miami traffic. Do not present 3.7 hours as a guaranteed arrival time.",
    "Derived from FDOT I-75 mileposts (261 miles) + Ben note’s FDOT 70 mph I-75 Florida limit citation; labeled estimate",
    "https://fdotwww.blob.core.windows.net/sitefinity/docs/default-source/statistics/mileage-rpts/interchange_2026.pdf?sfvrsn=9cc3e80b_8",
  ),
  f(
    "TPA nonstop destinations — Miami and Fort Lauderdale",
    "Tampa International Airport destination pages list nonstop service to Miami (airport code MIA) and Fort Lauderdale (airport code FLL). Those destination marketing pages do not name the operating airlines on the scraped page content.",
    "TPA destinations — Miami + Fort Lauderdale",
    "https://www.tampaairport.com/destinations/south/miami",
  ),
  f(
    "TPA → MIA nonstop airline (American)",
    "American Airlines publishes and operates nonstop Tampa (TPA)–Miami (MIA) flights (aa.com flights-from-tampa-to-miami). FlightAware live board on 2026-11-02 showed American flights such as AAL3156 on the TPA–MIA pair. Do not invent fares or claim exclusivity unless re-verified the day of publish.",
    "American Airlines + FlightAware KTPA board (spot check)",
    "https://www.aa.com/en-us/flights-from-tampa-to-miami",
  ),
  f(
    "TPA → FLL nonstop (existence + sample carrier observed)",
    "TPA lists Fort Lauderdale (FLL) as a nonstop destination. FlightAware KTPA board on 2026-11-02 showed Breeze Airways (MXY) activity involving FLL and a scheduled departure toward FLL (e.g., FLE1602). Carrier mix changes—confirm current TPA→FLL airlines on TPA flight status / airline sites before naming a full roster.",
    "TPA Fort Lauderdale destination page + FlightAware KTPA spot check",
    "https://www.tampaairport.com/destinations/south/fort-lauderdale",
  ),
  f(
    "Amtrak current Tampa–Miami train (Floridian; Silver Star status)",
    "Amtrak Floridian timetable dated Sunday, November 1, 2026: Train 41 southbound departs Tampa Union Station 12:43 p.m., arrives Miami 6:09 p.m. (about 5 hours 26 minutes). Train 40 northbound departs Miami 11:05 a.m., arrives Tampa 4:49 p.m. (about 5 hours 44 minutes). Daily. A separate Silver Star PDF still exists but is dated Friday, September 26, 2025; for Nov 2026 travel use the Floridian timetable as current. Do not invent coach fares.",
    "Amtrak Floridian Route Timetable PDF",
    "https://content.amtrak.com/content/timetable/Floridian.pdf",
  ),
  f(
    "Amtrak Tampa station",
    "Tampa Union Station (TPA) appears on the Floridian timetable; address commonly 601 N Nebraska Avenue, Tampa, FL 33602 (confirm on amtrak.com station page when linking).",
    "Amtrak Floridian timetable",
    "https://content.amtrak.com/content/timetable/Floridian.pdf",
  ),
  f(
    "Brightline Orlando–Miami (current, ticketable)",
    "Brightline Orlando station page: ride Orlando–West Palm Beach ≈ 2 hours; Orlando–Miami ≈ 3 hours 30 minutes. Current schedule between Central and South Florida includes 16 daily round trips with hourly northbound and southbound departures (schedule subject to change). This is NOT a Tampa departure.",
    "Brightline — Orlando station",
    "https://www.gobrightline.com/train-stations/fl/orlando",
  ),
  f(
    "Brightline Tampa extension status (re-verified)",
    "Brightline Florida August 2026 ridership report: affiliate Brightline Tampa LLC is developing Orlando–Tampa extension; evaluating phased Sunshine Corridor (initial Orlando International Airport to South International Drive; Tampa as later phase). FDOT PD&E study advancing; Hillsborough TPO surveyed downtown Tampa station planning. No Tampa Brightline tickets to buy. City of Tampa materials historically describe Brightline Tampa station area planning; extension remains planning/development, not operating service.",
    "Brightline Florida August 2026 Monthly Revenue and Ridership Report + prior City of Tampa planning context",
    "https://www.gobrightline.com/content/dam/brightline/pdfs/investor-relations/2026/brightline-florida-august-2026-ridership-report.pdf",
  ),
  f(
    "FlixBus Tampa–Miami",
    "FlixBus route page: about 7 hours; about 309–311 miles by bus; from $39.98; 9 rides daily; first departure 06:20 a.m. (also written 6:20 a.m.); last 10:35 p.m. (also 10:35 pm). Tampa Bus Station 1315 N Marion St; also USF stop. Miami stops include Miami Intermodal Center, Golden Glades, Miami Beach.",
    "FlixBus — Tampa FL to Miami FL",
    "https://www.flixbus.com/bus-routes/bus-tampa-fl-miami-fl",
  ),
  f(
    "Greyhound Tampa–Miami",
    "Greyhound route page (same network presentation): about 7 hours; ~309–311 miles; fares from about $39.98 (page also showed from $40.98 in hero); 9 daily departures; first 06:20 a.m.; last 10:35 p.m. Same Tampa Hart Transfer Center / Marion St address. Tickets for Greyhound and FlixBus can be compared on greyhound.com.",
    "Greyhound — Tampa FL to Miami FL",
    "https://www.greyhound.com/bus-routes/tampa-fl-miami-fl",
  ),
  f(
    "RedCoach Tampa–Miami",
    "RedCoach route page: from about $31.36 (buy-ticket page also shows from $24.99); up to 2 buses; sample window 9:00 a.m.–3:30 p.m.; trip time listed about 5 hours 7 minutes on route page (FAQ also says fastest about 5 hours / average about 5 hours 15 minutes); route distance listed 277 miles (FAQ also mentions 236 miles for fastest—do not reconcile inventively; quote the page figures carefully). Tampa stop: 3801 USF Holly Drive, 33620. Miami: near MIA (21 Miad Circle / Miami Airport area per RedCoach).",
    "RedCoach — Tampa to Miami",
    "https://www.redcoachusa.com/route/tampa-to-miami/",
  ),
  f(
    "What not to invent",
    "No door-to-door drive time presented as fact; no invented FDOT city-pair miles; no airfare quote unless added from airline with a new fact row; no claiming Brightline tickets from Tampa; no claiming Silver Star as the Nov 2026 operating name when Floridian timetable is current.",
    "Editorial constraint",
    "https://www.fdot.gov/statistics/hwydata/intercity.shtm",
  ),
  f(
    "TPA physical address",
    "Tampa International Airport, 4100 George J. Bean Pkwy, Tampa, FL 33607",
    "Tampa International Airport destination pages footer",
    "https://www.tampaairport.com/destinations/south/miami",
  ),
  f(
    "Turnpike toll-rate index page",
    "Current regional toll PDFs linked from Florida’s Turnpike toll rates hub; confirm live card/calculator before travel",
    "Florida’s Turnpike Enterprise — Toll Rates",
    "https://floridasturnpike.com/tolls/toll-rates/",
  ),
  f(
    "Brightline Orlando station hours",
    "Brightline Orlando station hours of operation listed Mon–Sun 4:30 a.m. to last train departure (confirm on station page)",
    "Brightline — Orlando station",
    "https://www.gobrightline.com/train-stations/fl/orlando",
  ),
  f(
    "Greyhound/FlixBus Tampa boarding note",
    "Greyhound stop located at Hart Transfer Center; loading gates relocated from West Platform to North Platform; platform shown as 100/300 for PSTA",
    "Greyhound / FlixBus Tampa Bus Station notes",
    "https://www.greyhound.com/bus-routes/tampa-fl-miami-fl",
  ),
];

const kennedyFacts: FactEntry[] = [
  f(
    "Venue identity and address",
    "Venue behind “kennedy club tampa / kennedy soho tampa” searches: The Kennedy / The Kennedy Soho at 2408 W. Kennedy Blvd., Tampa, FL 33609 (SoHo / South Tampa, ZIP 33609)—not a downtown private membership club.",
    "Multiple directory listings + Ben note cross-check",
    "https://www.bars10.com/US/Tampa/53440891362/The-Kennedy",
  ),
  f(
    "Phone numbers listed on directories",
    "Club phone listed as 813-259-9669. VIP bookings line on Bars10 listing: 813-600-7771 ask for Blair. Call to confirm status before planning a night.",
    "Bars10 / AllBiz listings",
    "https://www.bars10.com/US/Tampa/53440891362/The-Kennedy",
  ),
  f(
    "Website claim on directories",
    "Directories still list website thekennedysoho.com / kennedysoho.com; Ben note found no reliable self-presented official club site speaking for current operations—treat directory web fields as unverified until the site loads with current hours.",
    "Bars10 / Menupix directory fields",
    "https://www.bars10.com/US/Tampa/53440891362/The-Kennedy",
  ),
  f(
    "Hours conflict — Bars10 / AllBiz (2026 listings)",
    "Bars10 and AllBiz list Monday, Friday, Saturday 10:00 p.m.–3:00 a.m.; closed other days. Do not treat as confirmed without a phone check.",
    "Bars10 + AllBiz",
    "https://www.allbiz.com/business/the-kennedy-soho-813-259-9669",
  ),
  f(
    "Hours conflict — other directories",
    "Other place aggregators disagree (e.g., some show Friday 9 p.m.–3 a.m. / Saturday 10 p.m.–3 a.m. and Monday closed). Hours are NOT settled—article must say call before you go.",
    "Directory conflict (Checkle / Exa place card)",
    "https://www.checkle.com/biz/the-kennedy-soho-tampa",
  ),
  f(
    "Open vs closed status conflict (critical)",
    "Ben’s note found accounts labeling the venue permanently closed / CLOSED at the same address, while other 2026 directories still show night hours. Pack rule: state the conflict; do not declare the club definitively open or invent a closing date.",
    "Ben note + conflicting directories",
    "https://www.bars10.com/US/Tampa/53440891362/The-Kennedy",
  ),
  f(
    "Neighborhood / type",
    "Described across sources as an upscale dance lounge / nightclub / bar in South Tampa’s SoHo neighborhood with indoor and outdoor party space; independent (not a hotel chain club).",
    "Ben note + directory descriptions",
    "https://www.allbiz.com/business/the-kennedy-soho-813-259-9669",
  ),
  f(
    "Event-space rundown capacities (legacy description—verify)",
    "Event-space style rundown (cited in Ben note): standing capacity 500; seating capacity 200; built 2008; dance floor; outdoor space; private space; wheelchair accessible; onsite catering; one meeting room; table service / VIP seating; Funktion One hybrid sound system mentioned. Treat as historical venue description, not proof the room is open tonight.",
    "Ben note (event-space rundown)",
    "https://www.bars10.com/US/Tampa/53440891362/The-Kennedy",
  ),
  f(
    "Dress code (stated restriction—verify)",
    "Rundown cited in Ben note: dress-to-impress; stated restrictions include no hats/baseball caps, no sneakers, no baggy pants or jeans, no bandanas; dressy jeans permitted with proper attire (wording also names Hyde Park Cafe—call to confirm what still applies).",
    "Ben note",
    "https://www.bars10.com/US/Tampa/53440891362/The-Kennedy",
  ),
  f(
    "Parking language (no rate)",
    "Area parking / paid parking / valet mentioned in rundowns without a posted rate—do not invent a dollar figure.",
    "Ben note",
    "https://www.bars10.com/US/Tampa/53440891362/The-Kennedy",
  ),
  f(
    "What not to invent",
    "No cover charge, bottle minimum, or door time unless an official current source is added. No claim that “The Kennedy Club” is a separate venue. No ignoring the open/closed conflict.",
    "Editorial constraint",
    "https://www.bars10.com/US/Tampa/53440891362/The-Kennedy",
  ),
  f(
    "SoHo context for searchers",
    "Address is West Kennedy Boulevard in ZIP 33609 (SoHo), distinct from downtown Kennedy Boulevard blocks—helpful for navigation and avoiding wrong-venue mix-ups.",
    "USPS ZIP + Ben note",
    "https://www.bars10.com/US/Tampa/53440891362/The-Kennedy",
  ),
  f(
    "VIP booking line (directory)",
    "Bars10: for VIP bookings call 813-600-7771 ask for Blair, or club 813-259-9669—confirm before relying on either line.",
    "Bars10",
    "https://www.bars10.com/US/Tampa/53440891362/The-Kennedy",
  ),
  f(
    "Price mark on some directories",
    "Some closed/directory cards show a $$ price mark only—no menu prices sourced.",
    "Ben note / directory",
    "https://www.bars10.com/US/Tampa/53440891362/The-Kennedy",
  ),
  f(
    "Outdoor / Ivy patio mention (legacy)",
    "Descriptions mention outdoor/side area called The Ivy and indoor/outdoor lounge seating; some tips referenced Ivy reopening—treat as historical color, not a current patio schedule.",
    "Ben note",
    "https://www.bars10.com/US/Tampa/53440891362/The-Kennedy",
  ),
  f(
    "Rating snippets (directories)",
    "Some aggregators show about 3.7 rating from ~215 reviews—directory social proof only, not an official club metric.",
    "Directory aggregators cited in Ben note",
    "https://www.bars10.com/US/Tampa/53440891362/The-Kennedy",
  ),
  f(
    "Event-space hours (legacy—conflicts)",
    "Legacy rundown hours in Ben note: Sun/Tue/Wed special events only; Mon 11 p.m.–3 a.m.; Thu–Sat 10 p.m.–3 a.m. Conflicts with other hour sets—do not present as current without confirmation.",
    "Ben note",
    "https://www.bars10.com/US/Tampa/53440891362/The-Kennedy",
  ),
  f(
    "August 11, 2026 hour set (conflicts)",
    "Ben note cites an Aug 11, 2026 hour set: Mon/Fri/Sat 22:00–03:00 only—conflicts with other lists; pack requires phone confirmation language.",
    "Ben note",
    "https://www.bars10.com/US/Tampa/53440891362/The-Kennedy",
  ),
  f(
    "Alcohol / full bar",
    "Directories/rundowns describe full bar / alcohol allowed; no cocktail price list sourced.",
    "Ben note + Menupix-style directory",
    "https://www.menupix.com/tampa/restaurants/250493289/The-Kennedy-Tampa-FL",
  ),
  f(
    "Searcher intent checklist covered",
    "Pack covers: exact address/neighborhood, name variants, phone, hours conflict, open/closed conflict, dress code caution, capacity legacy figures, parking without invented rates, VIP contact lines. Missing solid official: live club website, confirmed open status, cover/bottle prices.",
    "Editorial coverage note",
    "https://www.bars10.com/US/Tampa/53440891362/The-Kennedy",
  ),
];

function pack(slug: string, keyword: string, facts: FactEntry[], notes: string[]): FactPack {
  return {
    slug,
    keyword,
    checkedAt: CHECKED,
    notes,
    facts,
    allowedTokens: [],
  };
}

saveFactPack(
  pack("marriott-water-street-tampa", "marriott water street tampa", marriottFacts, [
    "Fax removed per editorial request.",
    "Destination fee from Marriott rooms page ($20) — destination hub sometimes shows $35; pack uses rooms-page $20.",
    "Cruise terminal exact OSM walk failed; Sembo 0.5 mi cited as third-party only.",
  ]),
);

saveFactPack(
  pack("tampa-to-miami", "tampa to miami", miamiFacts, [
    "FDOT city-pair spreadsheet download Cloudflare-blocked 2026-11-02 — exact Tampa–Miami matrix miles NOT in pack.",
    "Turnpike full trip SunPass total not summed — use calculator; plaza samples included.",
    "TPA destination pages confirm MIA/FLL nonstops but do not list airline names; AA confirmed for MIA via aa.com.",
  ]),
);

saveFactPack(
  pack("kennedy-soho-tampa", "kennedy soho tampa", kennedyFacts, [
    "Open/closed status unresolved across sources — article must surface the conflict.",
    "No official live club site verified during this check.",
    "Hours disagree across directories — require call-before-you-go language.",
  ]),
);

console.log(`marriott facts: ${marriottFacts.length}`);
console.log(`miami facts: ${miamiFacts.length}`);
console.log(`kennedy facts: ${kennedyFacts.length}`);
