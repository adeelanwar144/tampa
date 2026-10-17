/** Tampa Bay extract from build.protomaps.com/20261003.pmtiles. */
export const PMTILES_VERSION = "2026-10-03";
export const PMTILES_R2_KEY = "maps/tampa.pmtiles";
export const PMTILES_PUBLIC_PATH = `/api/photos/maps/tampa-${PMTILES_VERSION}.pmtiles`;

/** west,south,east,north — matches scripts/extract-tampa-pmtiles.ts */
export const PMTILES_BBOX = {
  west: -82.78,
  south: 27.62,
  east: -82.18,
  north: 28.18,
} as const;

export const PMTILES_ALIASES: Record<string, string> = {
  [`maps/tampa-${PMTILES_VERSION}.pmtiles`]: PMTILES_R2_KEY,
};

export function coordsInPmtilesBbox(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lng >= PMTILES_BBOX.west &&
    lng <= PMTILES_BBOX.east &&
    lat >= PMTILES_BBOX.south &&
    lat <= PMTILES_BBOX.north
  );
}
