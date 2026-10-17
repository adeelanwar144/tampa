-- Additive columns + address-components table for existing D1 databases.
-- Safe to re-run only if columns are missing; SQLite ALTER TABLE ADD COLUMN
-- fails when the column already exists.

ALTER TABLE places ADD COLUMN utc_offset_minutes INTEGER;
ALTER TABLE places ADD COLUMN delivery INTEGER;
ALTER TABLE places ADD COLUMN takeout INTEGER;
ALTER TABLE places ADD COLUMN dine_in INTEGER;
ALTER TABLE places ADD COLUMN wheelchair_accessible INTEGER;

CREATE TABLE IF NOT EXISTS place_address_components (
  place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  long_name TEXT,
  short_name TEXT,
  PRIMARY KEY (place_id, type)
);

CREATE INDEX IF NOT EXISTS idx_place_address_components_place
  ON place_address_components(place_id);

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
  ('east-tampa', 'East Tampa');
