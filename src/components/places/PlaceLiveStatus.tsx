"use client";

import { useEffect, useState } from "react";
import { Place } from "@/types";
import { getPlaceStatus, getTodayHoursLabel, PlaceStatus } from "@/lib/listings";

const CHIP_BASE =
  "absolute top-2 left-2 px-2 py-0.5 text-[11px] font-medium text-white rounded-[var(--radius-pill)] leading-tight";

function chipClass(type: PlaceStatus["type"]): string {
  switch (type) {
    case "open":
      return `${CHIP_BASE} bg-gulf-700`;
    case "closes-soon":
      return `${CHIP_BASE} bg-sunset-500`;
    case "closed":
      return `${CHIP_BASE} bg-gulf-900/80`;
    default:
      return `${CHIP_BASE} bg-ink-600/80`;
  }
}

/** Time-based status, computed after mount to avoid SSR/client clock mismatch. */
export function StatusChip({ place }: { place: Place }) {
  const [status, setStatus] = useState<PlaceStatus | null>(null);

  useEffect(() => {
    setStatus(getPlaceStatus(place));
  }, [place]);

  if (!status) {
    return <span className={`${CHIP_BASE} bg-gulf-900/80`}>Checking hours</span>;
  }

  return <span className={chipClass(status.type)}>{status.label}</span>;
}

export function TodayHours({ place }: { place: Place }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    setLabel(getTodayHoursLabel(place));
  }, [place]);

  return <span className="text-[12px] text-ink-600">Today: {label ?? "—"}</span>;
}

export function StatusBadge({ place }: { place: Place }) {
  const [status, setStatus] = useState<PlaceStatus | null>(null);

  useEffect(() => {
    setStatus(getPlaceStatus(place));
  }, [place]);

  if (!status) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-[var(--radius-pill)] text-sm font-medium bg-gray-50 text-ink-600 border border-line">
        Checking hours
      </span>
    );
  }

  const className = [
    "inline-flex items-center px-3 py-1 rounded-[var(--radius-pill)] text-sm font-medium",
    status.type === "open"
      ? "bg-gulf-50 text-gulf-700 border border-gulf-700/30"
      : status.type === "closes-soon"
        ? "bg-orange-50 text-sunset-500 border border-sunset-500/30"
        : "bg-gray-50 text-ink-600 border border-line",
  ].join(" ");

  return <span className={className}>{status.label}</span>;
}
