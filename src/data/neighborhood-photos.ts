import { ANCHOR_NEIGHBORHOODS, neighborhoodFromSlug as fromSlug, neighborhoodSlug as toSlug } from "@/data/neighborhoods";

export const NEIGHBORHOOD_PHOTOS: Record<string, { src: string; alt: string }> = {
  "Ybor City": {
    src: "https://images.unsplash.com/photo-1696377968227-6cd89ea0e40f?auto=format&fit=crop&w=800&q=80",
    alt: "A streetcar on 7th Avenue at night in Ybor City, Tampa",
  },
  "Downtown Tampa": {
    src: "https://images.unsplash.com/photo-1585463857724-eb1a3e57ef06?auto=format&fit=crop&w=800&q=80",
    alt: "Downtown Tampa skyline across the water at night",
  },
  "Channel District": {
    src: "https://images.unsplash.com/photo-1496372412473-e8548ffd82bc?auto=format&fit=crop&w=800&q=80",
    alt: "Waterfront walkway near Tampa’s Channel District",
  },
  "Tampa Heights": {
    src: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=800&q=80",
    alt: "City buildings at dusk near Tampa Heights",
  },
  "Davis Islands": {
    src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    alt: "Sandy shoreline and water along Tampa Bay",
  },
  "Hyde Park": {
    src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80",
    alt: "Tree-lined park path in a residential Tampa neighborhood",
  },
  "Bayshore / Ballast Point": {
    src: "https://images.unsplash.com/photo-1490122417551-6ee9691429d0?auto=format&fit=crop&w=800&q=80",
    alt: "Bay water and a shoreline park at Ballast Point",
  },
  "Beach Park / MacDill": {
    src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    alt: "Palm-lined South Tampa street near Beach Park",
  },
  Westshore: {
    src: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
    alt: "Modern office towers in a business district",
  },
  "West Tampa": {
    src: "https://images.unsplash.com/photo-1568605114967-8130f19cd214?auto=format&fit=crop&w=800&q=80",
    alt: "Craftsman-style house typical of West Tampa and nearby historic blocks",
  },
  "Seminole Heights": {
    src: "https://images.unsplash.com/photo-1568605114967-8130f19cd214?auto=format&fit=crop&w=800&q=80",
    alt: "Craftsman-style house typical of Seminole Heights",
  },
  "Sulphur Springs": {
    src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=800&q=80",
    alt: "A wooded greenway near Sulphur Springs",
  },
  "New Tampa": {
    src: "https://images.unsplash.com/photo-1504567961542-e24d9439a724?auto=format&fit=crop&w=800&q=80",
    alt: "Sunlight through trees in a suburban Tampa park",
  },
  "East Tampa": {
    src: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=800&q=80",
    alt: "City buildings at dusk on Tampa’s east side",
  },
};

export function neighborhoodSlug(name: string) {
  return toSlug(name);
}

export function neighborhoodFromSlug(slug: string) {
  return fromSlug(slug) ?? ANCHOR_NEIGHBORHOODS.find((n) => n.slug === slug)?.name;
}
