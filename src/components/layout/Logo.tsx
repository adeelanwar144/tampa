import Link from "next/link";
import { focusRing, motion150 } from "@/components/layout/nav";

export function Logo() {
  return (
    <Link
      href="/"
      className={`flex shrink-0 items-center gap-2.5 rounded-[10px] ${focusRing} ${motion150}`}
    >
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#0B5E6B] font-display text-[20px] font-semibold text-white"
      >
        T
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[22px] font-bold tracking-tight text-[#08343C]">
          Tampa Bay Guide
        </span>
        <span className="mt-0.5 text-[11px] text-[#4A626A]">Ben Guide</span>
      </span>
    </Link>
  );
}
