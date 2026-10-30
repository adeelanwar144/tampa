import { getCloudflareContext } from "@opennextjs/cloudflare";

type Entry<T> = { at: number; value: T };

const memory = new Map<string, Entry<unknown>>();

function workerCache(): Cache | undefined {
  if (typeof caches === "undefined") return undefined;
  return (caches as CacheStorage & { default?: Cache }).default;
}

function cacheRequest(key: string) {
  return new Request(`https://listing-cache.visitintampa.internal/${encodeURIComponent(key)}`);
}

/**
 * Short-lived listing data cache: isolate memory + Cloudflare Cache API.
 * Avoids next/unstable_cache, which can break D1 access on OpenNext Workers.
 */
export async function cachedListingData<T>(
  key: string,
  ttlSeconds: number,
  load: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const mem = memory.get(key) as Entry<T> | undefined;
  if (mem && now - mem.at < ttlSeconds * 1000) return mem.value;

  try {
    const cache = workerCache();
    if (cache) {
      const hit = await cache.match(cacheRequest(key));
      if (hit) {
        const value = (await hit.json()) as T;
        memory.set(key, { at: now, value });
        return value;
      }
    }
  } catch {
    /* Cache API unavailable in some local/dev paths */
  }

  const value = await load();
  memory.set(key, { at: Date.now(), value });

  try {
    const cache = workerCache();
    if (cache) {
      const response = new Response(JSON.stringify(value), {
        headers: {
          "content-type": "application/json",
          "cache-control": `public, s-maxage=${ttlSeconds}`,
        },
      });
      try {
        const { ctx } = await getCloudflareContext({ async: true });
        ctx.waitUntil(cache.put(cacheRequest(key), response.clone()));
      } catch {
        await cache.put(cacheRequest(key), response);
      }
    }
  } catch {
    /* ignore cache write failures */
  }

  return value;
}
