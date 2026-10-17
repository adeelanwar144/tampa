import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy — Tampa Bay Guide",
  description: "The privacy policy for Tampa Bay Guide is not published yet.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="font-display font-800 text-[38px] md:text-[52px] text-gulf-900 mb-6">
        Privacy policy
      </h1>
      <p className="text-ink-600 leading-relaxed">
        The privacy policy is not published yet. The newsletter form on this site asks for an email
        address; nothing is sent until that form is connected to a provider.
      </p>
    </div>
  );
}
