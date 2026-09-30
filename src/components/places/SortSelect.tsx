"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SortOption } from "@/types";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "best-overall", label: "Best overall" },
  { value: "most-popular", label: "Most popular" },
  { value: "most-reviewed", label: "Most reviewed" },
  { value: "highest-rated", label: "Highest rated" },
  { value: "most-photos", label: "Most photos" },
  { value: "recently-updated", label: "Recently updated" },
  { value: "name-az", label: "Name (A–Z)" },
  { value: "newest", label: "Newest" },
];

export function SortSelect({ currentSort }: { currentSort: SortOption }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function handleChange(value: string | null) {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    if (value === "best-overall") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <Select value={currentSort} onValueChange={handleChange}>
      <SelectTrigger className="w-auto min-w-[175px] border-line text-sm rounded-[var(--radius-btn)]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {SORT_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
