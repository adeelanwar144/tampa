import { titleFormatBlock } from "./article-type";
import type { PlannerRow } from "./types";

export const OUTPUT_CONTRACT = `OUTPUT FORMAT (required):
Return exactly three blocks, in this order, and nothing else:

<seo>
{ "slug": "...", "meta_title": "...", "meta_description": "...",
  "primary_keyword": "...", "lsi_keywords_used": [{"keyword": "...", "section": "..."}] }
</seo>

<article>
...the full article in Markdown, starting with the H1 title...
</article>

<editor_notes>
...bullet list of skipped keywords, personal touches to check, and time-sensitive details...
</editor_notes>`;

export function systemPrompt(instructions: string): string {
  return `${instructions.trim()}\n\n${OUTPUT_CONTRACT}`;
}

function lengthHint(type: PlannerRow["articleType"]): string {
  switch (type) {
    case "things-to-do":
      return "City guide: 3,000 to 4,500 words. Let the notes decide. Never pad and never invent facts to hit a word count.";
    case "practical-guide":
      return "Practical guide: 1,200 to 2,500 words. Let the notes decide. Never pad.";
    default:
      return "Neighborhood, attraction, restaurant, hotel, event or road-trip guide: 2,000 to 3,500 words. Let the notes decide. Never pad and never invent facts to hit a word count.";
  }
}

export function userPrompt(row: PlannerRow, notes: string, today: Date): string {
  const links = row.internalLinks.length > 0 ? row.internalLinks.join(", ") : "none";
  const date = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return `Write the article for this post.

Slug: ${row.slug}
Article type: ${row.articleType}
Primary keyword: ${row.primaryKeyword}
LSI / supporting keywords: ${row.lsiKeywords.join(", ") || "none"}
Related posts for internal links: ${links}
Today's date: ${date}
Length: ${lengthHint(row.articleType)}
Keep the SEO JSON compact: one short section name per LSI keyword. Do not write long LSI lists.

${titleFormatBlock(row.articleType, row.slug)}
Use that title format for the H1. Do not use research-process titles.

PERSONAL NOTES (private source material; never mention or quote them as notes in the article):
<<<NOTES
${notes.trim()}
NOTES>>>`;
}

export function revisionPrompt(failures: string[]): string {
  return `The article failed these automatic checks. Return the full corrected output in the same three-block format (<seo>, <article>, <editor_notes>) and nothing else.

Failures:
${failures.map((item) => `- ${item}`).join("\n")}`;
}

export function auditPrompt(article: string, notes: string): string {
  return `List every factual claim in the article (addresses, numbers, dates, hours, names, distances, rankings) that is not supported by the notes, or that contradicts them. Return a JSON list of {claim, problem}. Return an empty list if everything is supported. No markdown, JSON only.

ARTICLE:
${article}

NOTES:
${notes}`;
}
