"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MORE_NAV_LABELS, isNavActive, primaryNav } from "@/config/nav";
import { focusRing, motion150 } from "@/components/layout/nav";

function itemClass(active: boolean) {
  return [
    "relative flex h-[72px] -mb-px items-center gap-1 text-[16px] font-medium",
    motion150,
    focusRing,
    "rounded-sm",
    active
      ? "text-[#0B5E6B] after:absolute after:right-0 after:bottom-0 after:left-0 after:h-[3px] after:bg-[#D8A02E]"
      : "text-[#08343C] hover:text-[#0B5E6B]",
  ].join(" ");
}

export function DesktopNav() {
  const pathname = usePathname();
  const moreItems = primaryNav.filter((item) =>
    (MORE_NAV_LABELS as readonly string[]).includes(item.label)
  );
  const topItems = primaryNav.filter(
    (item) => !(MORE_NAV_LABELS as readonly string[]).includes(item.label)
  );
  const moreActive = moreItems.some((item) => isNavActive(pathname, item.href));

  return (
    <nav className="hidden shrink-0 items-center gap-7 lg:flex" aria-label="Main navigation">
      {topItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={itemClass(isNavActive(pathname, item.href))}
        >
          {item.label}
        </Link>
      ))}

      <DropdownMenu>
        <DropdownMenuTrigger
          className={`${itemClass(moreActive)} data-popup-open:text-[#0B5E6B] [&[data-popup-open]_svg]:rotate-180 [&[data-open]_svg]:rotate-180`}
        >
          More
          <ChevronDown size={16} aria-hidden="true" className={`opacity-70 ${motion150}`} />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={0}
          className="min-w-[220px] rounded-xl border border-[#DCE4E3] bg-white p-2 shadow-lg"
        >
          {moreItems.map((item) => (
            <DropdownMenuItem
              key={item.href}
              render={<Link href={item.href} />}
              className={`cursor-pointer rounded-md px-3 py-2 text-[14px] text-[#08343C] ${motion150} hover:bg-[#E8F2F3] hover:text-[#0B5E6B] focus:bg-[#E8F2F3] focus:text-[#0B5E6B]`}
            >
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
