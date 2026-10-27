import type { Metadata } from "next";
import { withSiteName } from "@/config/site";

export const metadata: Metadata = {
  title: withSiteName("Getting around"),
  description: "Getting around is how I move through Tampa: driving between neighborhoods, the streetcar from downtown to Ybor, and parking before you set out.",
};

export default function GettingAroundPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="font-display font-800 text-[38px] md:text-[52px] text-gulf-900 mb-6">
        Getting around
      </h1>
      <p className="text-ink-600 leading-relaxed">More soon.</p>
    </div>
  );
}
