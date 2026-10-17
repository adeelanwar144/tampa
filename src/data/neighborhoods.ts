export type NeighborhoodBound = {
  lat: number;
  lng: number;
  radiusMeters: number;
};

/**
 * Verified neighborhood centroids (landmark / commonly recognized center),
 * not a bounding-box corner. Radii are the geo-fence used for Places Text Search.
 *
 * Sources: OSM Nominatim / Photon place centroids and named landmarks
 * (Centro Ybor, Tampa City Hall, Hyde Park Village, Ballast Point Park,
 * Cypress & Westshore, Wikipedia neighborhood coordinates where OSM drifted).
 */
export const neighborhoodBounds: Record<string, NeighborhoodBound> = {
  "ybor-city": { lat: 27.961, lng: -82.4411, radiusMeters: 1200 },
  "downtown-tampa": { lat: 27.9477, lng: -82.4572, radiusMeters: 1200 },
  "channel-district": { lat: 27.9435, lng: -82.4458, radiusMeters: 900 },
  "tampa-heights": { lat: 27.9652, lng: -82.457, radiusMeters: 1000 },
  "davis-islands": { lat: 27.922, lng: -82.4557, radiusMeters: 1200 },
  "hyde-park": { lat: 27.9363, lng: -82.4758, radiusMeters: 1200 },
  "bayshore-ballast-point": { lat: 27.8932, lng: -82.4869, radiusMeters: 1800 },
  "beach-park-macdill": { lat: 27.94, lng: -82.5091, radiusMeters: 2200 },
  westshore: { lat: 27.9525, lng: -82.5239, radiusMeters: 1800 },
  "west-tampa": { lat: 27.958, lng: -82.486, radiusMeters: 1500 },
  "seminole-heights": { lat: 27.9936, lng: -82.4614, radiusMeters: 1800 },
  "sulphur-springs": { lat: 28.0214, lng: -82.4514, radiusMeters: 1500 },
  "new-tampa": { lat: 28.1167, lng: -82.3833, radiusMeters: 3000 },
  "east-tampa": { lat: 27.9756, lng: -82.4097, radiusMeters: 2500 },
};

export const neighborhoodNames: Record<keyof typeof neighborhoodBounds, string> = {
  "ybor-city": "Ybor City",
  "downtown-tampa": "Downtown Tampa",
  "channel-district": "Channel District",
  "tampa-heights": "Tampa Heights",
  "davis-islands": "Davis Islands",
  "hyde-park": "Hyde Park",
  "bayshore-ballast-point": "Bayshore / Ballast Point",
  "beach-park-macdill": "Beach Park / MacDill",
  westshore: "Westshore",
  "west-tampa": "West Tampa",
  "seminole-heights": "Seminole Heights",
  "sulphur-springs": "Sulphur Springs",
  "new-tampa": "New Tampa",
  "east-tampa": "East Tampa",
};

export type AnchorNeighborhood = {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  radiusM: number;
};

export const ANCHOR_NEIGHBORHOODS: AnchorNeighborhood[] = (
  Object.keys(neighborhoodBounds) as Array<keyof typeof neighborhoodBounds>
).map((slug) => {
  const bound = neighborhoodBounds[slug];
  return {
    slug,
    name: neighborhoodNames[slug],
    lat: bound.lat,
    lng: bound.lng,
    radiusM: bound.radiusMeters,
  };
});

export const NEIGHBORHOODS = ANCHOR_NEIGHBORHOODS.map((n) => n.name);

export function neighborhoodSlug(name: string) {
  const found = ANCHOR_NEIGHBORHOODS.find((n) => n.name === name);
  if (found) return found.slug;
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function neighborhoodFromSlug(slug: string) {
  return ANCHOR_NEIGHBORHOODS.find((n) => n.slug === slug)?.name;
}
