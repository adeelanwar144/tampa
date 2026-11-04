import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { checkGrounding } from "./grounding-check";
import { loadFactPack } from "./fact-pack";

const dir = join("output/remaining/shopping-centers-tampa");
const body = readFileSync(join(dir, "article.held.md"), "utf8");
const pack = loadFactPack("shopping-centers-tampa");
const note = readFileSync(
  "content/notes/batch-3/shopping-centers-in-tampa-florida.txt",
  "utf8",
);
const meta_title = "Shopping Centers in Tampa: Malls by Area";
const meta_description =
  "Tampa shopping centers mapped by area: International Plaza, WestShore, Brandon malls, and district shops—with hours caveats, not a ranking list.";
console.log("meta len", [...meta_description].length, "title", [...meta_title].length);
const g = checkGrounding(
  body,
  note,
  pack,
  meta_description,
  meta_title,
  "November 4, 2026\n2026-11-04\n2025\n2026\n2027\nNovember 2025\nMay 2026",
);
console.log(
  "grounding",
  g.ok,
  "words",
  g.wordCount,
  "ungrounded",
  g.ungrounded.slice(0, 8),
  "banned",
  g.bannedHits,
);
if (
  g.ok &&
  g.wordCount >= 1800 &&
  [...meta_description].length >= 140 &&
  [...meta_description].length <= 155 &&
  [...meta_title].length <= 60
) {
  writeFileSync(join(dir, "article.md"), body);
  writeFileSync(
    join(dir, "seo.json"),
    `${JSON.stringify(
      {
        meta_title,
        meta_description,
        primary_keyword: "shopping centers in tampa",
        slug: "shopping-centers-tampa",
      },
      null,
      2,
    )}\n`,
  );
  console.log("PROMOTED shopping-centers-tampa");
} else {
  console.log("not promoted");
}
