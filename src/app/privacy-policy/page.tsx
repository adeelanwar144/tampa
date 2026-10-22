import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, withSiteName } from "@/config/site";

export const metadata: Metadata = {
  title: withSiteName("Privacy Policy"),
  description: `Privacy policy for ${SITE_NAME}, effective October 22, 2026.`,
};

const headingClass = "font-display font-700 text-[22px] text-gulf-900 mt-10 mb-3";
const bodyClass = "text-ink-600 leading-relaxed mb-4";
const listClass = "mb-4 list-disc space-y-2 pl-5 text-ink-600 marker:text-gulf-700";
const linkClass = "text-gulf-700 underline underline-offset-2 hover:text-gulf-500";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="font-display font-800 text-[38px] md:text-[52px] text-gulf-900 mb-6">
        Privacy Policy
      </h1>
      <p className={bodyClass}>Effective Date: October 22, 2026</p>
      <p className={bodyClass}>
        At VisitInTampa.com, your privacy matters to us. This Privacy Policy explains what
        information we collect, how we use it, and the choices you have. By using our site, you
        agree to the practices described here.
      </p>

      <h2 className={headingClass}>1. Information We Collect</h2>
      <p className="text-ink-600 leading-relaxed mb-2">Information you give us</p>
      <ul className={listClass}>
        <li>Your name and email address when you use our contact form or email us</li>
        <li>Your email address when you subscribe to our newsletter</li>
        <li>Your name, email and comment text when you leave a comment</li>
        <li>Any other details you choose to include in a message</li>
      </ul>
      <p className="text-ink-600 leading-relaxed mb-2">Information collected automatically</p>
      <ul className={listClass}>
        <li>IP address, browser type, device type and operating system</li>
        <li>Pages you visit, time spent on pages, and the site that referred you</li>
        <li>Approximate location (city or country level) based on your IP address</li>
      </ul>

      <h2 className={headingClass}>2. How We Use Your Information</h2>
      <ul className={listClass}>
        <li>To reply to your questions and messages</li>
        <li>To send our newsletter and travel updates, if you subscribed</li>
        <li>To understand how visitors use the site so we can improve our content</li>
        <li>To keep the site secure and prevent spam or abuse</li>
        <li>To meet legal obligations</li>
      </ul>
      <p className={bodyClass}>We do not sell or rent your personal information to anyone.</p>

      <h2 className={headingClass}>3. Cookies and Tracking</h2>
      <p className={bodyClass}>
        Cookies are small files stored on your device. We use them to remember your preferences,
        measure site traffic, and support advertising and affiliate tracking. You can block or
        delete cookies in your browser settings, though some parts of the site may not work as
        intended.
      </p>

      <h2 className={headingClass}>4. Analytics</h2>
      <p className={bodyClass}>
        We use Google Analytics to understand how visitors find and use our site. This service
        collects data such as pages viewed and time on site. You can opt out of Google Analytics
        with the{" "}
        <a
          href="https://tools.google.com/dlpage/gaoptout"
          className={linkClass}
        >
          Google Analytics Opt-out Browser Add-on
        </a>
        .
      </p>

      <h2 className={headingClass}>5. Advertising and Affiliate Partners</h2>
      <p className={bodyClass}>
        We may work with advertising networks and affiliate programs such as Google AdSense and
        Booking.com. These partners may use cookies to track clicks and purchases so we can earn a
        commission, and to show ads relevant to your interests. Their use of your data is governed
        by their own privacy policies. You can choose how Google uses your information for ads in{" "}
        <a href="https://adssettings.google.com/" className={linkClass}>
          Google’s ad settings
        </a>
        . Booking.com’s practices are described in the{" "}
        <a href="https://www.booking.com/content/privacy.html" className={linkClass}>
          Booking.com privacy policy
        </a>
        , and Google’s in the{" "}
        <a href="https://policies.google.com/privacy" className={linkClass}>
          Google privacy policy
        </a>
        .
      </p>

      <h2 className={headingClass}>6. Sharing Your Information</h2>
      <p className="text-ink-600 leading-relaxed mb-2">We only share information with:</p>
      <ul className={listClass}>
        <li>
          Service providers who help run the site, such as our hosting company, email newsletter
          service and analytics provider
        </li>
        <li>Authorities, when required by law or to protect our rights and safety</li>
      </ul>
      <p className={bodyClass}>These providers may only use your data to perform services for us.</p>

      <h2 className={headingClass}>7. Data Retention</h2>
      <p className={bodyClass}>
        We keep personal information only as long as needed for the purposes above. Newsletter data
        is kept until you unsubscribe. Contact messages are kept for up to 24 months unless needed
        longer for legal reasons.
      </p>

      <h2 className={headingClass}>8. Data Security</h2>
      <p className={bodyClass}>
        We use reasonable measures, including secure (HTTPS) connections, to protect your
        information. However, no method of transmission or storage online is 100% secure, and we
        cannot guarantee absolute security.
      </p>

      <h2 className={headingClass}>9. Your Rights and Choices</h2>
      <p className="text-ink-600 leading-relaxed mb-2">
        Depending on where you live, you may have the right to:
      </p>
      <ul className={listClass}>
        <li>Access the personal information we hold about you</li>
        <li>Correct inaccurate information</li>
        <li>Ask us to delete your information</li>
        <li>Object to or limit how we use your information</li>
        <li>Withdraw consent at any time, for example by unsubscribing from emails</li>
      </ul>
      <p className={bodyClass}>
        Visitors in the European Union and United Kingdom have these rights under the GDPR.
        California residents have similar rights under the CCPA/CPRA, including the right to know
        what we collect and to opt out of the sale or sharing of personal information. To use any
        of these rights, email{" "}
        <a href="mailto:contact@visitintampa.com" className={linkClass}>
          contact@visitintampa.com
        </a>
        . We will respond within 30 days.
      </p>

      <h2 className={headingClass}>10. Unsubscribing</h2>
      <p className={bodyClass}>
        Every newsletter email includes an unsubscribe link. You can also email us to be removed at
        any time.
      </p>

      <h2 className={headingClass}>11. Children&apos;s Privacy</h2>
      <p className={bodyClass}>
        Our site is not directed at children under 13 (or under 16 in the EU). We do not knowingly
        collect personal information from children. If you believe a child has sent us information,
        contact us and we will delete it.
      </p>

      <h2 className={headingClass}>12. Third-Party Websites</h2>
      <p className={bodyClass}>
        Our site links to other websites. We are not responsible for their privacy practices, so
        please read their policies before sharing any information with them.
      </p>

      <h2 className={headingClass}>13. Changes to This Policy</h2>
      <p className={bodyClass}>
        We may update this Privacy Policy from time to time. Changes will be posted on this page
        with a new effective date.
      </p>

      <h2 className={headingClass}>14. Contact Us</h2>
      <p className="text-ink-600 leading-relaxed mb-2">
        If you have questions about this Privacy Policy or your data, contact us:
      </p>
      <ul className={listClass}>
        <li>
          Email:{" "}
          <a href="mailto:contact@visitintampa.com" className={linkClass}>
            contact@visitintampa.com
          </a>
        </li>
        <li>
          Or use our{" "}
          <Link href="/contact" className={linkClass}>
            Contact Us
          </Link>{" "}
          page.
        </li>
      </ul>
    </div>
  );
}
