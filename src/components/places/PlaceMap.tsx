"use client";

import { useEffect, useId, useRef, useState } from "react";
import { coordsInPmtilesBbox, PMTILES_PUBLIC_PATH } from "@/data/map-tiles";

const ATTRIBUTION =
  '<a href="https://protomaps.com" target="_blank" rel="noopener noreferrer">Protomaps</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>';

type Props = {
  lat: number;
  lng: number;
  title: string;
  mapsUrl: string;
};

function MapsLink({ mapsUrl }: { mapsUrl: string }) {
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

export function PlaceMap({ lat, lng, title, mapsUrl }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [zoomHint, setZoomHint] = useState(true);
  const labelId = useId();
  const inTiles = coordsInPmtilesBbox(lat, lng);

  useEffect(() => {
    if (!inTiles) return;
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inTiles]);

  useEffect(() => {
    if (!visible || !inTiles) return;
    const el = containerRef.current;
    if (!el) return;
    let cancelled = false;
    let map: import("maplibre-gl").Map | undefined;
    let marker: import("maplibre-gl").Marker | undefined;

    void (async () => {
      const [maplibregl, { Protocol }, { layers, namedFlavor }] = await Promise.all([
        import("maplibre-gl"),
        import("pmtiles"),
        import("@protomaps/basemaps"),
      ]);
      await import("maplibre-gl/dist/maplibre-gl.css");
      if (cancelled || !containerRef.current) return;

      const protocolKey = "__tampaPmtilesProtocol";
      const g = globalThis as typeof globalThis & { [protocolKey]?: boolean };
      if (!g[protocolKey]) {
        maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
        const protocol = new Protocol();
        maplibregl.addProtocol("pmtiles", protocol.tile);
        g[protocolKey] = true;
      }

      const tilesUrl = `${window.location.origin}${PMTILES_PUBLIC_PATH}`;
      map = new maplibregl.Map({
        container: containerRef.current,
        style: {
          version: 8,
          glyphs: "/map-assets/fonts/{fontstack}/{range}.pbf",
          sprite: "/map-assets/sprites/v4/light",
          sources: {
            protomaps: {
              type: "vector",
              url: `pmtiles://${tilesUrl}`,
              attribution: ATTRIBUTION,
            },
          },
          layers: layers("protomaps", namedFlavor("light"), { lang: "en" }),
        },
        center: [lng, lat],
        zoom: 15,
        minZoom: 8,
        maxZoom: 16,
        scrollZoom: false,
        attributionControl: { compact: true },
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      marker = new maplibregl.Marker({ color: "#0B5E6B" }).setLngLat([lng, lat]).addTo(map);

      const enableZoom = () => {
        map?.scrollZoom.enable();
        setZoomHint(false);
      };
      const disableZoom = () => {
        map?.scrollZoom.disable();
        setZoomHint(true);
      };
      const node = containerRef.current;
      node.addEventListener("click", enableZoom);
      node.addEventListener("focusin", enableZoom);
      node.addEventListener("mouseleave", disableZoom);
      map.on("remove", () => {
        node.removeEventListener("click", enableZoom);
        node.removeEventListener("focusin", enableZoom);
        node.removeEventListener("mouseleave", disableZoom);
      });
    })();

    return () => {
      cancelled = true;
      marker?.remove();
      map?.remove();
    };
  }, [visible, inTiles, lat, lng]);

  if (!inTiles) {
    return <MapsLink mapsUrl={mapsUrl} />;
  }

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        role="img"
        aria-labelledby={labelId}
        tabIndex={0}
        className="relative w-full h-52 sm:h-56 rounded-[var(--radius-img)] border border-line overflow-hidden bg-gulf-50 outline-none focus-visible:ring-2 focus-visible:ring-gulf-500"
      >
        <span id={labelId} className="sr-only">
          Map of {title}
        </span>
        {visible && zoomHint ? (
          <p className="pointer-events-none absolute left-2 bottom-8 z-10 rounded-[var(--radius-btn)] bg-white/90 px-2 py-1 text-[11px] text-ink-600 shadow-sm">
            Click or tap the map to zoom
          </p>
        ) : null}
      </div>
      <MapsLink mapsUrl={mapsUrl} />
    </div>
  );
}

export default PlaceMap;
