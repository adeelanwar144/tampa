/** Smoke-test the new lean D1 queries against remote. */
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const ROOT = process.cwd();
const WRANGLER = join(ROOT, "node_modules", "wrangler", "bin", "wrangler.js");

function q(command) {
  const result = spawnSync(
    process.execPath,
    ["node_modules/wrangler/bin/wrangler.js", "d1", "execute", "tampa-bay-guide", "--remote", "--json", "--command", command],
    { cwd: ROOT, encoding: "utf8", windowsHide: true, maxBuffer: 8 * 1024 * 1024 },
  );
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  const json = JSON.parse(result.stdout);
  const rows = json?.[0]?.results ?? json?.result?.[0]?.results ?? json?.results ?? [];
  return rows;
}

const published = q("SELECT COUNT(*) AS n FROM places WHERE status = 'published' AND COALESCE(listing_quarantined,0)=0");
const quarantined = q("SELECT COUNT(*) AS n FROM places WHERE listing_quarantined = 1");
const peer = q("SELECT slug, name FROM places WHERE name = (SELECT name FROM places WHERE status='published' LIMIT 1) AND status='published' AND COALESCE(listing_quarantined,0)=0 LIMIT 5");
const related = q(`SELECT slug FROM places WHERE neighborhood_slug IS NOT NULL AND status='published' AND COALESCE(listing_quarantined,0)=0 LIMIT 6`);
const page = q(`SELECT slug,
  (SELECT i.r2_key FROM place_images i WHERE i.place_id = places.id AND i.r2_key NOT LIKE 'wm/%' ORDER BY i.sort_order ASC LIMIT 1) AS first_image
  FROM places WHERE status='published' AND COALESCE(listing_quarantined,0)=0 ORDER BY rating DESC LIMIT 12`);

console.log(JSON.stringify({ published, quarantined, peerCount: peer.length, relatedCount: related.length, pageCount: page.length, sample: page[0] }, null, 2));
