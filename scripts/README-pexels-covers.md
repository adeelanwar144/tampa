# Pexels featured images

Existing articles store covers as `/images/wm/articles/{pexelsId}.webp` with `coverAlt` and `coverCredit` (`Photo by {name} on Pexels`). Body embeds match the watermark pipeline.

## New / missing covers

1. Prefer `npx tsx scripts/article-gen/...` when generating from notes (uses `PEXELS_API_KEY` + `output/_used-images.json`).
2. If covers are missing after a manual publish, run:
   - `node scripts/assign-pexels-covers.mjs` (API search; respects used IDs), **or**
   - `node scripts/apply-curated-pexels-covers.mjs` (curated IDs when API is rate-limited)
3. Then localize + watermark: `npx tsx scripts/watermark.ts --only articles --apply`

Never reuse a Pexels ID already in `output/_used-images.json` or an existing `coverImage`.
