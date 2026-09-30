"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { focusRing, motion150 } from "@/components/layout/nav";

export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className="relative hidden h-[38px] w-full items-center justify-center px-12 sm:flex"
      style={{ background: "linear-gradient(90deg, #0B5E6B 0%, #08343C 100%)" }}
    >
      <p className="flex items-center gap-2 text-[13px] font-medium text-white">
        <span>New guide: where to eat in Ybor City</span>
        <span aria-hidden="true" className="text-[#7FB8C0]">
          •
        </span>
        <Link
          href="/places?category=food-drink"
          className={`text-[#F3C969] underline underline-offset-2 ${motion150} hover:text-white ${focusRing} rounded-sm`}
        >
          Food
        </Link>
        <Link
          href="/getting-around"
          className={`text-[#F3C969] underline underline-offset-2 ${motion150} hover:text-white ${focusRing} rounded-sm`}
        >
          Parking
        </Link>
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss announcement"
        className={`absolute top-1/2 right-4 -translate-y-1/2 rounded-sm text-[#7FB8C0] ${motion150} hover:text-white ${focusRing}`}
      >
        <X size={16} />
      </button>
    </div>
  );
}
