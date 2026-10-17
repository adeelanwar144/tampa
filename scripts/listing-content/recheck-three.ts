import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PATHS } from "../article-gen/env";
import { applyListingHours } from "./hours";
import { loadCachedEnrichment } from "./enrich";
import { toJob } from "./keywords";
import { loadListings } from "./listings";
import { markdownToHtml } from "./markdown";
import { getIndex, putIndex, putRecord } from "./r2";
import { scoreRichness } from "./travel";
import { applyTinyFixes, failingChecks, headingCount, runChecks, wordCount } from "./validate";

const SLUGS = ["1983-restaurant-bar-and-arcade", "another-broken-egg-cafe", "best-western-tampa"];

async function main(): Promise<void> {
  const listings = await loadListings("remote");
  const bySlug = new Map(listings.map((listing) => [listing.slug, listing]));
  let index = await getIndex();
  let allPass = true;
  for (const slug of SLUGS) {
    const listing = bySlug.get(slug);
    if (!listing) throw new Error(`missing listing ${slug}`);
    listing.websiteText = loadCachedEnrichment(slug);
    applyListingHours(listing);
    const score = scoreRichness(listing);
    if (score.tier === "thin") throw new Error(`${slug} scored thin`);
    const job = toJob(listing, score.tier);
    const rec = JSON.parse(readFileSync(join(PATHS.root, ".listing-content-cache", `${slug}.json`), "utf8")) as {
      metaTitle: string;
      metaDescription: string;
      contentMarkdown: string;
      faq: Array<{ q: string; a: string }>;
      inputHash: string;
      generatedAt: string;
      [key: string]: unknown;
    };
    const output = applyTinyFixes(
      {
        metaTitle: rec.metaTitle,
        metaDescription: rec.metaDescription,
        content: rec.contentMarkdown,
        faq: rec.faq,
      },
      listing,
    );
    const failures = failingChecks(
      runChecks(output, listing, job.primaryKeyword, `${job.compactJson}\n${listing.websiteText ?? ""}`, job.tier),
    );
    console.log(
      `${slug} ${score.tier} ${
        failures.length ? failures.map((item) => `${item.name}: ${item.detail}`).join(" | ") : "PASS"
      } words=${wordCount(output.content)}`,
    );
    if (failures.length) {
      allPass = false;
      continue;
    }
    const next = {
      ...rec,
      metaTitle: output.metaTitle,
      metaDescription: output.metaDescription,
      contentMarkdown: output.content,
      contentHtml: markdownToHtml(output.content),
      faq: output.faq,
      wordCount: wordCount(output.content),
      headingCount: headingCount(output.content),
      needsReview: false,
      reviewReasons: [],
    };
    writeFileSync(join(PATHS.root, ".listing-content-cache", `${slug}.json`), `${JSON.stringify(next, null, 2)}\n`);
    await putRecord(next as never);
    index = index.filter((entry) => entry.slug !== slug);
    index.push({
      slug,
      wordCount: next.wordCount,
      needsReview: false,
      inputHash: next.inputHash,
      generatedAt: next.generatedAt,
    });
  }
  index.sort((a, b) => a.slug.localeCompare(b.slug));
  await putIndex(index);
  console.log(`allPass ${allPass}`);
  if (!allPass) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
