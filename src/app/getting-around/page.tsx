import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Getting around — Tampa Bay Guide",
  description: "Notes on getting around Tampa. More soon.",
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
