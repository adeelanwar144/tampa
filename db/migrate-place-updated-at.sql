-- Sitemap lastmod for a place. Essay, title, and meta description edits set this.
-- Existing rows start at the import time; the essay backfill overwrites rows that have one.
ALTER TABLE places ADD COLUMN updated_at TEXT;
UPDATE places SET updated_at = imported_at WHERE updated_at IS NULL OR updated_at = '';
