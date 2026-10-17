"use client";

import dynamic from "next/dynamic";
import { coordsInPmtilesBbox } from "@/data/map-tiles";

const PlaceMap = dynamic(() => import("./PlaceMap"), {
  ssr: false,
  loading: () => (
    <div className="space-y-2">
      <div className="w-full h-52 sm:h-56 rounded-[var(--radius-img)] border border-line bg-gulf-50" />
      <span className="inline-flex text-sm text-ink-600">Loading map…</span>
    </div>
  ),
});

type Props = {
  lat: number;
  lng: number;
  title: string;
  mapsUrl: string;
};

export function PlaceMapSection({ lat, lng, title, mapsUrl }: Props) {
  if (!coordsInPmtilesBbox(lat, lng)) {
    return (
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-sm font-medium text-gulf-700 hover:text-gulf-500 transition-hover"
      >
        Open in Google Maps
      </a>
    );
  }

  return <PlaceMap lat={lat} lng={lng} title={title} mapsUrl={mapsUrl} />;
}
