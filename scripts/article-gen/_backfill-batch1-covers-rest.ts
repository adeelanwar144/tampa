import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const ARTICLES = join(ROOT, "src/data/published-articles.json");
const REGISTRY = join(ROOT, "output/_used-images.json");

const ALL = [
  {
    slug: "skatepark-of-tampa",
    photoId: 32435746,
    photographer: "Pexels contributor",
    photoUrl: "https://www.pexels.com/photo/skateboarder-performing-trick-in-skate-park-32435746/",
    photographerUrl: "https://www.pexels.com/photo/skateboarder-performing-trick-in-skate-park-32435746/",
    alt: "Skateboarder performing a trick in a skate park",
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
] as const;

function insertFeatured(body: string, markdown: string): string {
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
    if (!a) throw new Error(`Missing ${j.slug}`);
    // fetch photographer from page metadata if needed — use provided
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
