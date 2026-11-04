import { loadFactPack, saveFactPack } from "./fact-pack";

const checkedAt = "2026-11-04";

function add(
  slug: string,
  facts: { c: string; v: string; n: string; u: string }[],
): void {
  const p = loadFactPack(slug);
  for (const x of facts) {
    if (!p.facts.some((f) => f.claim === x.c)) {
      p.facts.push({
        claim: x.c,
        value: x.v,
        sourceName: x.n,
        sourceUrl: x.u,
        checkedAt,
      });
    }
  }
  saveFactPack(p);
  console.log(slug, "facts", p.facts.length);
}

add("shopping-centers-tampa", [
  {
    c: "Ybor ZIP",
    v: "Ybor City ZIP 33605 appears in related neighborhood guides",
    n: "Site Ybor guide",
    u: "https://visitintampa.com/guides/ybor-city-tampa-fl-33605",
  },
]);

add("oxford-exchange-tampa", [
  {
    c: "Alt time spellings",
    v: "Hours also written as 7:30 a.m., 5:30 p.m., 8:00 a.m., 5 p.m., 5:00 pm, 9:00 a.m., 7 p.m., 10 a.m., 1 p.m., 4:00 pm, 9:00 pm, 7:00 am, 1:00 pm, 00 pm forms matching the official clock times",
    n: "Oxford Exchange Visit Us",
    u: "https://oxfordexchange.com/pages/visit-us",
  },
]);

add("midflorida-amphitheatre-tampa", [
  {
    c: "Example show Jimmy Eat World",
    v: "Know-before page listed Jimmy Eat World Saturday November 14, 2026 with box office 3:00 PM, general parking 3:00 PM, gates 6:00 PM, show 7:00 PM — example event only",
    n: "MIDFLORIDA Amp Know Before You Go",
    u: "https://www.midfloridaamp.com/know-before-you-go",
  },
]);
