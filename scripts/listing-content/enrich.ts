import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../lib";
import type { CompactListing } from "./types";

const CACHE_DIR = join(ROOT, ".listing-content-cache", "enrichment");
const TIMEOUT_MS = 10_000;
const HOST_GAP_MS = 1_000;
const MAX_WORDS = 1_500;
const USER_AGENT = "TampaBayGuideBot/1.0 (+https://tampabayguide.com)";

const PAGE_HINTS = [
  "about",
  "menu",
  "rooms",
  "room",
  "amenities",
  "amenity",
  "accommodation",
  "accommodations",
  "dining",
  "our-story",
  "ourstory",
  "guest-rooms",
  "suites",
  "facilities",
  "food",
  "drink",
  "hours",
];

type Robots = { allow: string[]; disallow: string[] };

const lastHit = new Map<string, number>();
const robotsCache = new Map<string, Robots | null>();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function wordList(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

function clipWords(text: string, max: number): string {
  const words = wordList(text);
  if (words.length <= max) return words.join(" ");
  return words.slice(0, max).join(" ");
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function htmlToText(html: string): string {
  let s = html.replace(/<head[\s\S]*?<\/head>/gi, " ");
  s = s.replace(/<script[\s\S]*?<\/script>/gi, " ");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, " ");
  s = s.replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  s = s.replace(/<svg[\s\S]*?<\/svg>/gi, " ");
  s = s.replace(/<iframe[\s\S]*?<\/iframe>/gi, " ");
  s = s.replace(/<(nav|footer|header|aside)[\s\S]*?<\/\1>/gi, " ");
  s = s.replace(
    /<[^>]+(?:id|class)=["'][^"']*(cookie|consent|gdpr|banner|newsletter|promo-bar|site-nav)[^"']*["'][^>]*>[\s\S]*?<\/[a-z0-9]+>/gi,
    " ",
  );
  s = s.replace(/<(br|hr)\s*\/?>/gi, "\n");
  s = s.replace(/<\/(p|div|li|h1|h2|h3|tr|section|article)>/gi, "\n");
  s = s.replace(/<[^>]+>/g, " ");
  s = decodeEntities(s);
  s = s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ");
  return s.trim();
}

function parseRobots(text: string): Robots {
  const allow: string[] = [];
  const disallow: string[] = [];
  let applies = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key === "user-agent") {
      applies = value === "*" || /tampabayguide/i.test(value);
      continue;
    }
    if (!applies) continue;
    if (key === "disallow" && value) disallow.push(value);
    if (key === "allow" && value) allow.push(value);
  }
  return { allow, disallow };
}

function pathMatches(pattern: string, path: string): boolean {
  if (!pattern) return false;
  if (pattern === "/") return true;
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}`).test(path);
}

function allowedByRobots(robots: Robots | null, url: URL): boolean {
  if (!robots) return true;
  const path = `${url.pathname}${url.search}`;
  const allowHit = robots.allow.filter((rule) => pathMatches(rule, path)).sort((a, b) => b.length - a.length)[0];
  const disallowHit = robots.disallow.filter((rule) => pathMatches(rule, path)).sort((a, b) => b.length - a.length)[0];
  if (allowHit && (!disallowHit || allowHit.length >= disallowHit.length)) return true;
  if (disallowHit) return false;
  return true;
}

async function waitHost(host: string): Promise<void> {
  const last = lastHit.get(host) ?? 0;
  const wait = HOST_GAP_MS - (Date.now() - last);
  if (wait > 0) await sleep(wait);
}

async function fetchText(url: string): Promise<string | null> {
  const parsed = new URL(url);
  await waitHost(parsed.host);
  lastHit.set(parsed.host, Date.now());
  try {
    const response = await fetch(url, {
      headers: { "user-agent": USER_AGENT, accept: "text/html,text/plain;q=0.9" },
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const type = response.headers.get("content-type") ?? "";
    if (!/html|text\/plain/i.test(type) && type) return null;
    return await response.text();
  } catch {
    return null;
  }
}

async function robotsFor(origin: string): Promise<Robots | null> {
  if (robotsCache.has(origin)) return robotsCache.get(origin) ?? null;
  const body = await fetchText(`${origin}/robots.txt`);
  const robots = body ? parseRobots(body) : null;
  robotsCache.set(origin, robots);
  return robots;
}

function sameSite(base: URL, href: URL): boolean {
  const a = base.hostname.replace(/^www\./, "").toLowerCase();
  const b = href.hostname.replace(/^www\./, "").toLowerCase();
  return a === b;
}

function scoreHref(pathname: string): number {
  const path = pathname.toLowerCase();
  let score = 0;
  for (const hint of PAGE_HINTS) {
    if (path.includes(hint)) score += hint.length;
  }
  if (/privacy|terms|login|cart|checkout|account|careers|franchise|gift-card/.test(path)) score -= 50;
  return score;
}

function internalPages(homepage: string, html: string): string[] {
  const base = new URL(homepage);
  const found = new Map<string, number>();
  const hrefRe = /<a\s[^>]*href=["']([^"']+)["']/gi;
  for (const match of html.matchAll(hrefRe)) {
    let href = match[1]?.trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
      continue;
    }
    try {
      const url = new URL(href, base);
      if (!/^https?:$/.test(url.protocol) || !sameSite(base, url)) continue;
      url.hash = "";
      const key = url.toString();
      if (key === homepage || key === `${homepage}/`) continue;
      const score = scoreHref(url.pathname);
      if (score <= 0) continue;
      found.set(key, Math.max(found.get(key) ?? 0, score));
    } catch {
      /* ignore */
    }
  }
  return [...found.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([url]) => url);
}

function cachePath(slug: string): string {
  return join(CACHE_DIR, `${slug}.txt`);
}

export function loadCachedEnrichment(slug: string): string | undefined {
  const path = cachePath(slug);
  if (!existsSync(path)) return undefined;
  const text = readFileSync(path, "utf8").trim();
  return text || undefined;
}

function saveEnrichment(slug: string, text: string): void {
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cachePath(slug), text ? `${text}\n` : "", "utf8");
}

export async function enrichListing(listing: CompactListing, force = false): Promise<string> {
  if (!force) {
    const cached = loadCachedEnrichment(listing.slug);
    if (cached) {
      listing.websiteText = cached;
      return cached;
    }
  }
  if (!listing.website) {
    saveEnrichment(listing.slug, "");
    return "";
  }
  let homepage: URL;
  try {
    homepage = new URL(listing.website);
    if (!/^https?:$/.test(homepage.protocol)) return "";
  } catch {
    saveEnrichment(listing.slug, "");
    return "";
  }
  const robots = await robotsFor(homepage.origin);
  if (!allowedByRobots(robots, homepage)) {
    saveEnrichment(listing.slug, "");
    listing.websiteText = undefined;
    return "";
  }
  let homeHtml = await fetchText(homepage.toString());
  const thin = !homeHtml || htmlToText(homeHtml).split(/\s+/).filter(Boolean).length < 80;
  if (thin && homepage.search) {
    const bare = new URL(homepage.toString());
    bare.search = "";
    homeHtml = (await fetchText(bare.toString())) ?? homeHtml;
  }
  if (!homeHtml) {
    saveEnrichment(listing.slug, "");
    return "";
  }
  const chunks = [htmlToText(homeHtml)];
  for (const url of internalPages(homepage.toString(), homeHtml)) {
    let next: URL;
    try {
      next = new URL(url);
    } catch {
      continue;
    }
    if (!allowedByRobots(robots, next)) continue;
    const html = await fetchText(next.toString());
    if (html) chunks.push(htmlToText(html));
  }
  const text = clipWords(chunks.filter(Boolean).join("\n\n"), MAX_WORDS);
  saveEnrichment(listing.slug, text);
  listing.websiteText = text || undefined;
  return text;
}

export async function enrichListings(listings: CompactListing[], force = false): Promise<void> {
  for (const listing of listings) {
    const text = await enrichListing(listing, force);
    const words = text ? wordList(text).length : 0;
    console.log(`  enrich ${listing.slug}: ${words} website words${listing.website ? "" : " (no URL)"}`);
  }
}
