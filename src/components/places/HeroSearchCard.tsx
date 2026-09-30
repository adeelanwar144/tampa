"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_LABELS } from "@/lib/listings";
import { CategorySlug } from "@/types";

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All categories" },
  ...(Object.entries(CATEGORY_LABELS) as [CategorySlug, string][]).map(
    ([value, label]) => ({ value, label })
  ),
];

const motion = "motion-safe:transition-all motion-safe:duration-150 motion-safe:ease-out";
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B5E6B]";

export function HeroSearchCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "all");

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
    setCategory(searchParams.get("category") ?? "all");
  }, [searchParams]);

  function submit() {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = q.trim();
    if (trimmed) params.set("q", trimmed);
    else params.delete("q");

    if (category && category !== "all") params.set("category", category);
    else params.delete("category");

    params.delete("page");
    const qs = params.toString();
    startTransition(() => {
      router.push(`/places${qs ? `?${qs}` : ""}`);
    });
  }

  return (
    <div className="mx-auto mt-10 max-w-[1000px] rounded-2xl bg-[#F2F5F4] p-4 shadow-[0_18px_40px_-12px_rgba(8,52,60,0.45)]">
      <form
        className="flex flex-col items-stretch gap-3 md:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="relative min-w-0 flex-1">
          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-[18px] -translate-y-1/2 text-[#7C8D93]"
          />
          <label htmlFor="places-hero-search" className="sr-only">
            Search by name, food, or neighborhood
          </label>
          <input
            id="places-hero-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, food, or neighborhood"
            className={`h-[52px] w-full rounded-lg border border-[#DCE4E3] bg-white pl-11 pr-4 text-[16px] text-[#08343C] placeholder:text-[#7C8D93] ${motion} focus:border-[#0B5E6B] focus:ring-4 focus:ring-[#0B5E6B]/12 ${focusRing}`}
          />
        </div>

        <Select
          value={category}
          onValueChange={(val) => {
            if (val) setCategory(val);
          }}
          items={CATEGORY_OPTIONS}
        >
          <SelectTrigger
            aria-label="Category"
            className={`h-[52px] w-full rounded-lg border-[1.5px] border-[#0B5E6B] bg-white px-4 text-[16px] text-[#08343C] md:w-[240px] data-[size=default]:h-[52px] [&_svg]:text-[#08343C] ${motion} [&[data-popup-open]_svg]:rotate-180 [&[data-open]_svg]:rotate-180 ${focusRing}`}
          >
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent className="rounded-lg border border-[#DCE4E3] bg-white">
            {CATEGORY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-[15px]">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button
          type="submit"
          className={`inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-lg bg-[linear-gradient(135deg,#0B5E6B_0%,#1B8B99_100%)] text-[16px] font-semibold text-white md:w-[180px] ${motion} hover:bg-[linear-gradient(135deg,#08343C_0%,#0B5E6B_100%)] motion-safe:active:scale-[0.99] ${focusRing}`}
        >
          <Search size={18} aria-hidden="true" />
          Search
        </button>
      </form>
    </div>
  );
}
