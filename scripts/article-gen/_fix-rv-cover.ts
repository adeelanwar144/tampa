/**
 * Replace Swiss-mountain RV cover with aerial RV-park photo (topic match).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const ARTICLES = join(ROOT, "src/data/published-articles.json");
const REGISTRY = join(ROOT, "output/_used-images.json");

const slug = "tampa-rv-show";
const oldId = 20813929;
const id = 34287640;
const photographer = "Viktoria B.";
const photoUrl =
  "https://www.pexels.com/photo/aerial-view-of-rv-park-with-modern-amenities-34287640/";
const alt = "Aerial view of an RV park with rows of recreational vehicles";
const filePrefix = "rv-show";
const cdn = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1600`;

async function main() {
  const articles = JSON.parse(readFileSync(ARTICLES, "utf8")) as Array<Record<string, unknown>>;
  const a = articles.find((x) => x.slug === slug);
  if (!a) throw new Error(`Missing ${slug}`);

  const imgRes = await fetch(cdn);
  if (!imgRes.ok) throw new Error(`Download failed ${imgRes.status}`);
  const buf = Buffer.from(await imgRes.arrayBuffer());
  const outDir = join(ROOT, "public/images/articles", slug);
  mkdirSync(outDir, { recursive: true });
  const fileName = `${filePrefix}-${id}.webp`;
  await sharp(buf)
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(join(outDir, fileName));

  const coverPath = `/images/articles/${slug}/${fileName}`;
  const credit = `Photo by ${photographer} on Pexels`;
  const md = `![${alt}](${coverPath})\n*Photo by [${photographer}](${photoUrl}) on [Pexels](${photoUrl})*`;
  const re = new RegExp(
    `!\\[[^\\]]*\\]\\([^)]*${oldId}[^)]*\\)\\n\\*Photo by[^*]+\\*`,
    "m",
  );
  let body = String(a.body);
  if (!re.test(body)) throw new Error("featured block not found");
  a.body = body.replace(re, md.trim());
  a.coverImage = coverPath;
  a.coverAlt = alt;
  a.coverCredit = credit;
  a.updatedAt = new Date().toISOString();

  writeFileSync(ARTICLES, `${JSON.stringify(articles, null, 2)}\n`);
  const registry = existsSync(REGISTRY)
    ? (JSON.parse(readFileSync(REGISTRY, "utf8")) as Record<string, string>)
    : {};
  delete registry[String(oldId)];
  registry[String(id)] = slug;
  writeFileSync(REGISTRY, `${JSON.stringify(registry, null, 2)}\n`);

  // keep fix script list in sync for future audits
  console.log(`OK ${slug} ${oldId} → ${id} (${photographer}) ${coverPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
