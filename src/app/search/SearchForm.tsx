"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchForm({ initialQ }: { initialQ: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQ);
  const [, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() => {
      const q = value.trim();
      router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="relative max-w-md">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-600 pointer-events-none"
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search places, food, neighborhoods"
        className="pl-9 border-line rounded-[var(--radius-btn)]"
        aria-label="Search"
      />
    </form>
  );
}
