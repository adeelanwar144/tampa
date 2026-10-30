import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getPhotosBucket } from "@/lib/d1";
import { PMTILES_ALIASES } from "@/data/map-tiles";

export const dynamic = "force-dynamic";

const ALLOWED_PREFIXES = ["places/", "maps/"];
const VERSIONED_PMTILES = new Set(Object.keys(PMTILES_ALIASES));
/** Only cache small map tile range chunks — never the whole archive. */
const MAP_CACHE_MAX_BYTES = 2_000_000;

type CachedMapBody = {
  status: number;
  headers: [string, string][];
  body: ArrayBuffer;
};

const memoryCache = new Map<string, CachedMapBody>();

function allowedKey(objectKey: string) {
  return ALLOWED_PREFIXES.some((prefix) => objectKey.startsWith(prefix)) && !objectKey.includes("..");
}

function resolveObjectKey(requestKey: string) {
  return PMTILES_ALIASES[requestKey] ?? requestKey;
}

function isPmtiles(requestKey: string) {
  return requestKey.startsWith("maps/") && requestKey.endsWith(".pmtiles");
}

function localImportPhoto(objectKey: string) {
  if (objectKey.includes("..")) return null;
  const path = objectKey.startsWith("places/") ? join(process.cwd(), ".import-cache", objectKey) : "";
  if (!path || !existsSync(path)) return null;
  return { path, size: statSync(path).size };
}

function contentTypeFor(objectKey: string, stored?: string) {
  if (objectKey.endsWith(".pmtiles")) return "application/vnd.pmtiles";
  if (objectKey.endsWith(".png")) return "image/png";
  if (objectKey.endsWith(".webp")) return "image/webp";
  return stored ?? "image/jpeg";
}

function parseByteRange(header: string | null, size: number) {
  if (!header) return null;
  const match = header.trim().match(/^bytes=(\d*)-(\d*)$/i);
  if (!match) return "unsatisfiable" as const;
  const hasStart = match[1] !== "";
  const hasEnd = match[2] !== "";
  if (!hasStart && !hasEnd) return "unsatisfiable" as const;

  if (!hasStart) {
    const suffix = Number(match[2]);
    if (!Number.isFinite(suffix) || suffix <= 0) return "unsatisfiable" as const;
    const length = Math.min(suffix, size);
    return { offset: size - length, length };
  }

  const start = Number(match[1]);
  if (!Number.isFinite(start) || start < 0 || start >= size) return "unsatisfiable" as const;
  const end = hasEnd ? Number(match[2]) : size - 1;
  if (!Number.isFinite(end) || end < start) return "unsatisfiable" as const;
  const clampedEnd = Math.min(end, size - 1);
  return { offset: start, length: clampedEnd - start + 1 };
}

function cacheControlFor(requestKey: string) {
  if (VERSIONED_PMTILES.has(requestKey)) return "public, max-age=31536000, immutable";
  if (requestKey.startsWith("maps/")) return "public, max-age=86400";
  return "public, max-age=31536000, immutable";
}

function objectHeaders(
  requestKey: string,
  objectKey: string,
  object: { size: number; httpMetadata?: { contentType?: string } },
  range?: { offset: number; length: number } | null,
) {
  const headers = new Headers({
    "content-type": contentTypeFor(objectKey, object.httpMetadata?.contentType),
    "accept-ranges": "bytes",
    "cache-control": cacheControlFor(requestKey),
    "access-control-expose-headers": "Accept-Ranges, Content-Range, Content-Length, X-Map-Cache",
  });
  if (range) {
    headers.set("content-length", String(range.length));
    headers.set("content-range", `bytes ${range.offset}-${range.offset + range.length - 1}/${object.size}`);
  } else {
    headers.set("content-length", String(object.size));
  }
  return headers;
}

function mapCacheKey(request: NextRequest) {
  const url = new URL(request.url);
  const range = request.headers.get("range") ?? "";
  return `${url.origin}${url.pathname}|${range}`;
}

function cacheApiRequest(request: NextRequest) {
  const url = new URL(request.url);
  const range = request.headers.get("range") ?? "";
  return new Request(`${url.origin}${url.pathname}?__range=${encodeURIComponent(range)}`, {
    method: "GET",
  });
}

function workerCache() {
  if (typeof caches === "undefined") return undefined;
  return (caches as CacheStorage & { default?: Cache }).default;
}

async function readMapCache(request: NextRequest) {
  const key = mapCacheKey(request);
  const mem = memoryCache.get(key);
  if (mem) {
    return new Response(mem.body, {
      status: mem.status,
      headers: new Headers([...mem.headers, ["x-map-cache", "HIT"]]),
    });
  }

  try {
    const cache = workerCache();
    if (!cache) return null;
    const cached = await cache.match(cacheApiRequest(request));
    if (!cached) return null;
    const headers = new Headers(cached.headers);
    headers.set("x-map-cache", "HIT");
    return new Response(cached.body, { status: cached.status, headers });
  } catch {
    return null;
  }
}

async function maybeCacheMapResponse(
  request: NextRequest,
  response: Response,
  range: { offset: number; length: number } | null,
) {
  const headers = new Headers(response.headers);
  if (!range || range.length > MAP_CACHE_MAX_BYTES) {
    headers.set("x-map-cache", "BYPASS");
    return new Response(response.body, { status: response.status, headers });
  }

  headers.set("x-map-cache", "MISS");
  try {
    const { ctx } = await getCloudflareContext({ async: true });
    const cache = workerCache();
    const forCache = response.clone();
    const forMem = response.clone();
    if (cache) {
      ctx.waitUntil(cache.put(cacheApiRequest(request), forCache));
    }
    ctx.waitUntil(
      (async () => {
        const body = await forMem.arrayBuffer();
        if (body.byteLength <= MAP_CACHE_MAX_BYTES) {
          memoryCache.set(mapCacheKey(request), {
            status: response.status,
            headers: [...response.headers.entries()].filter(([name]) => name !== "x-map-cache"),
            body,
          });
        }
      })(),
    );
  } catch {
    // next dev has no Worker Cache API
  }

  return new Response(response.body, { status: response.status, headers });
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const requestKey = key.join("/");
  if (!allowedKey(requestKey)) return new Response("Not found", { status: 404 });
  const objectKey = resolveObjectKey(requestKey);

  const local = localImportPhoto(objectKey);
  const bucket = local ? null : await getPhotosBucket();
  const object = bucket ? await bucket.head(objectKey) : null;
  if (!object && !local) return new Response("Not found", { status: 404 });
  const size = local?.size ?? object!.size;

  const range = parseByteRange(request.headers.get("range"), size);
  if (range === "unsatisfiable") {
    return new Response(null, {
      status: 416,
      headers: { "content-range": `bytes */${size}`, "accept-ranges": "bytes" },
    });
  }

  return new Response(null, {
    status: range ? 206 : 200,
    headers: objectHeaders(
      requestKey,
      objectKey,
      object ?? { size, httpMetadata: { contentType: contentTypeFor(objectKey) } },
      range,
    ),
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const requestKey = key.join("/");
  if (!allowedKey(requestKey)) return new Response("Not found", { status: 404 });
  const objectKey = resolveObjectKey(requestKey);

  if (isPmtiles(requestKey)) {
    const cached = await readMapCache(request);
    if (cached) return cached;
  }

  const local = localImportPhoto(objectKey);
  if (local) {
    const size = local.size;
    const range = parseByteRange(request.headers.get("range"), size);
    if (range === "unsatisfiable") {
      return new Response(null, {
        status: 416,
        headers: { "content-range": `bytes */${size}`, "accept-ranges": "bytes" },
      });
    }
    const bytes = readFileSync(local.path);
    const slice = range ? bytes.subarray(range.offset, range.offset + range.length) : bytes;
    const response = new Response(slice, {
      status: range ? 206 : 200,
      headers: objectHeaders(
        requestKey,
        objectKey,
        { size, httpMetadata: { contentType: contentTypeFor(objectKey) } },
        range,
      ),
    });
    if (isPmtiles(requestKey)) return maybeCacheMapResponse(request, response, range);
    return response;
  }

  const bucket = await getPhotosBucket();
  if (!bucket) return new Response("Not found", { status: 404 });

  // Prefer a single R2 get. Range requests stream bytes directly — never buffer the whole pmtiles file.
  const rangeHeader = request.headers.get("range");
  // For ranged gets we still need total size for Content-Range; head only when Range is present.
  let size = 0;
  let contentType: string | undefined;
  let range: { offset: number; length: number } | null = null;

  if (rangeHeader) {
    const meta = await bucket.head(objectKey);
    if (!meta) return new Response("Not found", { status: 404 });
    size = meta.size;
    contentType = meta.httpMetadata?.contentType;
    const parsed = parseByteRange(rangeHeader, size);
    if (parsed === "unsatisfiable") {
      return new Response(null, {
        status: 416,
        headers: { "content-range": `bytes */${size}`, "accept-ranges": "bytes" },
      });
    }
    range = parsed;
  }

  const object = range
    ? await bucket.get(objectKey, { range: { offset: range.offset, length: range.length } })
    : await bucket.get(objectKey);
  if (!object) return new Response("Not found", { status: 404 });

  if (!range) {
    size = object.size;
    contentType = object.httpMetadata?.contentType;
  }

  const response = new Response(object.body, {
    status: range ? 206 : 200,
    headers: objectHeaders(
      requestKey,
      objectKey,
      { size, httpMetadata: { contentType } },
      range,
    ),
  });

  if (isPmtiles(requestKey)) {
    return maybeCacheMapResponse(request, response, range);
  }

  return response;
}
