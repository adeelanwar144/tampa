import type { Metadata } from "next";
import Link from "next/link";
import { withSiteName } from "@/config/site";

export const metadata: Metadata = {
  title: withSiteName("Terms & Conditions"),
  description:
    "These terms cover Visit In Tampa, what the travel notes are for, and why you should confirm hours and prices before you go. Effective October 22, 2026.",
};

const headingClass = "font-display font-700 text-[22px] text-gulf-900 mt-10 mb-3";
const bodyClass = "text-ink-600 leading-relaxed mb-4";
const linkClass = "text-gulf-700 underline underline-offset-2 hover:text-gulf-500";

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="font-display font-800 text-[38px] md:text-[52px] text-gulf-900 mb-6">
        Terms & Conditions
      </h1>
      <p className={bodyClass}>Effective Date: October 22, 2026</p>
      <p className={bodyClass}>
        Welcome to VisitInTampa.com. These Terms and Conditions govern your use of our website, run
        by Ben Hayes of Visit In Tampa (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;). By
        accessing or using the site, you agree to these terms. If you do not agree, please do not
        use the site.
      </p>

      <h2 className={headingClass}>1. About This Website</h2>
      <p className={bodyClass}>
        VisitInTampa.com is a travel guide that shares personal experiences, recommendations,
        itineraries and photos about Tampa, Florida and nearby destinations. The content is for
        general information and inspiration only.
      </p>

      <h2 className={headingClass}>2. Accuracy of Travel Information</h2>
      <p className={bodyClass}>
        We write about places, attractions, restaurants, hotels and events based on our own visits
        and research. Prices, opening hours, availability, entry rules and other details change
        often and without notice. We cannot guarantee that any information is current, complete or
        error-free. Always confirm details directly with the business or official source before you
        travel.
      </p>

      <h2 className={headingClass}>3. No Professional Advice</h2>
      <p className={bodyClass}>
        Nothing on this site is professional travel, legal, medical, financial or safety advice.
        You are responsible for your own travel decisions, including visas, travel insurance,
        health precautions and personal safety.
      </p>

      <h2 className={headingClass}>4. Third-Party Links and Services</h2>
      <p className={bodyClass}>
        Our site may link to third-party websites, booking platforms, tour operators and other
        services. We do not control and are not responsible for their content, products, prices,
        policies or practices. Any booking or purchase you make is solely between you and that
        third party.
      </p>

      <h2 className={headingClass}>5. Affiliate Links and Advertising</h2>
      <p className={bodyClass}>
        Some links on this site are affiliate links. If you click one and make a purchase, we may
        earn a small commission at no extra cost to you. We may also display ads served by third
        parties. We only recommend things we believe are useful, but sponsored or affiliate content
        does not mean a guarantee of quality.
      </p>

      <h2 className={headingClass}>6. Intellectual Property</h2>
      <p className={bodyClass}>
        All content on this site, including text, photos, videos, logos and design, belongs to Ben
        Hayes of Visit In Tampa unless otherwise stated, and is protected by copyright law. You may
        share links to our pages and quote short excerpts with clear credit and a link back. You
        may not copy, republish, sell or use our photos or articles for commercial purposes without
        our written permission.
      </p>

      <h2 className={headingClass}>7. User Conduct</h2>
      <p className={bodyClass}>
        When using the site, including comments or contact forms, you agree not to:
      </p>
      <ul className="mb-4 list-disc space-y-2 pl-5 text-ink-600 marker:text-gulf-700">
        <li>Post anything unlawful, abusive, defamatory, hateful or obscene</li>
        <li>Send spam, advertising or malicious code</li>
        <li>Impersonate another person or misrepresent your identity</li>
        <li>Attempt to interfere with the site&apos;s security or normal operation</li>
      </ul>
      <p className={bodyClass}>
        We may remove any user content or block access at our discretion.
      </p>

      <h2 className={headingClass}>8. User Submissions</h2>
      <p className={bodyClass}>
        If you send us comments, photos, tips or feedback, you confirm you have the right to share
        them. You give us a non-exclusive, royalty-free permission to use, edit and publish them on
        the site and our social channels, with credit where practical.
      </p>

      <h2 className={headingClass}>9. Limitation of Liability</h2>
      <p className={bodyClass}>
        The site and its content are provided &quot;as is&quot; without warranties of any kind. To
        the fullest extent permitted by law, we are not liable for any loss, injury, damage,
        delay, cost or inconvenience arising from your use of the site, your reliance on its
        content, or your dealings with any third party, including travel providers.
      </p>

      <h2 className={headingClass}>10. Indemnity</h2>
      <p className={bodyClass}>
        You agree to indemnify and hold us harmless from any claims, losses or expenses arising
        from your misuse of the site or breach of these terms.
      </p>

      <h2 className={headingClass}>11. Privacy</h2>
      <p className={bodyClass}>
        Your use of the site is also governed by our{" "}
        <Link href="/privacy-policy" className={linkClass}>
          Privacy Policy
        </Link>
        , which explains how we collect and use personal information.
      </p>

      <h2 className={headingClass}>12. Changes to These Terms</h2>
      <p className={bodyClass}>
        We may update these terms at any time. Changes take effect when posted on this page with a
        new effective date. Continuing to use the site means you accept the updated terms.
      </p>

      <h2 className={headingClass}>13. Governing Law</h2>
      <p className={bodyClass}>
        These terms are governed by the laws of the State of Florida, United States, without regard
        to conflict-of-law rules. Any disputes will be handled in the courts of the State of
        Florida, United States.
      </p>

      <h2 className={headingClass}>14. Contact Us</h2>
      <p className={bodyClass}>
        Questions about these terms? Email us at{" "}
        <a href="mailto:contact@visitintampa.com" className={linkClass}>
          contact@visitintampa.com
        </a>{" "}
        or use our{" "}
        <Link href="/contact" className={linkClass}>
          Contact Us
        </Link>{" "}
        page.
      </p>
    </div>
  );
}
