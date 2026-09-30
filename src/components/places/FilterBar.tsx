"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_LABELS, NEIGHBORHOODS } from "@/lib/listings";
import { CategorySlug } from "@/types";

const CATEGORIES: { slug: CategorySlug; label: string }[] = (
  Object.entries(CATEGORY_LABELS) as [CategorySlug, string][]
).map(([slug, label]) => ({ slug, label }));

interface Props {
  currentCategory?: string;
  currentNeighborhood?: string;
  currentQ?: string;
  currentOpen?: boolean;
}

export function FilterBar({
  currentCategory,
  currentNeighborhood,
  currentQ = "",
  currentOpen = false,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [inputValue, setInputValue] = useState(currentQ);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      params.delete("page");
      return params.toString();
    },
    [searchParams]
  );

  function navigate(updates: Record<string, string | null>) {
    const qs = createQueryString(updates);
    startTransition(() => {
      router.push(`${pathname}${qs ? `?${qs}` : ""}`);
    });
  }

  function handleSearch(value: string) {
    setInputValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      navigate({ q: value || null });
    }, 300);
  }

  function handleClearAll() {
    setInputValue("");
    startTransition(() => {
      router.push(pathname);
    });
  }

  const hasFilters = !!(currentCategory || currentNeighborhood || currentQ || currentOpen);
  const activeFilters: { label: string; removeKey: string }[] = [];
  if (currentCategory)
    activeFilters.push({
      label: CATEGORY_LABELS[currentCategory as CategorySlug],
      removeKey: "category",
    });
  if (currentNeighborhood)
    activeFilters.push({ label: currentNeighborhood, removeKey: "neighborhood" });
  if (currentQ) activeFilters.push({ label: `"${currentQ}"`, removeKey: "q" });
  if (currentOpen) activeFilters.push({ label: "Open now", removeKey: "open" });

  return (
    <div className="bg-white border-b border-line sticky top-[72px] z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => navigate({ category: null })}
            className={[
              "flex-shrink-0 px-4 py-1.5 rounded-[var(--radius-pill)] text-sm font-medium border transition-hover",
              !currentCategory
                ? "bg-gulf-700 text-white border-gulf-700"
                : "bg-white text-gulf-900 border-line hover:border-gulf-500",
            ].join(" ")}
          >
            All
          </button>
          {CATEGORIES.map(({ slug, label }) => (
            <button
              key={slug}
              onClick={() => navigate({ category: currentCategory === slug ? null : slug })}
              className={[
                "flex-shrink-0 px-4 py-1.5 rounded-[var(--radius-pill)] text-sm font-medium border transition-hover whitespace-nowrap",
                currentCategory === slug
                  ? "bg-gulf-700 text-white border-gulf-700"
                  : "bg-white text-gulf-900 border-line hover:border-gulf-500",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <Select
            value={currentNeighborhood ?? "__all__"}
            onValueChange={(val) => {
              if (!val) return;
              navigate({ neighborhood: val === "__all__" ? null : val });
            }}
          >
            <SelectTrigger className="w-auto min-w-[160px] border-line text-sm rounded-[var(--radius-btn)]">
              <SelectValue placeholder="All neighborhoods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All neighborhoods</SelectItem>
              {NEIGHBORHOODS.map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-600 pointer-events-none"
            />
            <Input
              type="search"
              placeholder="Search places, food, neighborhoods"
              value={inputValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 text-sm border-line rounded-[var(--radius-btn)] focus-visible:ring-gulf-500"
              aria-label="Search places"
            />
          </div>

          <button
            onClick={() => navigate({ open: currentOpen ? null : "true" })}
            className={[
              "px-4 py-2 rounded-[var(--radius-pill)] text-sm font-medium border transition-hover",
              currentOpen
                ? "bg-gulf-50 text-gulf-700 border-gulf-700"
                : "bg-white text-gulf-900 border-line hover:border-gulf-500",
            ].join(" ")}
          >
            Open now
          </button>
        </div>

        {hasFilters && (
          <div className="flex flex-wrap gap-2 items-center">
            {activeFilters.map((f) => (
              <span
                key={f.removeKey}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-pill)] text-xs font-medium bg-gulf-50 text-gulf-700 border border-gulf-700/30"
              >
                {f.label}
                <button
                  onClick={() => navigate({ [f.removeKey]: null })}
                  aria-label={`Remove ${f.label} filter`}
                  className="hover:text-gulf-500 transition-hover"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <button
              onClick={handleClearAll}
              className="text-xs font-medium text-gulf-700 hover:text-gulf-500 transition-hover ml-1 underline underline-offset-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
