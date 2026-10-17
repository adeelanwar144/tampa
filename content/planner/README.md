Put the content planner here as `planner.csv` or `planner.xlsx`.

Required columns (names are matched case-insensitively):

- `slug`
- `topic` or `primary_keyword`
- `lsi_keywords` (also accepts `LSI`, `LSI Keywords`, `Supporting Keywords`, `Additional Semantic Keywords to Include`)

Optional: `internal_links`, `notes_file`, `status`.

Rows marked `done` or `published` are skipped unless you pass `--force`.
