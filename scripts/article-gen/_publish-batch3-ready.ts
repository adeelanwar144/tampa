/**
 * Publish Batch 3 articles that already passed checks (partial wave while API credits refill).
 * npx tsx scripts/article-gen/_publish-batch3-ready.ts
 */
import { spawnSync } from "node:child_process";

const jobs = [
  {
    slug: "tampa-beaches",
    query: "tampa bay beach sand shoreline palm trees",
    alt: "Sandy bay beach shoreline with calm water and palms",
    pillarCategory: "Beaches",
  },
  {
    slug: "tampa-riverwalk",
    query: "tampa riverwalk downtown waterfront path",
    alt: "Downtown Tampa Riverwalk path along the Hillsborough River",
    pillarCategory: "Outdoors, Parks & Nature",
  },
  {
    slug: "shopping-centers-tampa",
    query: "shopping mall corridor stores indoor",
    alt: "Indoor shopping center corridor with storefronts",
    pillarCategory: "Shopping",
  },
  {
    slug: "sarasota-to-tampa",
    query: "florida highway interstate palm trees drive",
    alt: "Florida highway drive under bright sky with palms",
    pillarCategory: "Transportation & Getting Around",
  },
  {
    slug: "straz-center-tampa",
    query: "performing arts theater seats empty auditorium",
    alt: "Rows of seats in a performing arts theater auditorium",
    pillarCategory: "Arts, Culture & Museums",
  },
];

for (const job of jobs) {
  const cmd = [
    "npx tsx scripts/article-gen/publish-one-remaining.ts",
    `--slug ${job.slug}`,
    `--query "${job.query}"`,
    `--alt "${job.alt}"`,
    `--pillarCategory "${job.pillarCategory}"`,
  ].join(" ");
  console.log("\n>> publishing", job.slug);
  const r = spawnSync(cmd, { stdio: "inherit", shell: true });
  if (r.status !== 0) {
    console.error("FAILED", job.slug, r.status);
    process.exit(r.status || 1);
  }
}
console.log("\nDone publishing ready Batch 3 articles.");
