/**
 * Mark thin places open / unclear / likely closed from the official website only.
 * No review sites. A parked or for-sale domain is likely closed.
 */
import { readFileSync, writeFileSync } from "node:fs";

const thin = JSON.parse(readFileSync("content/places/thin-places.json", "utf8"));
const PARK = [
  /domain (?:is )?for sale/i,
  /buy this domain/i,
  /this domain (?:may be|is) for sale/i,
  /parked free/i,
  /domain parking/i,
  /sedoparking/i,
  /hugedomains/i,
  /afternic/i,
  /dan\.com/i,
  /this webpage is parked/i,
  /inquire about this domain/i,
  /is parked/i,
];
const CLOSED = [
  /permanently closed/i,
  /we(?:'ve| have) closed/i,
  /out of business/i,
  /no longer (?:in business|operating|open)/i,
  /this location (?:is|has) closed/i,
];

function classify(status, finalUrl, body) {
  const sample = body.slice(0, 20000);
  if (CLOSED.some((pattern) => pattern.test(sample))) {
    return { mark: "likely closed", reason: "page says closed" };
  }
  const host = (() => {
    try {
      return new URL(finalUrl).hostname;
    } catch {
      return "";
    }
  })();
  if (/sedo|hugedomain|afternic|dan\.com|parkingcrew|bodis|above\.com/i.test(host) || PARK.some((pattern) => pattern.test(sample))) {
    return { mark: "likely closed", reason: "parked or for-sale domain" };
  }
  if (status >= 200 && status < 400 && sample.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length > 200) {
    return { mark: "open", reason: `website loaded ${status}` };
  }
  if (status === 404 || status === 410) return { mark: "unclear", reason: `HTTP ${status}` };
  if (status >= 500) return { mark: "unclear", reason: `HTTP ${status}` };
  return { mark: "unclear", reason: status ? `thin or blocked response ${status}` : "no response" };
}

async function checkOne(row) {
  if (!row.website) return { ...row, operating: "unclear", reason: "no website in the database" };
  const started = Date.now();
  try {
    const response = await fetch(row.website, {
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
      headers: {
        "user-agent": "VisitInTampa operating-status check",
        accept: "text/html,application/xhtml+xml",
      },
    });
    const bytes = new Uint8Array(await response.arrayBuffer());
    const body = new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(0, 80000));
    const result = classify(response.status, response.url, body);
    return { ...row, operating: result.mark, reason: result.reason, finalUrl: response.url, ms: Date.now() - started };
  } catch (error) {
    const message = error instanceof Error ? error.name : "error";
    return { ...row, operating: "unclear", reason: message === "TimeoutError" ? "timeout" : message, ms: Date.now() - started };
  }
}

const queue = [...thin];
const results = [];
const workers = Array.from({ length: 10 }, async () => {
  while (queue.length) {
    const row = queue.shift();
    const result = await checkOne(row);
    results.push(result);
    if (results.length % 25 === 0) console.log(`checked ${results.length}/${thin.length}`);
  }
});
await Promise.all(workers);
results.sort((a, b) => a.slug.localeCompare(b.slug));

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

const header = "slug,name,category,operating,reason,website";
const lines = results.map((row) =>
  [row.slug, row.name, row.category, row.operating, row.reason, row.website].map(csvCell).join(","),
);
writeFileSync("content/places/operating-status.csv", `${header}\n${lines.join("\n")}\n`, "utf8");
writeFileSync("content/places/operating-status.json", JSON.stringify(results, null, 2));

const counts = {};
for (const row of results) counts[row.operating] = (counts[row.operating] ?? 0) + 1;
console.log(JSON.stringify(counts, null, 2));
const closed = results.filter((row) => row.operating === "likely closed");
console.log("likely closed", closed.length);
for (const row of closed) console.log(`- ${row.slug} | ${row.reason} | ${row.website}`);
