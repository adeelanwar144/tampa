-- Visit In Tampa — D1 schema
-- Apply with: wrangler d1 execute tampa-bay-guide --file=db/schema.sql
--            wrangler d1 execute tampa-bay-guide --local --file=db/schema.sql

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS neighborhoods (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

INSERT OR IGNORE INTO neighborhoods (slug, name) VALUES
  ('ybor-city', 'Ybor City'),
  ('downtown-tampa', 'Downtown Tampa'),
  ('channel-district', 'Channel District'),
  ('tampa-heights', 'Tampa Heights'),
  ('davis-islands', 'Davis Islands'),
  ('hyde-park', 'Hyde Park'),
  ('bayshore-ballast-point', 'Bayshore / Ballast Point'),
  ('beach-park-macdill', 'Beach Park / MacDill'),
  ('westshore', 'Westshore'),
  ('west-tampa', 'West Tampa'),
  ('seminole-heights', 'Seminole Heights'),
  ('sulphur-springs', 'Sulphur Springs'),
  ('new-tampa', 'New Tampa'),
  ('east-tampa', 'East Tampa'),
  ('downtown', 'Downtown'),
  ('soho', 'SoHo'),
  ('palma-ceia', 'Palma Ceia'),
  ('riverwalk', 'Riverwalk'),
  ('temple-terrace', 'Temple Terrace'),
  ('ballast-point', 'Ballast Point');

CREATE TABLE IF NOT EXISTS places (
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
  listing_quarantined INTEGER NOT NULL DEFAULT 0,
  imported_at TEXT
);

CREATE TABLE IF NOT EXISTS place_images (
  id TEXT PRIMARY KEY,
  place_id TEXT REFERENCES places(id),
  r2_key TEXT NOT NULL,
  attribution_author TEXT,
  attribution_uri TEXT,
  is_primary INTEGER DEFAULT 0,
  sort_order INTEGER
);

CREATE TABLE IF NOT EXISTS place_reviews (
  id TEXT PRIMARY KEY,
  place_id TEXT REFERENCES places(id),
  rating INTEGER,
  review_text TEXT,
  relative_time TEXT,
  author_name TEXT,
  author_uri TEXT,
  author_photo_uri TEXT
);

CREATE TABLE IF NOT EXISTS place_address_components (
  place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  long_name TEXT,
  short_name TEXT,
  PRIMARY KEY (place_id, type)
);

CREATE INDEX IF NOT EXISTS idx_places_neighborhood ON places(neighborhood_slug);
CREATE INDEX IF NOT EXISTS idx_places_status ON places(status);
CREATE INDEX IF NOT EXISTS idx_places_listing_quarantined ON places(listing_quarantined);
CREATE INDEX IF NOT EXISTS idx_place_images_place ON place_images(place_id);
CREATE INDEX IF NOT EXISTS idx_place_reviews_place ON place_reviews(place_id);
CREATE INDEX IF NOT EXISTS idx_place_address_components_place ON place_address_components(place_id);
