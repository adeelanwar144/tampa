-- Restore places from the snapshot taken by migrate-nullable-neighborhood.sql.
-- Delete imported rows with NULL neighborhood_slug first (see rollback-gmb-part2.sql)
-- or this INSERT will fail if you rebuild with NOT NULL.

PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS places;
CREATE TABLE places (
  id TEXT PRIMARY KEY,
  place_id TEXT UNIQUE,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  neighborhood_slug TEXT NOT NULL REFERENCES neighborhoods(slug),
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

INSERT INTO places (
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
FROM places_pre_nullable;

CREATE INDEX IF NOT EXISTS idx_places_neighborhood ON places(neighborhood_slug);
CREATE INDEX IF NOT EXISTS idx_places_status ON places(status);

PRAGMA foreign_keys = ON;
