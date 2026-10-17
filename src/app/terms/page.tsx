import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms — Tampa Bay Guide",
  description: "Terms for Tampa Bay Guide are not published yet.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="font-display font-800 text-[38px] md:text-[52px] text-gulf-900 mb-6">
        Terms
      </h1>
      <p className="text-ink-600 leading-relaxed">Terms are not published yet.</p>
    </div>
  );
}
