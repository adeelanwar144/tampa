import Link from "next/link";
import { directoryCta, primaryNav } from "@/config/nav";

const FOOTER_NAV = [
  {
    heading: "Explore",
    links: [...primaryNav, directoryCta, { label: "Search", href: "/search" }],
  },
  {
    heading: "Categories",
    links: [
      { label: "Food & drink", href: "/directory/food-drink" },
      { label: "Bars & nightlife", href: "/directory/bars-nightlife" },
      { label: "Beaches & outdoors", href: "/directory/beaches-outdoors" },
      { label: "Attractions", href: "/directory/attractions" },
      { label: "Shopping", href: "/directory/shopping" },
      { label: "Services", href: "/directory/services" },
    ],
  },
  {
    heading: "Visitor info",
    links: [
      { label: "Getting around", href: "/getting-around" },
      { label: "Parking", href: "/getting-around#parking" },
      { label: "Beaches", href: "/outdoors-beaches" },
      { label: "Events", href: "/events" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy policy", href: "/privacy-policy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-gulf-900 text-white/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-10">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <div className="marigold-rule pt-3 mb-3">
              <h3 className="font-display font-700 text-white text-base">
                Tampa Bay Guide
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-white/60 max-w-[220px]">
              An independent guide to eating, drinking, and getting outside in Tampa, Florida.
            </p>
          </div>

          {FOOTER_NAV.map((col) => (
            <div key={col.heading}>
              <div className="marigold-rule pt-3 mb-3">
                <h3 className="font-display font-600 text-white text-sm tracking-tight">
                  {col.heading}
                </h3>
              </div>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 hover:text-white transition-hover"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 space-y-3">
          <p className="text-xs text-white/50 max-w-2xl leading-relaxed">
            We&apos;re an independent local guide with no affiliation to the businesses listed.
            Listings are curated by hand and we collect no personal information.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-white/40">
            <span>© 2026 Tampa Bay Guide</span>
            <Link href="/privacy-policy" className="hover:text-white/70 transition-hover">
              Privacy policy
            </Link>
            <Link href="/terms" className="hover:text-white/70 transition-hover">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
