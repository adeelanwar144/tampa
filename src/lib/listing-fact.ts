/** One short fact from a listing essay, using only sentences that are already on the page. */
export function extractListingFact(html: string, placeName: string): string {
  const sentences = introSentences(html);
  const name = placeName.replace(/\s+/g, " ").trim().toLowerCase();
  const ranked = sentences
    .map((sentence, index) => ({ sentence, score: scoreSentence(sentence, index, name) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.sentence.length - b.sentence.length);
  const best = ranked[0]?.sentence ?? hoursFallback(sentences);
  if (!best) return "";
  const fact = condenseFact(best, 110);
  if (!fact || /^(which|that|before|if|and|but)\b/i.test(fact)) return "";
  return fact;
}

function hoursFallback(sentences: string[]): string {
  return (
    sentences.find((sentence) =>
      /\b(24 hours|seven days|days a week|a\.m\.|p\.m\.)\b/i.test(sentence) &&
      !/\b(call ahead|hours can change|phone)\b/i.test(sentence),
    ) ?? ""
  );
}

function introSentences(html: string): string[] {
  const intro = html.split(/<h2\b/i)[0] ?? html;
  const text = decodeEntities(intro)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text
    .split(/(?<=\d[.!?])\s+(?=[A-Z])|(?<=[A-Za-z]{3}[.!?])\s+(?=[A-Z])/)
    .map((sentence) => sentence.replace(/\s+/g, " ").trim())
    .filter((sentence) => sentence.length >= 36);
}

function scoreSentence(sentence: string, index: number, name: string): number {
  const lower = sentence.toLowerCase();
  if (/\b\d{3}[-.)\s]\d{3}/.test(sentence)) return 0;
  if (/\b(call ahead|hours can change|current hours|located at|sits in|website at|https?:|www\.)\b/i.test(sentence)) {
    return 0;
  }
  if (/\bat\s+\d{1,6}\b/i.test(sentence) && /\b(?:hwy|ave|blvd|st|rd|dr|way|pkwy)\b/i.test(sentence)) {
    return 0;
  }
  if (/\b(practical option|straightforward option to consider)\b/i.test(sentence)) return 0;
  if (/\b(open 24|24 hours|seven days|days a week|a\.m\.|p\.m\.|every day of the week)\b/i.test(sentence)) {
    return 0;
  }
  if (/^(whether you|if you|before |because |which |the hours)\b/i.test(sentence)) return 0;
  if (/\b(confirm the details|call before|best confirmed|hours are a useful)\b/i.test(sentence)) return 0;
  let score = 1;
  if (index < 6) score += 2;
  if (index === 0 && name && lower.startsWith(name.slice(0, Math.min(18, name.length)))) score -= 2;
  if (/\b(broad range|good choice|eclectic|something for everyone|also available|ask your|practical option)\b/i.test(sentence)) {
    score -= 4;
  }
  if (/\b(examples include|such as|known for|house-made|homemade)\b/i.test(sentence)) score += 8;
  if (/\bother businesses in\b/i.test(sentence) && /\binclude\b/i.test(sentence)) score += 8;
  if (
    /\b(mediterranean|italian|mexican|chinese|vietnamese|cuban|greek|thai|indian|japanese|korean|seafood|barbecue|pizza|sushi|wine list|grouper|eggplant)\b/i.test(
      sentence,
    )
  ) {
    score += 4;
  }
  if (
    /\b(menu|wine|cocktail|reservation|suite|pool|breakfast|lunch|dinner|catering|gluten|coffee|pizza|seafood|grill|bakery|grocery|pharmacy|salon|spa|bar|rooms?)\b/i.test(
      sentence,
    )
  ) {
    score += 3;
  }
  if (/\b(?:over\s+)?\d+\s+years\b/i.test(sentence)) score += 3;
  if (/describes itself/i.test(sentence)) score -= 2;
  if (sentence.length >= 40 && sentence.length <= 150) score += 2;
  if (sentence.length > 200) score -= 1;
  return score;
}

const FACT_SIGNAL =
  /\b(examples include|such as|known for|house-made|homemade|mediterranean|italian|mexican|chinese|vietnamese|cuban|greek|thai|indian|japanese|korean|seafood|barbecue|pizza|sushi|wine|grouper|eggplant|24 hours|suite|pool|reservation|gluten)\b/i;

function condenseFact(sentence: string, max: number): string {
  let value = sentence.replace(/[.!?]+$/g, "").replace(/\s+/g, " ").trim();
  if (value.length <= max) return value;
  const parts = value.split(/,\s+|;\s+|\s+and\s+/i);
  const signaled = parts
    .map((part) => part.trim())
    .filter((part) => FACT_SIGNAL.test(part) && part.length >= 24 && part.length <= max)
    .sort((a, b) => b.length - a.length)[0];
  if (signaled) return signaled;
  let built = "";
  for (const part of parts) {
    const next = built ? `${built}, ${part}` : part;
    if (next.length > max) break;
    built = next;
  }
  if (built.length >= 36) return built;
  const clipped = value.slice(0, max);
  const space = clipped.lastIndexOf(" ");
  const cut = (space >= 36 ? clipped.slice(0, space) : clipped).replace(/[\s,;:]+$/g, "");
  return cut.length >= 36 ? cut : "";
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}
