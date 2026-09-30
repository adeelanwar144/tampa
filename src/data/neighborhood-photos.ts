import { NEIGHBORHOODS } from "@/lib/listings";

export const NEIGHBORHOOD_PHOTOS: Record<(typeof NEIGHBORHOODS)[number], { src: string; alt: string }> = {
  "Ybor City": {
    src: "https://images.unsplash.com/photo-1696377968227-6cd89ea0e40f?auto=format&fit=crop&w=800&q=80",
    alt: "A streetcar on 7th Avenue at night in Ybor City, Tampa",
  },
  Downtown: {
    src: "https://images.unsplash.com/photo-1585463857724-eb1a3e57ef06?auto=format&fit=crop&w=800&q=80",
    alt: "Downtown Tampa skyline across the water at night",
  },
  "Channel District": {
    src: "https://images.unsplash.com/photo-1496372412473-e8548ffd82bc?auto=format&fit=crop&w=800&q=80",
    alt: "Waterfront walkway near Tampa’s Channel District",
  },
  "Hyde Park": {
    src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80",
    alt: "Tree-lined park path in a residential Tampa neighborhood",
  },
  SoHo: {
    src: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=800&q=80",
    alt: "Storefronts along a walkable shopping street",
  },
  "Davis Islands": {
    src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    alt: "Sandy shoreline and water along Tampa Bay",
  },
  "Seminole Heights": {
    src: "https://images.unsplash.com/photo-1568605114967-8130f19cd214?auto=format&fit=crop&w=800&q=80",
    alt: "Craftsman-style house typical of Seminole Heights",
  },
  "Tampa Heights": {
    src: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=800&q=80",
    alt: "City buildings at dusk near Tampa Heights",
  },
  "Palma Ceia": {
    src: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
    alt: "A quiet residential street of houses and palms",
  },
  Westshore: {
    src: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
    alt: "Modern office towers in a business district",
  },
  Riverwalk: {
    src: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=800&q=80",
    alt: "People along a sunny waterfront path",
  },
  "Sulphur Springs": {
    src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=800&q=80",
    alt: "A wooded greenway near Sulphur Springs",
  },
  "Temple Terrace": {
    src: "https://images.unsplash.com/photo-1504567961542-e24d9439a724?auto=format&fit=crop&w=800&q=80",
    alt: "Sunlight through trees in a suburban Tampa park",
  },
  "Ballast Point": {
    src: "https://images.unsplash.com/photo-1490122417551-6ee9691429d0?auto=format&fit=crop&w=800&q=80",
    alt: "Bay water and a shoreline park at Ballast Point",
  },
};

export function neighborhoodSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export function neighborhoodFromSlug(slug: string) {
  return NEIGHBORHOODS.find((name) => neighborhoodSlug(name) === slug);
}
