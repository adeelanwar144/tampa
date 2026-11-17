import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = "content/places";
const drafts = readdirSync(join(root, "drafts")).filter((name) => name.endsWith(".md"));

function essayText(markdown) {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#>*_`]/g, " ");
}

function wordCount(markdown) {
  return essayText(markdown).split(/\s+/).filter(Boolean).length;
}

function paragraphs(markdown) {
  return markdown
    .split(/\n\s*\n/)
    .map((part) => essayText(part).replace(/\s+/g, " ").trim())
    .filter((part) => part.split(/\s+/).length >= 40);
}

function tokens(text) {
  return new Set(text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((word) => word.length > 2));
}

function numbers(text) {
  return [...text.matchAll(/\d+\.\d+|\d+/g)].map((match) => match[0]);
}

function hasBounded(blob, num) {
  const escaped = num.replace(".", "\\.");
  return new RegExp(`(?<!\\d)${escaped}(?!\\d)`).test(blob);
}

const loaded = drafts.map((file) => {
  const slug = file.replace(/\.md$/, "");
  const markdown = readFileSync(join(root, "drafts", file), "utf8");
  const pack = JSON.parse(readFileSync(join(root, "fact-packs", `${slug}.json`), "utf8"));
  const blob = pack.facts.join("\n");
  return { slug, markdown, pack, blob, words: wordCount(markdown) };
});

let failed = false;

for (const item of loaded) {
  const missing = [...new Set(numbers(essayText(item.markdown)).filter((num) => !hasBounded(item.blob, num)))];
  const title = item.pack.metaTitle;
  const description = item.pack.metaDescription;
  console.log(`\n${item.slug}: ${item.words} words | title ${title.length} | meta ${description.length}`);
  console.log(`  title: ${title}`);
  console.log(`  meta: ${description}`);
  if (item.words < 400) {
    failed = true;
    console.log("  SHORT: under 400 words");
  } else if (item.words < 750) {
    console.log("  FLAG: under the 750 target");
  }
  if (title.length > 60) {
    failed = true;
    console.log("  TITLE TOO LONG");
  }
  if (description.length < 140 || description.length > 155) {
    failed = true;
    console.log("  META LENGTH");
  }
  if (missing.length) {
    failed = true;
    console.log("  UNGROUNDED NUMBERS: " + missing.join(", "));
  }
}

const descriptions = loaded.map((item) => item.pack.metaDescription);
if (new Set(descriptions).size !== descriptions.length) {
  failed = true;
  console.log("\nDuplicate meta descriptions");
}

for (let i = 0; i < loaded.length; i++) {
  for (let j = i + 1; j < loaded.length; j++) {
    const left = paragraphs(loaded[i].markdown);
    const right = paragraphs(loaded[j].markdown);
    for (const a of left) {
      for (const b of right) {
        const A = tokens(a);
        const B = tokens(b);
        let shared = 0;
        for (const word of A) if (B.has(word)) shared++;
        const containment = shared / Math.min(A.size, B.size);
        if (containment > 0.5) {
          failed = true;
          console.log(`\nSIMILAR ${containment.toFixed(2)} ${loaded[i].slug} <> ${loaded[j].slug}`);
          console.log("A: " + a.slice(0, 220));
          console.log("B: " + b.slice(0, 220));
        }
      }
    }
  }
}

if (!failed) console.log("\nAll grounding, length, and duplicate checks passed.");
process.exit(failed ? 1 : 0);
