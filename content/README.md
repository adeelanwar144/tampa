# Article generator

This CLI writes first-person Visit In Tampa articles with Claude, then fills `[IMAGE: …]` placeholders from Pexels.

It lives next to the website but does not run in the deployed app. Keys stay in `.env` and are never printed.

## 1. Install

From the project root:

```bash
npm install
```

You need Node 20+ (`npx tsx` is already in the repo). Confirm `.env` has:

- `Claude_API_KEY`
- `PEXELS_API_KEY`

Optional:

- `CLAUDE_MODEL_SONNET=claude-sonnet-5-5`
- `CLAUDE_MODEL_HAIKU=claude-haiku-5-5`

## 2. Put your files here

| What | Where |
| --- | --- |
| Content rules | `content/instructions/content-instructions.md` |
| Planner | `content/planner/planner.csv` or `planner.xlsx` |
| Personal notes | `content/notes/<slug>.txt` (or `.md`) |

Planner columns (matched case-insensitively): `slug`, `topic` or `primary_keyword`, `lsi_keywords` (also `LSI`, `Supporting Keywords`, `Additional Semantic Keywords to Include`). Optional: `internal_links`, `notes_file`, `status`.

If the Excel file has several sheets, the tool uses **Content Plan** unless you pass `--sheet`.

## 3. Test one article (Haiku)

```bash
npx tsx scripts/article-gen/generate.ts --slug things-to-do-in-tampa --model haiku --planner "C:\Users\adeel\Downloads\Tampa_Content_Plan_Keyword_Clusters.xlsx" --notes-dir "C:\Users\adeel\Downloads\tampa-notes-rewritten-all-191\high-priority"
```

`--dry-run` prints the prompts and makes no API calls.

Articles must stay at least 1,200 words even when notes are thin. The target is still 2,500–4,500. Below 1,200 fails the check and Claude is asked to expand without inventing facts.

## 4. Full batch (Sonnet)

```bash
npx tsx scripts/article-gen/generate.ts --model sonnet --planner "C:\Users\adeel\Downloads\Tampa_Content_Plan_Keyword_Clusters.xlsx" --notes-dir "C:\Users\adeel\Downloads\tampa-notes-rewritten-all-191\high-priority"
```

Useful flags: `--limit 5`, `--force`, `--no-images`, `--download-images`, `--audit`, `--concurrency 2`.

## 5. Output files (`output/<slug>/`)

| File | Purpose |
| --- | --- |
| `article.md` | Finished article with Pexels photos and credits |
| `article.raw.md` | Article before images |
| `seo.json` | Slug, meta title, meta description, keywords |
| `editor-notes.md` | Private notes. Never publish this file |
| `images.json` | Photo IDs, URLs, photographer credits, queries |
| `run-log.json` | Model, tokens, cost estimate, checks, retries |

## 6. Photos

Pexels requires photographer credit. The article already includes it; keep it. Stock photos may not match the exact place — check each one before you publish, or swap in your own shot.
