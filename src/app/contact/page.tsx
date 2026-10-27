import type { Metadata } from "next";
import { withSiteName } from "@/config/site";

export const metadata: Metadata = {
  title: withSiteName("Contact Me"),
  description:
    "Email me at contact@visitintampa.com if you have a question, a correction, or a place I should cover. I read those notes and use them to fix the guide.",
};

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="font-display font-800 text-[38px] md:text-[52px] text-gulf-900 mb-6">
        Contact Me
      </h1>
      <p className="text-ink-600 leading-relaxed">
        Have a question, a correction, or a place I should cover? Email me at{" "}
        <a
          href="mailto:contact@visitintampa.com"
          className="text-gulf-700 underline underline-offset-2 hover:text-gulf-500"
        >
          contact@visitintampa.com
        </a>
        .
      </p>
    </div>
  );
}
