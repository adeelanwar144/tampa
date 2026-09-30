"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { directoryCta, isNavActive, primaryNav } from "@/config/nav";
import { focusRing, motion150 } from "@/components/layout/nav";

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Open menu"
        className={`lg:hidden flex size-10 items-center justify-center rounded-[10px] text-[#08343C] ${motion150} hover:text-[#0B5E6B] ${focusRing}`}
      >
        <Menu size={22} />
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-[320px] max-w-[320px] flex-col gap-0 bg-white p-0 sm:max-w-[320px]"
      >
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>

        <form action="/search" method="get" className="border-b border-[#DCE4E3] p-4" role="search">
          <label htmlFor="mobile-search" className="sr-only">
            Search places, food, neighborhoods
          </label>
          <div className="relative">
            <Search
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#4A626A]"
            />
            <input
              id="mobile-search"
              type="search"
              name="q"
              placeholder="Search places, food, neighborhoods"
              className={`h-11 w-full rounded-full border border-[#DCE4E3] bg-[#F2F5F4] pr-4 pl-10 text-sm text-[#08343C] placeholder:text-[#4A626A] ${motion150} focus:border-[#1B8B99] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0B5E6B]/10`}
            />
          </div>
        </form>

        <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Mobile navigation">
          <div className="flex flex-col">
            {primaryNav.map((item) => {
              const active = isNavActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "rounded-md px-3 py-3 text-[16px] font-medium",
                    motion150,
                    focusRing,
                    active
                      ? "text-[#0B5E6B] bg-[#E8F2F3]"
                      : "text-[#08343C] hover:bg-[#E8F2F3] hover:text-[#0B5E6B]",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="mt-auto border-t border-[#DCE4E3] p-4">
          <Link
            href={directoryCta.href}
            className={`flex w-full items-center justify-center rounded-full bg-[#0B5E6B] px-6 py-2.5 text-[15px] font-semibold text-white ${motion150} hover:bg-[#08343C] ${focusRing}`}
          >
            {directoryCta.label}
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
