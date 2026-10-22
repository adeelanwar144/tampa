import { config } from "dotenv";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import sharp from "sharp";
import { D1_DATABASE_NAME, R2_BUCKET_NAME, ROOT } from "./lib";
import { runWrangler } from "./listing-content/wrangler-cli";

config({ path: join(ROOT, ".env") });

const MIN_WIDTH = 800;
const LOGO_RATIO = 0.14;
const MIN_LOGO = 120;
const MAX_LOGO = 260;
const MARGIN_RATIO = 0.025;
const OPACITY = 0.6;
const DARK_CORNER = 140;
const LOGO = join(ROOT, "public", "brand", "logo.png");
const LOGO_LIGHT = join(ROOT, "public", "brand", "logo-light.png");
const ARTICLES_FILE = join(ROOT, "src", "data", "published-articles.json");
const ABOUT_PAGE = join(ROOT, "src", "app", "about", "page.tsx");
const ABOUT_ORIGINAL = "/images/about/ben-hayes.webp";
const ABOUT_WM = "/images/wm/about/ben-hayes.webp";
const CACHE = join(ROOT, ".watermark-cache");
const PREVIEW = join(ROOT, ".watermark-preview");
const PEXELS_RE = /https:\/\/images\.pexels\.com\/photos\/(\d+)\/[^)\s"']+/g;
const CREDIT_RE = /\*Photo by [\s\S]*? on \[Pexels\]\([^)]+\)\*/g;

type Source = "listings" | "articles" | "site";

type Job = {
  source: Source;
  id: string;
  label: string;
  inputPath: string;
  outputRel: string;
  replaceFrom?: string;
  replaceUrls?: string[];
};

const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const force = argv.includes("--force");
const apply = argv.includes("--apply");
const sample = argv.includes("--sample");

function flagValue(name: string): string | undefined {
  const inline = argv.find((arg) => arg.startsWith(`--${name}=`));
  if (inline) return inline.slice(name.length + 3);
  const index = argv.indexOf(`--${name}`);
  const next = index >= 0 ? argv[index + 1] : undefined;
  return next && !next.startsWith("--") ? next : undefined;
}

const limit = flagValue("limit") ? Number(flagValue("limit")) : undefined;
const only = flagValue("only") as Source | undefined;

if (only && !["listings", "articles", "site"].includes(only)) {
  throw new Error("--only must be listings, articles, or site");
}
if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
  throw new Error("--limit must be a positive integer");
}

function parseWranglerJson(stdout: string): unknown {
  const start = stdout.search(/[\[{]/);
  if (start < 0) throw new Error(stdout.slice(0, 800) || "wrangler returned no JSON");
  return JSON.parse(stdout.slice(start));
}

function cloudflareToken(): string {
  const path = join(process.env.APPDATA ?? "", "xdg.config", ".wrangler", "config", "default.toml");
  if (existsSync(path)) {
    const token = readFileSync(path, "utf8").match(/oauth_token = "([^"]+)"/)?.[1];
    if (token) return token;
  }
  return process.env.CLOUDFLARE_API_TOKEN?.trim() ?? "";
}

function accountId(): string {
  return (process.env.CLOUDFLARE_ACCOUNT_ID ?? process.env.R2_ACCOUNT_ID ?? "").trim();
}

async function listListingPhotoKeys(): Promise<string[]> {
  const url = new URL(
    `https://api.cloudflare.com/client/v4/accounts/${accountId()}/r2/buckets/${R2_BUCKET_NAME}/objects`,
  );
  url.searchParams.set("per_page", "1000");
  const response = await fetch(url, { headers: { Authorization: `Bearer ${cloudflareToken()}` } });
  if (!response.ok) throw new Error(`R2 list failed (${response.status})`);
  const body = (await response.json()) as { result?: Array<{ key: string }> };
  return (body.result ?? [])
    .map((item) => item.key)
    .filter((key) => /^places\/.+\.(jpe?g|png|webp)$/i.test(key));
}

async function d1(sql: string): Promise<Record<string, unknown>[]> {
  const { stdout } = await runWrangler(
    ["d1", "execute", D1_DATABASE_NAME, "--remote", "--json", "--command", sql],
    { maxBuffer: 32 * 1024 * 1024 },
  );
  const parsed = parseWranglerJson(stdout) as Array<{ results?: Record<string, unknown>[] }>;
  return parsed[0]?.results ?? [];
}

function walkImages(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) files.push(...walkImages(path));
    else if (/\.(jpe?g|png|webp|avif)$/i.test(name)) files.push(path);
  }
  return files;
}

function isUiImage(path: string): boolean {
  const rel = relative(ROOT, path).replaceAll("\\", "/").toLowerCase();
  return (
    rel.startsWith("public/brand/") ||
    rel.startsWith("public/map-assets/") ||
    rel.startsWith("public/maplibre/") ||
    rel.includes("favicon") ||
    rel.includes("apple-touch") ||
    rel.includes("/icon-") ||
    rel.includes("opengraph") ||
    rel.includes("og-image") ||
    rel.includes("/og.")
  );
}

function unsplashUrls(): string[] {
  const files = [
    "src/data/places.ts",
    "src/data/neighborhood-photos.ts",
    "src/components/home/HomeHero.tsx",
    "src/components/home/StoryRowCard.tsx",
  ];
  const urls = new Set<string>();
  const pattern = /https:\/\/images\.unsplash\.com\/[^"'\s)]+/g;
  for (const file of files) {
    const text = readFileSync(join(ROOT, file), "utf8");
    for (const url of text.match(pattern) ?? []) urls.add(url.split("?")[0]);
  }
  return [...urls];
}

function articleImages(): Array<{ id: string; urls: string[] }> {
  const articles = JSON.parse(readFileSync(ARTICLES_FILE, "utf8")) as Array<{
    coverImage?: string;
    body?: string;
  }>;
  const byId = new Map<string, Set<string>>();
  for (const article of articles) {
    const blob = `${article.coverImage ?? ""}\n${article.body ?? ""}`;
    for (const match of blob.matchAll(PEXELS_RE)) {
      const urls = byId.get(match[1]) ?? new Set<string>();
      urls.add(match[0]);
      byId.set(match[1], urls);
    }
  }
  return [...byId.entries()].map(([id, urls]) => ({
    id,
    urls: [...urls].sort((a, b) => b.length - a.length),
  }));
}

async function inventory() {
  const images = await d1(
    "SELECT COUNT(*) AS n, SUM(CASE WHEN r2_key LIKE 'wm/%' THEN 1 ELSE 0 END) AS wm FROM place_images",
  );
  const remoteKeys = await listListingPhotoKeys();
  const remote = new Set(remoteKeys);
  const d1Keys = await d1("SELECT r2_key AS key FROM place_images WHERE r2_key NOT LIKE 'wm/%'");
  const missingFromR2 = d1Keys.filter((row) => !remote.has(String(row.key))).length;
  const articles = articleImages();
  const site = walkImages(join(ROOT, "public", "images")).filter((file) => !isUiImage(file));
  const siteEligible: string[] = [];
  const siteSmall: string[] = [];
  for (const file of site) {
    const width = (await sharp(file).metadata()).width ?? 0;
    (width >= MIN_WIDTH ? siteEligible : siteSmall).push(relative(ROOT, file));
  }
  return {
    listingsInD1: Number(images[0]?.n ?? 0),
    listingsInR2: remoteKeys.length,
    listingsMissingFromR2: missingFromR2,
    listingsAlreadyWatermarked: Number(images[0]?.wm ?? 0),
    articlePhotos: articles.length,
    articleSource: "Pexels",
    siteEligible,
    siteSmall,
    unsplashExcluded: unsplashUrls().length,
    uiSkipped: "logo, favicon, icons, map sprites",
  };
}

async function cornerStats(file: string) {
  const meta = await sharp(file).rotate().metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width < 8 || height < 8) return { width, height, mean: 0, stdev: 0 };
  const logoW = Math.min(MAX_LOGO, Math.max(MIN_LOGO, Math.round(width * LOGO_RATIO)));
  const logoH = Math.max(1, Math.round(logoW * (358 / 798)));
  const margin = Math.round(width * MARGIN_RATIO);
  const boxW = Math.min(width, logoW + margin);
  const boxH = Math.min(height, logoH + margin);
  const { data, info } = await sharp(file)
    .rotate()
    .extract({ left: width - boxW, top: height - boxH, width: boxW, height: boxH })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let sum = 0;
  let sumSq = 0;
  const pixels = info.width * info.height;
  for (let i = 0; i < data.length; i += 3) {
    const y = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    sum += y;
    sumSq += y * y;
  }
  const mean = sum / pixels;
  return { width, height, mean, stdev: Math.sqrt(Math.max(0, sumSq / pixels - mean * mean)) };
}

async function mapPool<T, R>(items: T[], size: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, () => worker()));
  return results;
}

async function downloadListing(key: string): Promise<string> {
  const dest = join(CACHE, "listings", key);
  if (existsSync(dest) && statSync(dest).size > 0) return dest;
  mkdirSync(dirname(dest), { recursive: true });
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId()}/r2/buckets/${R2_BUCKET_NAME}/objects/${encodeURIComponent(key)}`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${cloudflareToken()}` } });
  if (!response.ok) throw new Error(`R2 get ${key} failed (${response.status})`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 32) throw new Error(`empty download for ${key}`);
  writeFileSync(dest, bytes);
  return dest;
}

async function downloadUrl(url: string, dest: string): Promise<void> {
  if (existsSync(dest) && statSync(dest).size > 0) return;
  mkdirSync(dirname(dest), { recursive: true });
  const response = await fetch(url, { headers: { "user-agent": "VisitInTampa watermark preview" } });
  if (!response.ok) throw new Error(`${response.status} for ${url}`);
  writeFileSync(dest, Buffer.from(await response.arrayBuffer()));
}

function outputKeyForListing(key: string): string {
  const ext = extname(key);
  return `wm/${ext ? key.slice(0, -ext.length) : key}.webp`;
}

async function renderBadge(logoPath: string, logoW: number): Promise<{ png: Buffer; width: number; height: number }> {
  const resized = await sharp(logoPath).resize({ width: logoW }).ensureAlpha().png().toBuffer();
  const meta = await sharp(resized).metadata();
  const width = meta.width ?? logoW;
  const height = meta.height ?? Math.round(logoW * (358 / 798));
  const { data, info } = await sharp(resized).raw().toBuffer({ resolveWithObject: true });
  const fadedRaw = Buffer.from(data);
  const shadowRaw = Buffer.from(data);
  for (let i = 0; i < data.length; i += 4) {
    fadedRaw[i + 3] = Math.round(data[i + 3] * OPACITY);
    shadowRaw[i] = 8;
    shadowRaw[i + 1] = 28;
    shadowRaw[i + 2] = 32;
    shadowRaw[i + 3] = Math.round(data[i + 3] * 0.42);
  }
  const raw = { width: info.width, height: info.height, channels: 4 as const };
  const faded = await sharp(fadedRaw, { raw }).png().toBuffer();
  const sigma = Math.max(0.6, logoW / 200);
  const shadow = await sharp(shadowRaw, { raw }).blur(sigma).png().toBuffer();
  const pad = Math.ceil(sigma * 3) + 3;
  const png = await sharp({
    create: {
      width: width + pad,
      height: height + pad,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: shadow, left: 2, top: 2 },
      { input: faded, left: 0, top: 0 },
    ])
    .png()
    .toBuffer();
  return { png, width, height };
}

async function watermarkFile(input: string, output: string): Promise<{
  width: number;
  height: number;
  mean: number;
  logo: "logo-light.png" | "logo.png";
  logoWidth: number;
}> {
  const stats = await cornerStats(input);
  if (stats.width < MIN_WIDTH) throw new Error(`too small (${stats.width}px)`);
  const logoW = Math.min(MAX_LOGO, Math.max(MIN_LOGO, Math.round(stats.width * LOGO_RATIO)));
  const logoFile = stats.mean < DARK_CORNER ? LOGO_LIGHT : LOGO;
  const badge = await renderBadge(logoFile, logoW);
  const margin = Math.round(stats.width * MARGIN_RATIO);
  const badgeMeta = await sharp(badge.png).metadata();
  const badgeW = badgeMeta.width ?? badge.width;
  const badgeH = badgeMeta.height ?? badge.height;
  const left = Math.max(0, Math.min(stats.width - badge.width - margin, stats.width - badgeW));
  const top = Math.max(0, Math.min(stats.height - badge.height - margin, stats.height - badgeH));
  mkdirSync(dirname(output), { recursive: true });
  await sharp(input)
    .rotate()
    .composite([{ input: badge.png, left, top }])
    .webp({ quality: 82 })
    .toFile(output);
  return {
    width: stats.width,
    height: stats.height,
    mean: Math.round(stats.mean),
    logo: logoFile.endsWith("logo-light.png") ? "logo-light.png" : "logo.png",
    logoWidth: logoW,
  };
}

function assertCreditReplace(): void {
  const credit =
    "*Photo by [Nate Biddle](https://www.pexels.com/@nxbid0) on [Pexels](https://www.pexels.com/photo/cyclist-20739680/)*";
  const url = "https://images.pexels.com/photos/20739680/pexels-photo-20739680.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";
  const next = `![Walkers](${url})\n${credit}`.split(url).join("/images/wm/articles/20739680.webp");
  if (!next.includes(credit) || next.includes("images.pexels.com")) {
    throw new Error("Pexels credit replace check failed");
  }
}

async function svgLabel(text: string, width: number): Promise<Buffer> {
  const safe = text.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char] ?? char);
  const svg = `<svg width="${width}" height="36" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f6f1e4"/><text x="12" y="24" font-family="Arial, sans-serif" font-size="16" fill="#08343C">${safe}</text></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function writeBoard(name: string, before: string, after: string, caption: string): Promise<string> {
  const width = 1100;
  const beforeImg = await sharp(before).rotate().resize({ width, withoutEnlargement: true }).png().toBuffer();
  const afterImg = await sharp(after).resize({ width, withoutEnlargement: true }).png().toBuffer();
  const beforeMeta = await sharp(beforeImg).metadata();
  const afterMeta = await sharp(afterImg).metadata();
  const label = await svgLabel(caption, width);
  const beforeH = beforeMeta.height ?? 0;
  const afterH = afterMeta.height ?? 0;
  const out = join(PREVIEW, `${name}.png`);
  await sharp({
    create: {
      width,
      height: 36 + beforeH + 36 + afterH,
      channels: 3,
      background: "#f6f1e4",
    },
  })
    .composite([
      { input: label, top: 0, left: 0 },
      { input: beforeImg, top: 36, left: 0 },
      { input: await svgLabel(`After — ${caption}`, width), top: 36 + beforeH, left: 0 },
      { input: afterImg, top: 72 + beforeH, left: 0 },
    ])
    .png()
    .toFile(out);

  const afterMetaFull = await sharp(after).metadata();
  const cropW = Math.min(afterMetaFull.width ?? width, 520);
  const cropH = Math.min(afterMetaFull.height ?? cropW, 280);
  await sharp(after)
    .extract({
      left: (afterMetaFull.width ?? cropW) - cropW,
      top: (afterMetaFull.height ?? cropH) - cropH,
      width: cropW,
      height: cropH,
    })
    .resize({ width: 780 })
    .png()
    .toFile(join(PREVIEW, `${name}-corner.png`));
  return out;
}

async function sampleJobs(): Promise<Array<Job & { role: string }>> {
  const keys = await listListingPhotoKeys();
  console.log(`Scoring ${keys.length} listing photos for a dark, light, and busy sample...`);
  const measured = await mapPool(keys, 8, async (key) => {
    try {
      const file = await downloadListing(key);
      const stats = await cornerStats(file);
      return { key, file, ...stats, error: "" };
    } catch (error) {
      return {
        key,
        file: "",
        width: 0,
        height: 0,
        mean: 0,
        stdev: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });
  const widths = measured
    .filter((item) => !item.error)
    .map((item) => item.width)
    .sort((a, b) => a - b);
  const scored = measured.filter((item) => item.width >= MIN_WIDTH && !item.error);
  console.log(
    JSON.stringify({
      listingPhotos: measured.length,
      atLeast800: scored.length,
      narrowest: widths[0] ?? null,
      widest: widths.at(-1) ?? null,
      failed: measured.filter((item) => item.error).length,
    }),
  );

  if (scored.length < 3) {
    throw new Error(`Only ${scored.length} listing photos in R2 are at least ${MIN_WIDTH}px wide.`);
  }
  const dark = scored.reduce((best, item) => (item.mean < best.mean ? item : best));
  const light = scored.reduce((best, item) => (item.mean > best.mean ? item : best));
  // Sample picker only: a storefront photo, so the preview is not a graphic that already has a logo in the corner.
  const scene = scored.filter(
    (item) =>
      item.key !== dark.key &&
      item.key !== light.key &&
      /\/(mobil|holiday-inn|maureen|hancock|gte-financial|insurance-direct|lorenzo)\//.test(item.key),
  );
  const busy = (scene.length ? scene : scored.filter((item) => item.key !== dark.key && item.key !== light.key)).reduce(
    (best, item) => (item.stdev > best.stdev ? item : best),
  );

  const article = articleImages()[0];
  const articlePath = join(CACHE, "articles", `${article.id}.jpg`);
  await downloadUrl(article.urls[0], articlePath);
  const about = join(ROOT, "public", "images", "about", "ben-hayes.webp");

  return [
    { role: "listing-dark", source: "listings", id: dark.key, label: dark.key, inputPath: dark.file, outputRel: outputKeyForListing(dark.key) },
    { role: "listing-light", source: "listings", id: light.key, label: light.key, inputPath: light.file, outputRel: outputKeyForListing(light.key) },
    { role: "listing-busy", source: "listings", id: busy.key, label: busy.key, inputPath: busy.file, outputRel: outputKeyForListing(busy.key) },
    {
      role: "article",
      source: "articles",
      id: article.id,
      label: article.urls[0],
      inputPath: articlePath,
      outputRel: `images/wm/articles/${article.id}.webp`,
      replaceFrom: article.urls[0],
      replaceUrls: article.urls,
    },
    {
      role: "site-about",
      source: "site",
      id: ABOUT_ORIGINAL,
      label: ABOUT_ORIGINAL,
      inputPath: about,
      outputRel: "images/wm/about/ben-hayes.webp",
    },
  ];
}

function sqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

async function applyReferences(
  done: Array<{ source: Source; from?: string; urls?: string[]; to: string }>,
): Promise<void> {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = join(ROOT, "db", "backups");
  mkdirSync(backupDir, { recursive: true });

  const listingUpdates = done.filter((item) => item.source === "listings" && item.from && item.to);
  if (listingUpdates.length) {
    const backup = join(backupDir, `d1-before-watermark-${stamp}.sql`);
    await runWrangler(["d1", "export", D1_DATABASE_NAME, "--remote", "--output", backup], {
      maxBuffer: 64 * 1024 * 1024,
    });
    const sqlFile = join(backupDir, `watermark-update-${stamp}.sql`);
    writeFileSync(
      sqlFile,
      `${listingUpdates
        .map((item) => `UPDATE place_images SET r2_key = ${sqlString(item.to)} WHERE r2_key = ${sqlString(item.from!)};`)
        .join("\n")}\n`,
    );
    await runWrangler(["d1", "execute", D1_DATABASE_NAME, "--remote", "--file", sqlFile]);
  }

  const articleUpdates = done.filter((item) => item.source === "articles" && item.from);
  if (articleUpdates.length) {
    const backup = join(backupDir, `published-articles-${stamp}.json`);
    copyFileSync(ARTICLES_FILE, backup);
    const before = readFileSync(ARTICLES_FILE, "utf8");
    const credits = before.match(CREDIT_RE) ?? [];
    const coverCredits = [...before.matchAll(/"coverCredit": "([^"]*)"/g)].map((match) => match[1]);
    let next = before;
    const replacements = new Map<string, string>();
    for (const item of articleUpdates) {
      for (const url of item.urls ?? (item.from ? [item.from] : [])) replacements.set(url, `/${item.to}`);
    }
    for (const [url, target] of [...replacements.entries()].sort((a, b) => b[0].length - a[0].length)) {
      next = next.split(url).join(target);
    }
    const creditsAfter = next.match(CREDIT_RE) ?? [];
    const coverAfter = [...next.matchAll(/"coverCredit": "([^"]*)"/g)].map((match) => match[1]);
    if (credits.join("\n") !== creditsAfter.join("\n") || coverCredits.join("\n") !== coverAfter.join("\n")) {
      throw new Error("Article credit text changed. References were not saved.");
    }
    writeFileSync(ARTICLES_FILE, next);
  }

  if (done.some((item) => item.source === "site" && item.to.endsWith("images/wm/about/ben-hayes.webp"))) {
    const source = readFileSync(ABOUT_PAGE, "utf8");
    if (!source.includes(`const ABOUT_IMAGE = "${ABOUT_ORIGINAL}";`)) {
      throw new Error("About page no longer uses the original image constant. It was not edited.");
    }
    const edited = source
      .replace(
        `const ABOUT_IMAGE = "${ABOUT_ORIGINAL}";`,
        `const ABOUT_OG_IMAGE = "${ABOUT_ORIGINAL}";\nconst ABOUT_IMAGE = "${ABOUT_WM}";`,
      )
      .replace("url: ABOUT_IMAGE,", "url: ABOUT_OG_IMAGE,")
      .replace("images: [ABOUT_IMAGE],", "images: [ABOUT_OG_IMAGE],");
    if (!edited.includes(ABOUT_WM) || !edited.includes("ABOUT_OG_IMAGE")) {
      throw new Error("About page edit did not apply.");
    }
    writeFileSync(ABOUT_PAGE, edited);
  }
}

async function uploadListing(key: string, file: string): Promise<void> {
  const bytes = readFileSync(file);
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId()}/r2/buckets/${R2_BUCKET_NAME}/objects/${encodeURIComponent(key)}`;
  const headers = { Authorization: `Bearer ${cloudflareToken()}` };
  const put = await fetch(url, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "image/webp" },
    body: bytes,
  });
  if (!put.ok) throw new Error(`R2 put ${key} failed (${put.status}) ${(await put.text()).slice(0, 180)}`);
  const got = await fetch(url, { headers });
  if (!got.ok) throw new Error(`R2 verify ${key} failed (${got.status})`);
  const remoteSize = Buffer.from(await got.arrayBuffer()).length;
  if (remoteSize !== bytes.length) throw new Error(`upload verification failed for ${key}`);
}

async function allJobs(): Promise<Job[]> {
  const jobs: Job[] = [];
  if (!only || only === "listings") {
    for (const key of await listListingPhotoKeys()) {
      jobs.push({ source: "listings", id: key, label: key, inputPath: "", outputRel: outputKeyForListing(key) });
    }
  }
  if (!only || only === "articles") {
    for (const image of articleImages()) {
      jobs.push({
        source: "articles",
        id: image.id,
        label: image.urls[0],
        inputPath: join(CACHE, "articles", `${image.id}.jpg`),
        outputRel: `images/wm/articles/${image.id}.webp`,
        replaceFrom: image.urls[0],
        replaceUrls: image.urls,
      });
    }
  }
  if (!only || only === "site") {
    for (const file of walkImages(join(ROOT, "public", "images"))) {
      const rel = relative(join(ROOT, "public", "images"), file).replaceAll("\\", "/");
      if (rel.startsWith("wm/") || isUiImage(file)) continue;
      jobs.push({
        source: "site",
        id: `/images/${rel}`,
        label: `/images/${rel}`,
        inputPath: file,
        outputRel: `images/wm/${rel.replace(/\.[^.]+$/, ".webp")}`,
      });
    }
  }
  return limit ? jobs.slice(0, limit) : jobs;
}

function publishedPath(job: Job): string {
  return job.source === "listings" ? join(CACHE, "out", job.outputRel) : join(ROOT, "public", job.outputRel);
}

async function main(): Promise<void> {
  assertCreditReplace();
  const counts = await inventory();
  console.log(JSON.stringify(counts, null, 2));
  if (dryRun || (!sample && limit === undefined && !apply)) {
    console.log("Dry check only. No copies were written. Use --sample to preview five images, or --apply to watermark and publish.");
    return;
  }
  if (sample && apply) throw new Error("--sample only writes local previews. Approve them before --apply.");

  if (sample) {
    const jobs = (only ? (await sampleJobs()).filter((job) => job.source === only) : await sampleJobs()).slice(
      0,
      limit ?? undefined,
    );
    mkdirSync(PREVIEW, { recursive: true });
    const report: unknown[] = [];
    for (const job of jobs) {
      const output = join(PREVIEW, "out", job.outputRel);
      const result = await watermarkFile(job.inputPath, output);
      const board = await writeBoard(
        job.role,
        job.inputPath,
        output,
        `${job.role} · ${result.logo} · corner ${result.mean} · ${result.logoWidth}px`,
      );
      report.push({ role: job.role, status: "preview", ...result, label: job.label, board, output });
      console.log(`Preview ${job.role}: ${result.logo} on a corner brightness of ${result.mean}`);
    }
    writeFileSync(join(PREVIEW, "sample-report.json"), JSON.stringify(report, null, 2));
    console.log(`Wrote previews to ${PREVIEW}`);
    console.log("Originals, R2, D1, and article files were not changed.");
    return;
  }

  const jobs = await allJobs();
  const done: Array<{ source: Source; from?: string; urls?: string[]; to: string }> = [];
  const report = { watermarked: 0, skippedSmall: 0, skippedExists: 0, failed: [] as string[] };
  console.log(`Processing ${jobs.length} images...`);
  let finished = 0;
  await mapPool(jobs, 4, async (job) => {
    const output = apply ? publishedPath(job) : join(PREVIEW, "out", job.outputRel);
    const record = { source: job.source, from: job.replaceFrom ?? job.id, urls: job.replaceUrls, to: job.outputRel };
    try {
      if (existsSync(output) && !force) {
        if (apply && job.source === "listings") await uploadListing(job.outputRel, output);
        report.skippedExists += 1;
        if (apply) done.push(record);
      } else {
        if (job.source === "listings") job.inputPath = await downloadListing(job.id);
        if (job.source === "articles") await downloadUrl(job.label, job.inputPath);
        const stats = await cornerStats(job.inputPath);
        if (stats.width < MIN_WIDTH) {
          report.skippedSmall += 1;
        } else {
          await watermarkFile(job.inputPath, output);
          if (apply && job.source === "listings") await uploadListing(job.outputRel, output);
          report.watermarked += 1;
          done.push(record);
        }
      }
    } catch (error) {
      report.failed.push(`${job.label}: ${error instanceof Error ? error.message : String(error)}`);
    }
    finished += 1;
    if (finished % 10 === 0 || finished === jobs.length) console.log(`  ${finished}/${jobs.length}`);
  });
  if (apply) await applyReferences(done);
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(join(CACHE, "watermark-report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
