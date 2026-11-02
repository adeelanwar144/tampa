/**
 * Replace wrong curated Batch B covers with verified topic-matching Pexels photos.
 * Downloads CDN images (no search API). Credits use photographer names from public photo pages.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const ARTICLES = join(ROOT, "src/data/published-articles.json");
const REGISTRY = join(ROOT, "output/_used-images.json");

type Cover = {
  slug: string;
  oldId: number;
  id: number;
  photographer: string;
  photoUrl: string;
  alt: string;
  filePrefix: string;
};

const COVERS: Cover[] = [
  {
    slug: "tampa-to-miami",
    oldId: 3849168,
    id: 6872326,
    photographer: "Quang Nguyen Vinh",
    photoUrl: "https://www.pexels.com/photo/aerial-view-of-highway-among-palm-trees-6872326/",
    alt: "Aerial view of a highway winding through palm trees on a sunny day",
    filePrefix: "florida-highway",
  },
  {
    slug: "tampa-to-fort-myers",
    oldId: 2901209,
    id: 13267133,
    photographer: "Quang Viet Nguyen",
    photoUrl: "https://www.pexels.com/photo/aerial-view-of-highway-near-the-ocean-13267133/",
    alt: "Aerial view of a coastal highway lined with palm trees beside turquoise water",
    filePrefix: "gulf-highway",
  },
  {
    slug: "tampa-rv-show",
    oldId: 269790,
    id: 34287640,
    photographer: "Viktoria B.",
    photoUrl:
      "https://www.pexels.com/photo/aerial-view-of-rv-park-with-modern-amenities-34287640/",
    alt: "Aerial view of an RV park with rows of recreational vehicles",
    filePrefix: "rv-show",
  },
  {
    slug: "trampoline-parks-tampa",
    oldId: 1634278,
    id: 6572557,
    photographer: "Tima Miroshnichenko",
    photoUrl: "https://www.pexels.com/photo/people-sport-motion-young-6572557/",
    alt: "Athlete flipping on an indoor trampoline in a gym",
    filePrefix: "trampoline-park",
  },
  {
    slug: "tampa-riverwalk-hotels",
    oldId: 1174732,
    id: 12104693,
    photographer: "Nathan Rostampour",
    photoUrl: "https://www.pexels.com/photo/sign-in-bay-12104693/",
    alt: "Downtown Tampa waterfront with modern buildings along the bay",
    filePrefix: "riverwalk-hotels",
  },
  {
    slug: "tampa-usa-zip-code",
    oldId: 2219024,
    id: 15873606,
    photographer: "craveiro_ pics",
    photoUrl: "https://www.pexels.com/photo/close-up-of-scattered-envelopes-with-postage-signs-15873606/",
    alt: "Scattered airmail envelopes and postcards with postage stamps",
    filePrefix: "postal-mail",
  },
  {
    slug: "tampa-population",
    oldId: 3467150,
    id: 38724264,
    photographer: "Vinícius Gianelli Braido",
    photoUrl: "https://www.pexels.com/photo/aerial-view-of-downtown-tampa-skyline-with-waterfront-38724264/",
    alt: "Aerial view of downtown Tampa skyline along the waterfront",
    filePrefix: "tampa-skyline",
  },
  {
    slug: "tampa-stadium-guide",
    oldId: 325185,
    id: 39590560,
    photographer: "Terrance Barksdale",
    photoUrl: "https://www.pexels.com/photo/aerial-view-of-american-football-game-in-stadium-39590560/",
    alt: "Aerial view of an American football game in a stadium",
    filePrefix: "stadium-night",
  },
];

function cdn(id: number): string {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1600`;
}

function replaceFeatured(
  body: string,
  oldId: number,
  newMd: string,
): string {
  const re = new RegExp(
    `!\\[[^\\]]*\\]\\([^)]*${oldId}[^)]*\\)\\n\\*Photo by[^*]+\\*`,
    "m",
  );
  if (re.test(body)) return body.replace(re, newMd.trim());
  // fallback: insert before first ##
  const lines = body.split("\n");
  const headingIdx = lines.findIndex((l, i) => i > 0 && /^##\s/.test(l));
  if (headingIdx > 0) {
    return `${lines.slice(0, headingIdx).join("\n").trimEnd()}\n\n${newMd}\n\n${lines.slice(headingIdx).join("\n")}`;
  }
  return `${body.trimEnd()}\n\n${newMd}\n`;
}

async function main() {
  const articles = JSON.parse(readFileSync(ARTICLES, "utf8")) as Array<Record<string, unknown>>;
  const registry = existsSync(REGISTRY)
    ? (JSON.parse(readFileSync(REGISTRY, "utf8")) as Record<string, string>)
    : {};

  for (const c of COVERS) {
    const a = articles.find((x) => x.slug === c.slug);
    if (!a) throw new Error(`Missing article ${c.slug}`);

    const imgRes = await fetch(cdn(c.id));
    if (!imgRes.ok) throw new Error(`Download ${c.id} failed ${imgRes.status}`);
    const buf = Buffer.from(await imgRes.arrayBuffer());
    const outDir = join(ROOT, "public/images/articles", c.slug);
    mkdirSync(outDir, { recursive: true });
    const fileName = `${c.filePrefix}-${c.id}.webp`;
    const outFile = join(outDir, fileName);
    await sharp(buf).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toFile(outFile);
    const coverPath = `/images/articles/${c.slug}/${fileName}`;
    const credit = `Photo by ${c.photographer} on Pexels`;
    const md = `![${c.alt}](${coverPath})\n*Photo by [${c.photographer}](${c.photoUrl}) on [Pexels](${c.photoUrl})*`;

    a.coverImage = coverPath;
    a.coverAlt = c.alt;
    a.coverCredit = credit;
    a.body = replaceFeatured(String(a.body), c.oldId, md);
    a.updatedAt = new Date().toISOString();

    // also sync output/remaining article.md if present
    const remPath = join(ROOT, "output/remaining", c.slug, "article.md");
    if (existsSync(remPath)) {
      const rem = readFileSync(remPath, "utf8");
      writeFileSync(remPath, replaceFeatured(rem, c.oldId, md), "utf8");
    }

    delete registry[String(c.oldId)];
    registry[String(c.id)] = c.slug;
    console.log(`OK ${c.slug} ${c.oldId} → ${c.id} (${c.photographer})`);
  }

  writeFileSync(ARTICLES, `${JSON.stringify(articles, null, 2)}\n`);
  writeFileSync(REGISTRY, `${JSON.stringify(registry, null, 2)}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
