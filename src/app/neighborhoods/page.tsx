import type { Metadata } from "next";
import Link from "next/link";
import { getNeighborhoodCounts, NEIGHBORHOODS } from "@/lib/listings";

export const metadata: Metadata = {
  title: "Neighborhoods — Tampa Bay Guide",
  description: "Browse Tampa places by neighborhood — Ybor City, Hyde Park, Seminole Heights, and more.",
};

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export default async function NeighborhoodsPage() {
  const counts = await getNeighborhoodCounts();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="font-display font-800 text-[38px] md:text-[52px] text-gulf-900 mb-3">
        Neighborhoods
      </h1>
      <p className="text-ink-600 mb-10 max-w-xl">
        Tampa is a city of distinct pockets. Each neighborhood has its own food, its own rhythm, and its own regulars.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {NEIGHBORHOODS.map((n) => (
          <Link
            key={n}
            href={`/neighborhoods/${slugify(n)}`}
            className="group bg-white border border-line rounded-[var(--radius-card)] p-5 hover:border-gulf-500 hover:-translate-y-0.5 transition-hover"
          >
            <h2 className="font-display font-700 text-[18px] text-gulf-900 group-hover:text-gulf-700">
              {n}
            </h2>
            <p className="text-sm text-ink-600 mt-1">
              {counts[n] ?? 0} {(counts[n] ?? 0) === 1 ? "place" : "places"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
