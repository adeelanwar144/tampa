import type { ListingContentRecord } from "./types";
import { markdownToHtml } from "./markdown";
import { headingCount, wordCount } from "./validate";

function escapeRe(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function stripPromoPrices(text: string): string {
  let t = text;
  t = t.replace(/\bwith coupon code [A-Z0-9_-]+\b/gi, "");
  t = t.replace(/\bcoupon code [A-Z0-9_-]+\b/gi, "");
  t = t.replace(/\b\d+(?:\.\d+)?%\s*off\b/gi, "a discount on");
  t = t.replace(/\ba discount on on\b/gi, "a discount on");
  t = t.replace(/\b\d+(?:\.\d+)?%\s*back\b/gi, "rewards back");
  t = t.replace(/\b(?:all )?for \$\d+(?:\.\d{2})?\b/gi, "");
  t = t.replace(
    /\b(?:on )?orders?\s+(?:of|over|under)\s+\$\d+(?:\.\d{2})?(?:\s+or more)?\b/gi,
    "on larger orders",
  );
  t = t.replace(/\bon on larger orders\b/gi, "on larger orders");
  t = t.replace(/\bfrom \$\d+(?:\.\d{2})?\b/gi, "");
  t = t.replace(/\$\d+(?:\.\d{2})?\s+/g, "");
  t = t.replace(/\$\d+(?:\.\d{2})?\b/g, "");
  t = t.replace(/\ba discount on(?=\s*[,.])/gi, "a discount");
  t = t.replace(/[ \t]{2,}/g, " ");
  t = t.replace(/ +\n/g, "\n");
  t = t.replace(/[ \t]+([,.;:!?])/g, "$1");
  t = t.replace(/,(?:[ \t]*,)+/g, ",");
  t = t.replace(/[ \t]+\./g, ".");
  t = t.replace(/\(\s*\)/g, "");
  t = t.replace(/\bincludes[ \t]+,/gi, "includes");
  return t;
}

function capitalizeBody(line: string): string {
  let out = line.replace(/^(\s*)([a-z])/, (_, space: string, letter: string) => space + letter.toUpperCase());
  out = out.replace(
    /(?<![ap]\.m)(?<![AP]\.M)([.!?])(\s+)([a-z])/g,
    (_, end: string, space: string, letter: string) => end + space + letter.toUpperCase(),
  );
  return out;
}

export function capitalizeSentences(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      if (/^\s*https?:\/\//i.test(line)) return line;
      const heading = line.match(/^(#{1,6}\s+)(.*)$/);
      if (heading) return `${heading[1]}${capitalizeBody(heading[2])}`;
      return capitalizeBody(line);
    })
    .join("\n");
}

function headingHasName(heading: string, name: string): boolean {
  const h = heading.toLowerCase();
  const n = name.toLowerCase();
  if (h.includes(n)) return true;
  return h.includes(n.replace(/&/g, "and"));
}

function stripNameFromHeading(heading: string, name: string): string {
  const variants = [name, name.replace(/&/g, "and"), name.replace(/,/g, "")].filter(
    (value, index, all) => all.indexOf(value) === index,
  );
  let next = heading;
  for (const variant of variants) {
    next = next.replace(new RegExp(escapeRe(variant), "ig"), "");
  }
  next = next
    .replace(/\s+to\s+(?:in\s+)?Tampa\b/gi, "")
    .replace(/\s+at\s+(?:in\s+)?Tampa\b/gi, "")
    .replace(/\s+in Tampa\b/gi, "")
    .replace(/\s+Tampa\b/gi, "")
    .replace(/\s+to\s*:/g, ":")
    .replace(/\s+at\s*$/i, "")
    .replace(/\s+to\s*$/i, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^[:\-\s]+|[:\-\s]+$/g, "")
    .trim();
  if (/^What to Expect(?:\s+at)?$/i.test(next) || !next) {
    if (/what to expect/i.test(heading)) return "What to Expect";
  }
  if (/^Planning Your Visit(?:\s+to)?(?::.*)?$/i.test(next) || /planning your visit/i.test(heading)) {
    const rest = next.replace(/^Planning Your Visit(?:\s+to)?\s*:?\s*/i, "").trim();
    return rest ? `Planning Your Visit: ${rest}` : "Planning Your Visit: Hours and Contact";
  }
  if (/^Tips Before You (?:Go|Stay)(?:\s+at)?$/i.test(next) || /tips before you/i.test(heading)) {
    return /stay/i.test(heading) ? "Tips Before You Stay" : "Tips Before You Go";
  }
  return next || heading;
}

export function shortenHeadings(markdown: string, name: string): string {
  let usedFullName = false;
  return markdown.replace(/^##\s+(.+)$/gm, (_, heading: string) => {
    if (!headingHasName(heading, name)) return `## ${heading.trim()}`;
    if (!usedFullName) {
      usedFullName = true;
      return `## ${heading.trim()}`;
    }
    return `## ${stripNameFromHeading(heading, name)}`;
  });
}

export function fixListingCopy(record: ListingContentRecord): ListingContentRecord {
  let markdown = stripPromoPrices(record.contentMarkdown);
  markdown = shortenHeadings(markdown, record.name);
  markdown = capitalizeSentences(markdown).trim();
  const faq = record.faq.map((item) => ({
    q: capitalizeSentences(stripPromoPrices(item.q)).trim(),
    a: capitalizeSentences(stripPromoPrices(item.a)).trim(),
  }));
  return {
    ...record,
    metaTitle: capitalizeSentences(stripPromoPrices(record.metaTitle)).trim(),
    metaDescription: capitalizeSentences(stripPromoPrices(record.metaDescription)).trim(),
    contentMarkdown: markdown,
    contentHtml: markdownToHtml(markdown),
    faq,
    wordCount: wordCount(markdown),
    headingCount: headingCount(markdown),
  };
}
