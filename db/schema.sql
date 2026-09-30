-- Tampa Bay Guide — D1 schema
-- Apply with: wrangler d1 execute tampa-bay-guide --file=db/schema.sql
--            wrangler d1 execute tampa-bay-guide --local --file=db/schema.sql

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS neighborhoods (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

INSERT OR IGNORE INTO neighborhoods (slug, name) VALUES
  ('ybor-city', 'Ybor City'),
  ('downtown', 'Downtown'),
  ('channel-district', 'Channel District'),
  ('hyde-park', 'Hyde Park'),
  ('soho', 'SoHo'),
  ('davis-islands', 'Davis Islands'),
  ('seminole-heights', 'Seminole Heights'),
  ('tampa-heights', 'Tampa Heights'),
  ('palma-ceia', 'Palma Ceia'),
  ('westshore', 'Westshore'),
  ('riverwalk', 'Riverwalk'),
  ('sulphur-springs', 'Sulphur Springs'),
  ('temple-terrace', 'Temple Terrace'),
  ('ballast-point', 'Ballast Point');

CREATE TABLE IF NOT EXISTS places (
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
  tagline TEXT,
  description TEXT,
  status TEXT DEFAULT 'draft',
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

CREATE INDEX IF NOT EXISTS idx_places_neighborhood ON places(neighborhood_slug);
CREATE INDEX IF NOT EXISTS idx_places_status ON places(status);
CREATE INDEX IF NOT EXISTS idx_place_images_place ON place_images(place_id);
CREATE INDEX IF NOT EXISTS idx_place_reviews_place ON place_reviews(place_id);
