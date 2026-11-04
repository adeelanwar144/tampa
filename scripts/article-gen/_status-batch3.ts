import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const slugs = [
  "tampa-beaches",
  "tampa-riverwalk",
  "shopping-centers-tampa",
  "oxford-exchange-tampa",
  "sarasota-to-tampa",
  "straz-center-tampa",
  "midflorida-amphitheatre-tampa",
  "orpheum-tampa",
  "music-shows-in-tampa",
  "tampa-bay-downs",
  "side-splitters-tampa",
  "monster-jam-tampa",
  "sheraton-tampa-brandon",
  "renaissance-tampa-international-plaza",
  "steakhouse-tampa",
  "portillos-tampa",
  "olivia-tampa",
  "ocean-prime-tampa",
  "rocca-tampa",
  "nueva-cantina-downtown-tampa",
];

let cost = 0;
for (const slug of slugs) {
  const dir = join("output/remaining", slug);
  const md = join(dir, "article.md");
  const log = join(dir, "run-log.json");
  const held = join(dir, "article.held.md");
  const pack = join(dir, "fact-pack.json");
  let status = "no-article";
  let words = 0;
  if (existsSync(md)) {
    status = "ready";
    words = readFileSync(md, "utf8").trim().split(/\s+/).length;
  } else if (existsSync(held)) status = "held";
  else if (existsSync(join(dir, "article.attempt-1.md"))) status = "attempt-only";
  else if (existsSync(pack)) status = "pack-only";
  if (existsSync(log)) {
    const j = JSON.parse(readFileSync(log, "utf8")) as { status?: string; costUsd?: number };
    cost += j.costUsd ?? 0;
    if (j.status === "held") status = "held";
    if (j.status === "passed" && existsSync(md)) status = "ready";
  }
  console.log(`${slug}\t${status}\twords=${words}`);
}
console.log(`approx_api_cost_usd\t${cost.toFixed(2)}`);
