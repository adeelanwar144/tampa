/**
 * Straz 301 prep + inbound links for published Batch 3 articles.
 * npx tsx scripts/article-gen/_batch3-straz-inbound.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const ARTICLES = join(ROOT, "src/data/published-articles.json");
const REDIRECTS = join(ROOT, "src/config/article-redirects.ts");

type Art = { slug: string; body?: string; status?: string; title?: string };

function main() {
  let redirects = readFileSync(REDIRECTS, "utf8");
  if (!redirects.includes("/things-to-do/tbpac-tampa")) {
    redirects = redirects.replace(
      "export const ARTICLE_REDIRECTS",
      `// tbpac → straz merge added in Batch 3
export const ARTICLE_REDIRECTS`,
    );
    // insert redirect entry after opening bracket of array
    redirects = redirects.replace(
      "export const ARTICLE_REDIRECTS: { source: string; destination: string; statusCode: 301 }[] = [",
      `export const ARTICLE_REDIRECTS: { source: string; destination: string; statusCode: 301 }[] = [
  {
    source: "/things-to-do/tbpac-tampa",
    destination: "/things-to-do/straz-center-tampa",
    statusCode: 301,
  },`,
    );
    writeFileSync(REDIRECTS, redirects);
    console.log("added tbpac → straz 301");
  } else {
    console.log("tbpac redirect already present");
  }

  const articles = JSON.parse(readFileSync(ARTICLES, "utf8")) as Art[];
  const tbpac = articles.find((a) => a.slug === "tbpac-tampa");
  if (tbpac) {
    tbpac.status = "draft";
    console.log("tbpac-tampa set to draft (replaced by straz-center-tampa)");
  }

  let linkSwaps = 0;
  for (const a of articles) {
    if (!a.body) continue;
    const before = a.body;
    a.body = a.body
      .split("](/things-to-do/tbpac-tampa)")
      .join("](/things-to-do/straz-center-tampa)")
      .split("TBPAC Tampa")
      .join("Straz Center Tampa");
    // only count path swaps
    if (before.includes("](/things-to-do/tbpac-tampa)")) {
      linkSwaps += before.split("](/things-to-do/tbpac-tampa)").length - 1;
    }
  }
  console.log(`rewrote ${linkSwaps} tbpac path links`);

  /** Inbound: insert one sentence+link into existing articles if missing */
  const inbounds: Array<{ host: string; needle: string; insertAfter: string; html: string }> = [
    {
      host: "tampa-to-clearwater",
      needle: "/outdoors-beaches/tampa-beaches",
      insertAfter: "## ",
      html: `If you meant a bay beach inside Tampa city limits rather than the Gulf, start with my [Tampa beaches](/outdoors-beaches/tampa-beaches) guide before you drive west.\n\n`,
    },
    {
      host: "tampa-attractions",
      needle: "/outdoors-beaches/tampa-beaches",
      insertAfter: "Riverwalk",
      html: "",
    },
  ];

  function ensureLink(hostSlug: string, path: string, sentence: string) {
    const a = articles.find((x) => x.slug === hostSlug);
    if (!a?.body) {
      console.warn("missing host", hostSlug);
      return;
    }
    if (a.body.includes(path)) {
      console.log(`skip ${hostSlug} already links ${path}`);
      return;
    }
    // insert before FAQ if present, else at end before last paragraph
    if (a.body.includes("\n## FAQ")) {
      a.body = a.body.replace("\n## FAQ", `\n${sentence}\n## FAQ`);
    } else {
      a.body = `${a.body.trimEnd()}\n\n${sentence}\n`;
    }
    console.log(`inbound ${hostSlug} → ${path}`);
  }

  ensureLink(
    "tampa-to-clearwater",
    "/outdoors-beaches/tampa-beaches",
    `If you wanted a city bay beach instead of the Gulf, I keep those separate in my [Tampa beaches](/outdoors-beaches/tampa-beaches) guide.`,
  );
  ensureLink(
    "florida-aquarium-tampa",
    "/outdoors-beaches/tampa-beaches",
    `For sand inside city limits, see [Tampa beaches](/outdoors-beaches/tampa-beaches) — they are bay beaches, not a Gulf strand.`,
  );
  ensureLink(
    "tampa-riverwalk-hotels",
    "/outdoors-beaches/tampa-riverwalk",
    `For the path itself (not the hotels), use my [Tampa Riverwalk](/outdoors-beaches/tampa-riverwalk) guide.`,
  );
  ensureLink(
    "ulele-tampa",
    "/outdoors-beaches/tampa-riverwalk",
    `Ulele sits on the [Tampa Riverwalk](/outdoors-beaches/tampa-riverwalk), which is the path I walk when I am downtown without a ticketed plan.`,
  );
  ensureLink(
    "international-plaza-tampa",
    "/shopping/shopping-centers-tampa",
    `For how International Plaza sits among other [shopping centers in Tampa](/shopping/shopping-centers-tampa), I keep a citywide directory.`,
  );
  ensureLink(
    "tampa-flea-market",
    "/shopping/shopping-centers-tampa",
    `If you want malls instead of open-air market shopping, jump to [shopping centers in Tampa](/shopping/shopping-centers-tampa).`,
  );
  ensureLink(
    "tampa-to-fort-myers",
    "/getting-around/sarasota-to-tampa",
    `A shorter Gulf-coast hop is [Sarasota to Tampa](/getting-around/sarasota-to-tampa) at 52 FDOT miles.`,
  );
  ensureLink(
    "tampa-to-naples",
    "/getting-around/sarasota-to-tampa",
    `Sarasota sits between the two on the same I-75 idea — see [Sarasota to Tampa](/getting-around/sarasota-to-tampa).`,
  );
  ensureLink(
    "tampa-theatre",
    "/things-to-do/straz-center-tampa",
    `For Broadway-scale downtown shows, the campus next door in the arts conversation is the [Straz Center](/things-to-do/straz-center-tampa).`,
  );
  ensureLink(
    "tampa-attractions",
    "/things-to-do/straz-center-tampa",
    `Performing arts downtown usually means the [Straz Center](/things-to-do/straz-center-tampa) (formerly searched as TBPAC).`,
  );
  ensureLink(
    "tampa-attractions",
    "/outdoors-beaches/tampa-riverwalk",
    `The free waterfront spine is the [Tampa Riverwalk](/outdoors-beaches/tampa-riverwalk).`,
  );
  ensureLink(
    "tampa-florida-overview",
    "/outdoors-beaches/tampa-beaches",
    `City bay beaches are covered in [Tampa beaches](/outdoors-beaches/tampa-beaches); Gulf sand is a Pinellas drive.`,
  );

  writeFileSync(ARTICLES, `${JSON.stringify(articles, null, 2)}\n`);
  console.log("wrote published-articles.json");
}

main();
