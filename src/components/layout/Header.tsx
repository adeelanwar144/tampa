import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { DesktopNav } from "@/components/layout/DesktopNav";
import { MobileNav } from "@/components/layout/MobileNav";
import { directoryCta } from "@/config/nav";
import { focusRing, motion150 } from "@/components/layout/nav";

export function Header() {
  return (
    <header className="sticky top-0 z-50 h-[72px] border-b border-[#DCE4E3] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-[1400px] items-center gap-8 px-6">
        <Logo />
        <div className="hidden min-w-0 flex-1 justify-center lg:flex">
          <HeaderSearch />
        </div>
        <DesktopNav />
        <Link
          href={directoryCta.href}
          className={`hidden shrink-0 rounded-full bg-[#0B5E6B] px-6 py-2.5 text-[15px] font-semibold text-white lg:inline-flex ${motion150} hover:bg-[#08343C] ${focusRing}`}
        >
          {directoryCta.label}
        </Link>
        <div className="ml-auto lg:hidden">
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
