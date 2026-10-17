import type { CompactListing } from "./types";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_INDEX: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

function padTime(value: string): string {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(a\.?m\.?|p\.?m\.?|am|pm)$/i);
  if (!match) return value.trim();
  const hour = Number(match[1]);
  const minute = match[2];
  const suffix = /p/i.test(match[3]) ? "p.m." : "a.m.";
  return `${hour}:${minute} ${suffix}`;
}

function expandDays(start: string, end: string | undefined): string[] {
  const from = DAY_INDEX[start.toLowerCase()];
  const to = end ? DAY_INDEX[end.toLowerCase()] : from;
  if (from === undefined || to === undefined) return [];
  const days: string[] = [];
  let i = from;
  for (let n = 0; n < 7; n += 1) {
    days.push(DAY_NAMES[i]);
    if (i === to) break;
    i = (i + 1) % 7;
  }
  return days;
}

export function hoursFromWebsiteText(text: string): Record<string, string> | undefined {
  if (!text.trim()) return undefined;
  const hours: Record<string, string> = {};
  const rangeRe =
    /((?:sun|mon|tue|wed|thu|fri|sat)[a-z]*)(?:\s*(?:-|–|—|to|through)\s*((?:sun|mon|tue|wed|thu|fri|sat)[a-z]*))?\s*[,:]?\s*(\d{1,2}:\d{2}\s*(?:a\.?m\.?|p\.?m\.?|am|pm))\s*(?:-|–|—|to)\s*(\d{1,2}:\d{2}\s*(?:a\.?m\.?|p\.?m\.?|am|pm))/gi;
  for (const match of text.matchAll(rangeRe)) {
    const span = `${padTime(match[3])}–${padTime(match[4])}`;
    for (const day of expandDays(match[1], match[2])) hours[day] = span;
  }
  if (Object.keys(hours).length >= 2) return hours;
  if (/\bopen 24 hours?\b/i.test(text)) {
    return Object.fromEntries(DAY_NAMES.map((day) => [day, "Open 24 hours"]));
  }
  return Object.keys(hours).length ? hours : undefined;
}

export function applyListingHours(listing: CompactListing): void {
  const days = listing.hours ? Object.keys(listing.hours) : [];
  if (days.length !== 1) return;
  const fromSite = listing.websiteText ? hoursFromWebsiteText(listing.websiteText) : undefined;
  if (fromSite && Object.keys(fromSite).length >= 2) {
    listing.hours = fromSite;
    return;
  }
  listing.hours = undefined;
  listing.hoursNote = "Call ahead to confirm hours";
}
