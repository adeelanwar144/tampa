import Link from "next/link";
import { Search } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { DesktopNav } from "@/components/layout/DesktopNav";
import { MobileNav } from "@/components/layout/MobileNav";
import { directoryCta } from "@/config/nav";
import { listedNavItems } from "@/lib/menu";
import { focusRing, motion150 } from "@/components/layout/nav";

export function Header() {
  const items = listedNavItems();
  return (
    <header className="sticky top-0 z-50 h-20 border-b border-[#DCE4E3] bg-white/95 backdrop-blur-sm lg:h-24">
      <div className="mx-auto flex h-full max-w-[1400px] flex-nowrap items-center gap-2 px-3 sm:gap-3 sm:px-4 lg:gap-4 lg:px-6 xl:gap-6">
        <Logo />
        <div className="hidden min-w-0 flex-1 justify-center lg:flex">
          <HeaderSearch />
        </div>
        <DesktopNav items={items} />
        <DesktopNav items={items} compact />
        <Link
          href={directoryCta.href}
          className={`hidden shrink-0 whitespace-nowrap rounded-full bg-[#0B5E6B] px-4 py-2.5 text-[15px] font-semibold text-white lg:inline-flex xl:px-6 ${motion150} hover:bg-[#08343C] ${focusRing}`}
        >
          {directoryCta.label}
        </Link>
        <div className="ml-auto flex shrink-0 items-center lg:hidden">
          <Link
            href="/search"
            aria-label="Search"
            className={`flex size-10 items-center justify-center rounded-[10px] text-[#08343C] ${motion150} hover:text-[#0B5E6B] ${focusRing}`}
          >
            <Search size={20} />
          </Link>
          <MobileNav items={items} />
        </div>
      </div>
    </header>
  );
}
