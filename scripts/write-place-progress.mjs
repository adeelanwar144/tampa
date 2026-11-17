import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const thin = JSON.parse(readFileSync("content/places/thin-places.json", "utf8"));
const operating = JSON.parse(readFileSync("content/places/operating-status.json", "utf8"));
const bySlug = new Map(operating.map((row) => [row.slug, row]));
function essayWords(slug) {
  const markdown = readFileSync(join("content/places/drafts", `${slug}.md`), "utf8");
  const text = markdown.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[#>*_`]/g, " ");
  return text.split(/\s+/).filter(Boolean).length;
}

const published = {
  test: ["the-study", "cappys-pizza-2", "your-mechanic-813", "hancock-whitney", "life-essentials-refillery"],
  "1": [
    "china-wok",
    "franks-formal-wear",
    "greco-and-wozniak-p-a",
    "greenfield-medicine-tampa",
    "health-mutt",
    "holiday-inn-tampa-westshore-airport-area",
    "house-of-legends-barbershop",
    "hyde-park-veterinary-clinic",
    "interbay-meat-market",
    "jazmin-thobe",
    "jkang-legal-p-a",
    "kampsen-hearing",
    "koto-japanese-steakhouse",
    "la-faraona-cigars",
    "lafrance-family-law",
  ],
};
const publishedBatch = new Map();
for (const [batch, slugs] of Object.entries(published)) {
  for (const slug of slugs) publishedBatch.set(slug, batch);
}

function csv(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const lines = ["slug,status,words,batch"];
const tally = { open: 0, unclear: 0, "likely closed": 0, other: 0 };
for (const row of thin) {
  const mark = bySlug.get(row.slug)?.operating || "missing";
  tally[mark] = (tally[mark] || 0) + 1;
  let status = "pending";
  let words = row.words;
  let batch = "";
  if (mark === "likely closed") status = "likely-closed";
  else if (mark === "unclear") status = "unclear";
  if (publishedBatch.has(row.slug)) {
    status = "published";
    words = essayWords(row.slug);
    batch = publishedBatch.get(row.slug);
  }
  lines.push([row.slug, status, words, batch].map(csv).join(","));
}
writeFileSync("content/places/progress.csv", lines.join("\n") + "\n");

function countBy(rows, key) {
  const map = new Map();
  for (const row of rows) {
    const label = row[key] || "(none)";
    map.set(label, (map.get(label) || 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

console.log("thin", thin.length);
console.log("operating", tally);
console.log("category", countBy(thin, "category"));
console.log("neighborhood", countBy(thin, "neighborhood"));
console.log("city", countBy(thin, "city"));
console.log("progress rows", lines.length - 1);
