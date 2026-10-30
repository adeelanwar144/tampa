-- Flag places whose listing essay is quarantined. Filter with SQL instead of listing R2.
ALTER TABLE places ADD COLUMN listing_quarantined INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_places_listing_quarantined ON places(listing_quarantined);
