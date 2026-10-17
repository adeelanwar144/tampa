-- Allow places outside the 14 anchors to import with neighborhood_slug NULL.
-- SQLite cannot drop NOT NULL in place, so rebuild the table.
-- Safe to apply on remote D1. Snapshot: places_pre_nullable (rollback file).
-- Prerequisite: db/migrate-place-fields.sql (utc_offset / service columns).

PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS places_pre_nullable;
CREATE TABLE places_pre_nullable AS SELECT * FROM places;

CREATE TABLE places_new (
  id TEXT PRIMARY KEY,
  place_id TEXT UNIQUE,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  neighborhood_slug TEXT REFERENCES neighborhoods(slug),
  micro_area TEXT,
  formatted_address TEXT,
  lat REAL, lng REAL,
  phone TEXT,
  website TEXT,
  google_maps_uri TEXT,
  rating REAL,
  review_count INTEGER,
  price_level INTEGER,
  primary_type TEXT,
  business_status TEXT,
  hours_json TEXT,
  utc_offset_minutes INTEGER,
  delivery INTEGER,
  takeout INTEGER,
  dine_in INTEGER,
  wheelchair_accessible INTEGER,
  tagline TEXT,
  description TEXT,
  status TEXT DEFAULT 'draft',
  imported_at TEXT
);

INSERT INTO places_new (
  id, place_id, slug, name, neighborhood_slug, micro_area, formatted_address,
  lat, lng, phone, website, google_maps_uri, rating, review_count, price_level,
  primary_type, business_status, hours_json, utc_offset_minutes, delivery,
  takeout, dine_in, wheelchair_accessible, tagline, description, status, imported_at
)
SELECT
  id, place_id, slug, name, neighborhood_slug, micro_area, formatted_address,
  lat, lng, phone, website, google_maps_uri, rating, review_count, price_level,
  primary_type, business_status, hours_json, utc_offset_minutes, delivery,
  takeout, dine_in, wheelchair_accessible, tagline, description, status, imported_at
FROM places;

DROP TABLE places;
ALTER TABLE places_new RENAME TO places;

CREATE INDEX IF NOT EXISTS idx_places_neighborhood ON places(neighborhood_slug);
CREATE INDEX IF NOT EXISTS idx_places_status ON places(status);

PRAGMA foreign_keys = ON;
