import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { ROOT } from "../lib";
import type { IndexEntry, ListingContentRecord } from "./types";
import { runWrangler } from "./wrangler-cli";

const LISTING_CONTENT_BUCKET = "listing-content";
const PREFIX = "listings";
const INDEX_KEY = `${PREFIX}/_index.json`;
const LOCAL_CACHE = join(ROOT, ".listing-content-cache");
const PUT_ATTEMPTS = 3;
const MAX_PARALLEL = 8;

function objectKey(slug: string): string {
  return `${PREFIX}/${slug}.json`;
}

function r2AccountId(): string {
  return (process.env.R2_ACCOUNT_ID ?? process.env.CLOUDFLARE_ACCOUNT_ID ?? "").trim();
}

function s3Ready(): boolean {
  return Boolean(
    r2AccountId() && process.env.R2_ACCESS_KEY_ID?.trim() && process.env.R2_SECRET_ACCESS_KEY?.trim(),
  );
}

function s3(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${r2AccountId()}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

function writeLocal(slug: string, record: ListingContentRecord): void {
  const path = join(LOCAL_CACHE, `${slug}.json`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(record, null, 2)}\n`, "utf8");
}

function writeLocalIndex(entries: IndexEntry[]): void {
  mkdirSync(LOCAL_CACHE, { recursive: true });
  writeFileSync(join(LOCAL_CACHE, "_index.json"), `${JSON.stringify(entries, null, 2)}\n`, "utf8");
}

function tmpPath(label: string): string {
  mkdirSync(LOCAL_CACHE, { recursive: true });
  return join(LOCAL_CACHE, `.${label}-${randomUUID()}.json`);
}

function removeTmp(path: string): void {
  try {
    unlinkSync(path);
  } catch {
    /* ignore */
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let activePuts = 0;
const putQueue: Array<() => void> = [];

async function withPutSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (activePuts >= MAX_PARALLEL) {
    await new Promise<void>((resolve) => putQueue.push(resolve));
  }
  activePuts += 1;
  try {
    return await fn();
  } finally {
    activePuts -= 1;
    putQueue.shift()?.();
  }
}

async function withRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= PUT_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === PUT_ATTEMPTS) break;
      await sleep(1_000 * attempt);
    }
  }
  const detail = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`${label} failed after ${PUT_ATTEMPTS} attempts: ${detail}`);
}

function assertRemoteBody(key: string, raw: string): void {
  const parsed = JSON.parse(raw) as { slug?: string } | IndexEntry[];
  if (key === INDEX_KEY) {
    if (!Array.isArray(parsed)) throw new Error(`remote ${key} is not a JSON array`);
    return;
  }
  if (!parsed || Array.isArray(parsed) || typeof parsed.slug !== "string" || !parsed.slug) {
    throw new Error(`remote ${key} is missing slug`);
  }
}

async function putViaS3(key: string, json: string): Promise<void> {
  const client = s3();
  await client.send(
    new PutObjectCommand({
      Bucket: LISTING_CONTENT_BUCKET,
      Key: key,
      Body: json,
      ContentType: "application/json",
        CacheControl: "private, max-age=3600",
    }),
  );
  const response = await client.send(new GetObjectCommand({ Bucket: LISTING_CONTENT_BUCKET, Key: key }));
  const text = await response.Body?.transformToString();
  if (!text) throw new Error(`S3 put of ${key} could not be verified`);
  assertRemoteBody(key, text);
}

async function putViaWrangler(key: string, json: string): Promise<void> {
  const upload = tmpPath("upload");
  const download = tmpPath("verify");
  writeFileSync(upload, json, "utf8");
  try {
    await runWrangler([
      "r2",
      "object",
      "put",
      `${LISTING_CONTENT_BUCKET}/${key}`,
      "--file",
      upload,
      "--remote",
      "--content-type",
      "application/json",
    ]);
  } finally {
    removeTmp(upload);
    removeTmp(download);
  }
}

async function putJson(key: string, body: unknown): Promise<void> {
  const json = `${JSON.stringify(body)}\n`;
  await withPutSlot(() =>
    withRetry(`R2 put ${key}`, () => (s3Ready() ? putViaS3(key, json) : putViaWrangler(key, json))),
  );
}

async function getViaS3<T>(key: string): Promise<T | null> {
  try {
    const response = await s3().send(new GetObjectCommand({ Bucket: LISTING_CONTENT_BUCKET, Key: key }));
    const text = await response.Body?.transformToString();
    return text ? (JSON.parse(text) as T) : null;
  } catch (error) {
    const name = (error as { name?: string }).name;
    if (name === "NoSuchKey" || name === "NotFound") return null;
    throw error;
  }
}

async function getViaWrangler<T>(key: string): Promise<T | null> {
  const dest = tmpPath("download");
  try {
    await runWrangler(["r2", "object", "get", `${LISTING_CONTENT_BUCKET}/${key}`, "--file", dest, "--remote"]);
    if (!existsSync(dest) || readFileSync(dest, "utf8").trim() === "") return null;
    return JSON.parse(readFileSync(dest, "utf8")) as T;
  } catch {
    return null;
  } finally {
    removeTmp(dest);
  }
}

async function getJson<T>(key: string): Promise<T | null> {
  if (s3Ready()) return getViaS3<T>(key);
  return getViaWrangler<T>(key);
}

export async function getIndex(): Promise<IndexEntry[]> {
  const index = await getJson<IndexEntry[]>(INDEX_KEY);
  return Array.isArray(index) ? index : [];
}

export async function putIndex(entries: IndexEntry[]): Promise<void> {
  writeLocalIndex(entries);
  await putJson(INDEX_KEY, entries);
}

export async function getRecord(slug: string): Promise<ListingContentRecord | null> {
  return getJson<ListingContentRecord>(objectKey(slug));
}

export async function putRecord(record: ListingContentRecord): Promise<void> {
  writeLocal(record.slug, record);
  await putJson(objectKey(record.slug), record);
}

async function setListingQuarantined(slug: string, value: 0 | 1): Promise<void> {
  const safe = slug.replace(/'/g, "''");
  try {
    await runWrangler([
      "d1",
      "execute",
      "tampa-bay-guide",
      "--remote",
      "--command",
      `UPDATE places SET listing_quarantined = ${value} WHERE slug = '${safe}'`,
    ]);
  } catch (error) {
    console.warn(`D1 listing_quarantined=${value} ${slug}: ${error instanceof Error ? error.message : error}`);
  }
}

export async function quarantineRecord(record: ListingContentRecord): Promise<void> {
  const dir = join(LOCAL_CACHE, "quarantine");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${record.slug}.json`), `${JSON.stringify(record, null, 2)}\n`, "utf8");
  await putJson(`quarantine/${record.slug}.json`, record);
  await setListingQuarantined(record.slug, 1);
}

function removeLocal(slug: string): void {
  const path = join(LOCAL_CACHE, `${slug}.json`);
  try {
    unlinkSync(path);
  } catch {
    /* ignore */
  }
}

async function deleteViaS3(key: string): Promise<void> {
  await s3().send(new DeleteObjectCommand({ Bucket: LISTING_CONTENT_BUCKET, Key: key }));
}

async function deleteViaWrangler(key: string): Promise<void> {
  await runWrangler(["r2", "object", "delete", `${LISTING_CONTENT_BUCKET}/${key}`, "--remote"]);
}

export async function deleteRecord(slug: string): Promise<void> {
  removeLocal(slug);
  const key = objectKey(slug);
  await withPutSlot(() =>
    withRetry(`R2 delete ${key}`, () => (s3Ready() ? deleteViaS3(key) : deleteViaWrangler(key))),
  );
}

export async function deleteQuarantine(slug: string): Promise<void> {
  const path = join(LOCAL_CACHE, "quarantine", `${slug}.json`);
  if (existsSync(path)) {
    try {
      unlinkSync(path);
    } catch {
      /* already removed */
    }
  }
  const key = `quarantine/${slug}.json`;
  try {
    await withPutSlot(() =>
      withRetry(`R2 delete ${key}`, () => (s3Ready() ? deleteViaS3(key) : deleteViaWrangler(key))),
    );
  } catch {
    /* no remote quarantine object */
  }
  await setListingQuarantined(slug, 0);
}

export function readLocalRecords(): ListingContentRecord[] {
  if (!existsSync(LOCAL_CACHE)) return [];
  const records: ListingContentRecord[] = [];
  for (const name of readdirSync(LOCAL_CACHE)) {
    if (!name.endsWith(".json") || name.startsWith(".") || name === "_index.json") continue;
    try {
      const parsed = JSON.parse(readFileSync(join(LOCAL_CACHE, name), "utf8")) as ListingContentRecord;
      if (parsed?.slug && parsed.contentMarkdown) records.push(parsed);
    } catch {
      /* ignore */
    }
  }
  return records;
}

export function readQuarantineRecords(): ListingContentRecord[] {
  const dir = join(LOCAL_CACHE, "quarantine");
  if (!existsSync(dir)) return [];
  const records: ListingContentRecord[] = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".json")) continue;
    try {
      const parsed = JSON.parse(readFileSync(join(dir, name), "utf8")) as ListingContentRecord;
      if (parsed?.slug && parsed.contentMarkdown) records.push(parsed);
    } catch {
      /* ignore */
    }
  }
  return records;
}

export async function remoteObjectExists(slug: string): Promise<boolean> {
  const record = await getRecord(slug);
  return Boolean(record?.slug === slug);
}

export function r2WriteMode(): "s3" | "wrangler" {
  return s3Ready() ? "s3" : "wrangler";
}

export { objectKey, PREFIX };
