import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Tampa Bay Guide",
  description: "Tampa Bay Guide is Ben's independent local guide to Tampa.",
};

const personLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Ben",
  url: "https://tampabayguide.com/about",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }} />
      <h1 className="font-display font-800 text-[38px] md:text-[52px] text-gulf-900 mb-6">
        About Ben
      </h1>
      <p className="text-ink-600 leading-relaxed mb-6">
        Tampa Bay Guide is Ben&apos;s independent local guide to Tampa. The places here are ones he
        has visited.
      </p>
      {/* PASTE BEN'S BIO HERE — do not invent details */}
      <p className="text-ink-600 leading-relaxed rounded-[var(--radius-card)] border border-dashed border-line bg-gulf-50 px-4 py-3">
        [Paste Ben&apos;s bio here]
      </p>
    </div>
  );
}
