/**
 * Restore specific stand-in links to live hub URLs after Batch C publish.
 * npx tsx scripts/article-gen/_restore-hub-links.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ARTICLES = join(process.cwd(), "src/data/published-articles.json");

const EXACT: Array<{ slug: string; from: string; to: string }> = [
  {
    slug: "marriott-water-street-tampa",
    from: "[Tampa hotels overview](/guides/tampa-riverwalk-hotels)",
    to: "[Tampa hotels overview](/guides/tampa-hotels)",
  },
  {
    slug: "tampa-usa-zip-code",
    from: "[Tampa Florida overview](/guides/tampa-population)",
    to: "[Tampa Florida overview](/guides/tampa-florida-overview)",
  },
  {
    slug: "tampa-population",
    from: "see also my notes on Tampa Florida in the population deep-dive",
    to: "see also my notes on Tampa Florida in the population deep-dive",
  },
];

/** Markdown link targets only (full ](url) forms) */
const LINK_SWAPS: Array<[string, string]> = [
  ["](/guides/tampa-florida-overview)", "](/guides/tampa-florida-overview)"], // keep
];

function main() {
  const articles = JSON.parse(readFileSync(ARTICLES, "utf8")) as Array<{
    slug: string;
    status: string;
    body?: string;
  }>;
  let n = 0;

  for (const rule of EXACT) {
    if (rule.from === rule.to) continue;
    const a = articles.find((x) => x.slug === rule.slug);
    if (!a?.body?.includes(rule.from)) continue;
    a.body = a.body.split(rule.from).join(rule.to);
    console.log(`OK ${rule.slug}`);
    n++;
  }

  // Restore overview links that were pointed at population as stand-in
  for (const a of articles) {
    if (a.status !== "published" || !a.body) continue;
    const pairs: [string, string][] = [
      [
        "[Tampa Florida overview](/guides/tampa-population)",
        "[Tampa Florida overview](/guides/tampa-florida-overview)",
      ],
      [
        "[tampa florida overview](/guides/tampa-population)",
        "[tampa florida overview](/guides/tampa-florida-overview)",
      ],
      [
        "[Tampa hotels](/guides/tampa-riverwalk-hotels)",
        "[Tampa hotels](/guides/tampa-hotels)",
      ],
      [
        "[Tampa hotels overview](/guides/tampa-riverwalk-hotels)",
        "[Tampa hotels overview](/guides/tampa-hotels)",
      ],
      [
        "[Tampa attractions](/things-to-do/things-to-do-in-tampa)",
        "[Tampa attractions](/things-to-do/tampa-attractions)",
      ],
      ["[Tampa events](/events)", "[Tampa events](/events/tampa-events)"],
      ["[tampa events](/events)", "[tampa events](/events/tampa-events)"],
      [
        "[Tampa restaurants](/food-and-drink)",
        "[Tampa restaurants](/food-and-drink/tampa-restaurants)",
      ],
      [
        "[Tampa area code](/guides/tampa-usa-zip-code)",
        "[Tampa area code](/guides/tampa-area-code)",
      ],
      [
        "[Tampa Convention Center](/guides/marriott-water-street-tampa)",
        "[Tampa Convention Center](/guides/tampa-convention-center)",
      ],
    ];
    let body = a.body;
    let changed = false;
    for (const [from, to] of pairs) {
      if (body.includes(from)) {
        body = body.split(from).join(to);
        changed = true;
      }
    }
    if (changed) {
      a.body = body;
      n++;
      console.log(`Swaps in ${a.slug}`);
    }
  }

  writeFileSync(ARTICLES, `${JSON.stringify(articles, null, 2)}\n`);
  console.log(`changes=${n}`);
}

main();
