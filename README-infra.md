# Infra — Places import, D1, R2

The live app never calls Google. Listings are read from D1; photos are served from R2 via `/api/photos/...`. `scripts/import-tampa-places.ts` is a one-time local job.

## One-time import

1. Put `GOOGLE_PLACES_API_KEY` in `.env` (see `.env.example`). Do not commit it.
2. Enable R2 on the Cloudflare account (Dashboard → R2 → Purchase / Enable), then create the `tampa-bay-guide-images` bucket. Optional but recommended: create an R2 API token and set `CLOUDFLARE_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.
3. Apply schema (local for `next dev`, remote for the Worker):

```bash
npx wrangler d1 execute tampa-bay-guide --local --file=db/schema.sql
npx wrangler d1 execute tampa-bay-guide --remote --file=db/schema.sql
```

4. Run **one neighborhood first** and inspect the staging JSON before paying for all 14:

```bash
npx tsx scripts/import-tampa-places.ts --only=ybor-city
```

5. If `src/data/staging/ybor-city.json` looks right (names, hours, ≤5 photos with attribution, ≤5 reviews with `authorPhotoUri` as a link only), run the rest:

```bash
npx tsx scripts/import-tampa-places.ts --all
```

Already-written staging files are skipped. Redo one neighborhood with `--force`:

```bash
npx tsx scripts/import-tampa-places.ts --only=ybor-city --force
```

6. Load D1 from staging (does not call Google):

```bash
npx tsx scripts/load-import-to-d1.ts          # local D1
npx tsx scripts/load-import-to-d1.ts --remote # production D1
```

Imported rows stay `status = 'draft'` with empty `tagline` / `description`. Publish them by hand after writing copy.

## Post-import checklist

Work through this only after a load run reports the counts you expect.

- [ ] Row counts in D1 match the staging files:

  ```bash
  npx wrangler d1 execute tampa-bay-guide --local --command "SELECT neighborhood_slug, COUNT(*) AS places FROM places GROUP BY neighborhood_slug;"
  npx wrangler d1 execute tampa-bay-guide --local --command "SELECT COUNT(*) AS images FROM place_images;"
  npx wrangler d1 execute tampa-bay-guide --local --command "SELECT COUNT(*) AS reviews FROM place_reviews;"
  ```

  Repeat with `--remote` if you loaded production.

- [ ] Spot-check a handful of R2 images actually load (`places/{place_id}/0.jpg` in the `tampa-bay-guide-images` bucket, or `/api/photos/places/{place_id}/0.jpg` on the Worker). If R2 was not enabled during import, photos are in `.import-cache/` at those same keys — upload them after enabling the bucket, do not re-run Google.

- [ ] Delete `GOOGLE_PLACES_API_KEY` from `.env`.

- [ ] Revoke the key in [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

After that point, `scripts/import-tampa-places.ts` can no longer be re-run without generating a new key. **That is the intended end state, not a bug.** The app has no Places API code path — live or otherwise. A new key is only needed if you deliberately decide to import again.

## Bindings

`wrangler.jsonc` expects:

- D1 `DB` → database `tampa-bay-guide`
- R2 `PHOTOS` → bucket `tampa-bay-guide-images`
