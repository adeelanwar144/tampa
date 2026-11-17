import type { ListingSeoContent } from "@/lib/listing-content";
import type { Hours, Place } from "@/types";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function schemaType(place: Place): string {
  if (place.category === "food-drink") return "Restaurant";
  if (place.category === "bars-nightlife") return "BarOrPub";
  if (place.category === "hotels-lodging") return "Hotel";
  if (place.category === "attractions") return "TouristAttraction";
  if (place.category === "beaches-outdoors") return "TouristAttraction";
  if (place.category === "shopping") return "Store";
  return "LocalBusiness";
}

function hoursForSchema(place: Place, listing?: ListingSeoContent | null): Hours | null {
  if (listing?.hoursMode === "call") return null;
  if (listing?.hoursMode === "verified" && listing.openingHours) {
    const hours: Hours = {};
    for (const [day, value] of Object.entries(listing.openingHours)) {
      const index = Number(day);
      if (!Number.isInteger(index) || index < 0 || index > 6) continue;
      if ("closed" in value || "label" in value) continue;
      hours[index] = { open: value.open, close: value.close };
    }
    return hours;
  }
  return place.hours;
}

function openingHours(hours: Hours) {
  return Object.entries(hours)
    .map(([day, hours]) => {
      if (!hours) return null;
      const index = Number(day);
      return {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: DAY_NAMES[index] ?? undefined,
        opens: hours.open,
        closes: hours.close,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

export function placeJsonLd(place: Place, listing?: ListingSeoContent | null) {
  const source = hoursForSchema(place, listing);
  const hours = source ? openingHours(source) : [];
  return {
    "@context": "https://schema.org",
    "@type": listing?.schemaType || schemaType(place),
    name: place.name,
    description: place.tagline || undefined,
    address: place.address
      ? { "@type": "PostalAddress", streetAddress: place.address }
      : undefined,
    geo:
      place.lat && place.lng
        ? { "@type": "GeoCoordinates", latitude: place.lat, longitude: place.lng }
        : undefined,
    telephone: place.phone || undefined,
    url: place.website || undefined,
    ...(hours.length ? { openingHoursSpecification: hours } : {}),
    ...(place.rating > 0 && place.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: place.rating,
            reviewCount: place.reviewCount,
          },
        }
      : {}),
    ...(place.neighborhood
      ? { containedInPlace: { "@type": "Place", name: place.neighborhood } }
      : {}),
  };
}

export function faqJsonLd(faq: Array<{ q: string; a: string }>) {
  if (faq.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}
