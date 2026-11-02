/**
 * Add unique Pexels covers to Batch 1 articles that only use pillar defaults.
 * npx tsx scripts/article-gen/_backfill-batch1-covers.ts
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const ARTICLES = join(ROOT, "src/data/published-articles.json");
const REGISTRY = join(ROOT, "output/_used-images.json");

const JOBS = [
  {
    slug: "armature-works-tampa",
    photoId: 1581384,
    photographer: "Pixabay",
    photoUrl: "https://www.pexels.com/photo/restaurant-1684149/",
    // will verify CDN by id
    photographerUrl: "https://www.pexels.com/@pixabay/",
    alt: "Busy restaurant dining room with hanging lights",
    filePrefix: "armature",
  },
] as const;

type Job = {
  slug: string;
  photoId: number;
  photographer: string;
  photoUrl: string;
  photographerUrl: string;
  alt: string;
  filePrefix: string;
};

const ALL: Job[] = [
  {
    slug: "armature-works-tampa",
    photoId: 941861,
    photographer: "Life Of Pix",
    photoUrl: "https://www.pexels.com/photo/food-on-table-941861/",
    photographerUrl: "https://www.pexels.com/@life-of-pix/",
    alt: "Shared plates of food on a wooden restaurant table",
    filePrefix: "armature",
  },
  {
    slug: "tampa-museum-of-art",
    photoId: 1572386,
    photographer: "Pixabay",
    photoUrl: "https://www.pexels.com/photo/person-looking-at-painting-1572386/",
    photographerUrl: "https://www.pexels.com/@pixabay/",
    alt: "Visitor viewing a painting in a bright art museum gallery",
    filePrefix: "museum",
  },
  {
    slug: "tampa-to-clearwater",
    photoId: 1174732,
    photographer: "Asad Photo Maldives",
    photoUrl: "https://www.pexels.com/photo/body-of-water-1174732/",
    photographerUrl: "https://www.pexels.com/@asadphoto/",
    alt: "Clear turquoise coastal water under a sunny sky",
    filePrefix: "clearwater",
  },
  {
    slug: "tampa-to-orlando",
    photoId: 210182,
    photographer: "Pixabay",
    photoUrl: "https://www.pexels.com/photo/asphalt-empty-road-210182/",
    photographerUrl: "https://www.pexels.com/@pixabay/",
    alt: "Open highway stretching toward the horizon",
    filePrefix: "orlando-drive",
  },
  {
    slug: "barrymore-hotel-tampa",
    photoId: 271624,
    photographer: "Pixabay",
    photoUrl: "https://www.pexels.com/photo/architecture-building-business-chairs-271624/",
    photographerUrl: "https://www.pexels.com/@pixabay/",
    alt: "Hotel lobby seating area with soft lighting",
    filePrefix: "barrymore",
  },
  {
    slug: "rusty-pelican-tampa",
    photoId: 262047,
    photographer: "Pixabay",
    photoUrl: "https://www.pexels.com/photo/food-dinner-lunch-table-262047/",
    photographerUrl: "https://www.pexels.com/@pixabay/",
    alt: "Waterfront-style plated dinner on a restaurant table",
    filePrefix: "rusty-pelican",
  },
  {
    slug: "terra-gaucha-tampa",
    photoId: 323682,
    photographer: "Pixabay",
    photoUrl: "https://www.pexels.com/photo/food-plate-healthy-dinner-323682/",
    photographerUrl: "https://www.pexels.com/@pixabay/",
    alt: "Grilled meat dinner plate ready to serve",
    filePrefix: "terra-gaucha",
  },
  {
    slug: "tampa-flea-market",
    photoId: 264636,
    photographer: "Pixabay",
    photoUrl: "https://www.pexels.com/photo/fruits-and-vegetables-on-market-stall-264636/",
    photographerUrl: "https://www.pexels.com/@pixabay/",
    alt: "Outdoor market stall filled with fresh produce",
    filePrefix: "flea-market",
  },
  {
    slug: "skatepark-of-tampa",
    photoId: 176955,
    photographer: "Pixabay",
    photoUrl: "https://www.pexels.com/photo/man-doing-a-trick-on-skateboard-176955/",
    photographerUrl: "https://www.pexels.com/@pixabay/",
    alt: "Skateboarder mid-trick at a skatepark",
    filePrefix: "spot",
  },
  {
    slug: "adventure-island-tampa",
    photoId: 261327,
    photographer: "Pixabay",
    photoUrl: "https://www.pexels.com/photo/blue-and-yellow-water-slide-261327/",
    photographerUrl: "https://www.pexels.com/@pixabay/",
    alt: "Bright water slides at a sunny water park",
    filePrefix: "adventure-island",
  },
  {
    slug: "tampa-international-airport",
    photoId: 358319,
    photographer: "Pixabay",
    photoUrl: "https://www.pexels.com/photo/white-airplane-358319/",
    photographerUrl: "https://www.pexels.com/@pixabay/",
    alt: "White commercial airplane airborne against a blue sky",
    filePrefix: "tpa",
  },
  {
    slug: "international-plaza-tampa",
    photoId: 264507,
    photographer: "Pixabay",
    photoUrl: "https://www.pexels.com/photo/assorted-clothing-lot-264507/",
    photographerUrl: "https://www.pexels.com/@pixabay/",
    alt: "Retail clothing displays inside a shopping mall",
    filePrefix: "intl-plaza",
  },
  {
    slug: "florida-aquarium-tampa",
    photoId: 2156311,
    photographer: "Tom Fisk",
    photoUrl: "https://www.pexels.com/photo/school-of-fish-in-body-of-water-2156311/",
    photographerUrl: "https://www.pexels.com/@tomfisk/",
    alt: "School of fish swimming in blue aquarium water",
    filePrefix: "aquarium",
  },
];

function insertFeatured(body: string, markdown: string): string {
  if (body.includes(markdown.split("\n")[0]!)) return body;
  const lines = body.split("\n");
  const headingIdx = lines.findIndex((l, i) => i > 0 && /^##\s/.test(l));
  if (headingIdx > 0) {
    return `${lines.slice(0, headingIdx).join("\n").trimEnd()}\n\n${markdown}\n\n${lines.slice(headingIdx).join("\n")}`;
  }
  return `${body.trimEnd()}\n\n${markdown}\n`;
}

async function main() {
  const articles = JSON.parse(readFileSync(ARTICLES, "utf8")) as Array<Record<string, unknown>>;
  const registry = existsSync(REGISTRY)
    ? (JSON.parse(readFileSync(REGISTRY, "utf8")) as Record<string, string>)
    : {};

  for (const j of ALL) {
    if (registry[String(j.photoId)] && registry[String(j.photoId)] !== j.slug) {
      throw new Error(`Photo ${j.photoId} used by ${registry[String(j.photoId)]}`);
    }
    const a = articles.find((x) => x.slug === j.slug);
    if (!a) throw new Error(`Missing article ${j.slug}`);
    const cdn = `https://images.pexels.com/photos/${j.photoId}/pexels-photo-${j.photoId}.jpeg?auto=compress&cs=tinysrgb&w=1600`;
    const imgRes = await fetch(cdn);
    if (!imgRes.ok) throw new Error(`Download ${j.photoId} failed ${imgRes.status}`);
    const buf = Buffer.from(await imgRes.arrayBuffer());
    const outDir = join(ROOT, "public/images/articles", j.slug);
    mkdirSync(outDir, { recursive: true });
    const fileName = `${j.filePrefix}-${j.photoId}.webp`;
    await sharp(buf)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(join(outDir, fileName));
    const coverPath = `/images/articles/${j.slug}/${fileName}`;
    const credit = `Photo by ${j.photographer} on Pexels`;
    const md = `![${j.alt}](${coverPath})\n*Photo by [${j.photographer}](${j.photographerUrl}) on [Pexels](${j.photoUrl})*`;
    a.coverImage = coverPath;
    a.coverAlt = j.alt;
    a.coverCredit = credit;
    a.body = insertFeatured(String(a.body), md);
    a.updatedAt = new Date().toISOString();
    registry[String(j.photoId)] = j.slug;
    console.log(`OK ${j.slug} → ${coverPath}`);
  }

  writeFileSync(ARTICLES, `${JSON.stringify(articles, null, 2)}\n`);
  writeFileSync(REGISTRY, `${JSON.stringify(registry, null, 2)}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
