import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "@/config/site";

const ABOUT_PATH = "/about";
const ABOUT_OG_IMAGE = "/images/about/ben-hayes.webp";
const ABOUT_IMAGE = "/images/wm/about/ben-hayes.webp";
const ABOUT_IMAGE_WIDTH = 896;
const ABOUT_IMAGE_HEIGHT = 733;
const ABOUT_IMAGE_ALT =
  "Ben Hayes in an olive bomber jacket and white henley, standing by windows with palm trees and a yellow taxi outside.";

const description =
  "Hi, I’m Ben Hayes. and I run Visit In Tampa. From November 2025 to May 2026, I spent about six months in Tampa, staying with my aunt and cousins.";

const pageTitle = `About Me — ${SITE_NAME}`;
const personId = `${SITE_URL}/#ben-hayes`;
const websiteId = `${SITE_URL}/#website`;

export const metadata: Metadata = {
  title: pageTitle,
  description,
  openGraph: {
    title: pageTitle,
    description,
    url: ABOUT_PATH,
    type: "website",
    images: [
      {
        url: ABOUT_OG_IMAGE,
        width: ABOUT_IMAGE_WIDTH,
        height: ABOUT_IMAGE_HEIGHT,
        alt: ABOUT_IMAGE_ALT,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description,
    images: [ABOUT_OG_IMAGE],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      "@id": `${SITE_URL}${ABOUT_PATH}`,
      url: `${SITE_URL}${ABOUT_PATH}`,
      name: pageTitle,
      description,
      image: `${SITE_URL}${ABOUT_IMAGE}`,
      mainEntity: { "@id": personId },
      author: { "@id": personId },
      isPartOf: { "@id": websiteId },
    },
    {
      "@type": "Person",
      "@id": personId,
      name: "Ben Hayes",
      url: `${SITE_URL}${ABOUT_PATH}`,
      image: `${SITE_URL}${ABOUT_IMAGE}`,
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      name: SITE_NAME,
      url: SITE_URL,
      author: { "@id": personId },
      publisher: { "@id": personId },
    },
  ],
};

const bodyClass = "mb-4 leading-relaxed text-ink-600";
const headingClass = "mt-10 mb-3 font-display text-[22px] font-700 text-gulf-900";
const strongClass = "font-semibold text-gulf-900";

export default function AboutPage() {
  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="relative isolate mx-auto w-full max-w-[560px] pr-4 pb-4 lg:col-span-5 lg:mx-0 lg:max-w-[min(100%,calc(min(560px,70vh)*4/5))]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-4 left-4 z-0 h-[calc(100%-1rem)] w-[calc(100%-1rem)] border border-[#C9A24A]"
            />
            <div className="relative z-10 aspect-[4/3] w-full max-h-[420px] overflow-hidden rounded-[20px] shadow-[0_16px_40px_rgba(8,52,60,0.14)] lg:aspect-[4/5] lg:max-h-[min(560px,70vh)]">
              <Image
                src={ABOUT_IMAGE}
                alt={ABOUT_IMAGE_ALT}
                fill
                priority
                sizes="(max-width: 1023px) min(100vw, 560px), 448px"
                className="object-cover object-[center_20%]"
              />
            </div>
          </div>

          <div className="lg:col-span-7">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-gulf-700">
              About
            </p>
            <h1 className="mt-3 font-display text-[32px] font-800 leading-[1.15] text-gulf-900 lg:text-[48px]">
              About Me
            </h1>
            <div className="mt-5 space-y-4 leading-relaxed text-ink-600">
              <p className="text-lg">
                Hi, I’m <strong className={strongClass}>Ben Hayes</strong>. and I run Visit In Tampa.
              </p>
              <p>
                From November 2025 to May 2026, I spent about six months in Tampa, staying with my
                aunt and cousins in downtown Tampa. They’ve lived there since 2010, so I didn’t see
                the city like a typical tourist. I had people around me who knew where locals
                actually eat, which places are worth the drive, and which ones are mostly hype.
              </p>
              <p>
                I spent a lot of that time just getting around. Walking Bayshore Boulevard in the
                evening became one of my favorite routines. Ybor City, Tampa’s historic Latin
                Quarter, showed me a side of the city that feels nothing like the downtown towers. I
                also tried a lot of restaurants and did plenty of shopping, and at one point I had
                to find a car repair shop. That’s the kind of thing no travel guide mentions until
                you need it.
              </p>
              <p>
                That’s why I started this site. Most Tampa guides stop at the big attractions. I
                wanted one that also covers where to eat, where to shop, and where to go when you
                need something practical.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[720px] px-4 pb-16 sm:px-6">
        <h2 className="mb-3 font-display text-[22px] font-700 text-gulf-900">What you’ll find here</h2>
        <ul className="mb-4 list-disc space-y-2 pl-5 text-ink-600 marker:text-gulf-700">
          <li>Things to do, from major attractions to easy weekend plans</li>
          <li>Restaurants and food spots</li>
          <li>Ybor City and other neighborhoods worth exploring</li>
          <li>Bayshore Boulevard, parks, and waterfront spots</li>
          <li>Free and low-cost ideas</li>
          <li>Shopping and local services</li>
        </ul>
        <p className={bodyClass}>
          <strong className={strongClass}>
            [Optional: link 2–3 of your best articles here, e.g. “Start with my guide to Ybor City”]
          </strong>
        </p>

        <h2 className={headingClass}>How I write each guide</h2>
        <p className={bodyClass}>
          Most of what’s here comes from places I visited during my stay, often on my family’s
          recommendation. When a guide is based on research instead of a personal visit, I say so in
          the article.
        </p>
        <p className={bodyClass}>
          Hours, prices, and services change. For anything time-sensitive, it’s worth checking with
          the business directly before you go.
        </p>

        <h2 className={headingClass}>How this site makes money</h2>
        <p className={bodyClass}>Visit In Tampa is free to read and is supported in two ways:</p>
        <ul className="mb-4 list-disc space-y-2 pl-5 text-ink-600 marker:text-gulf-700">
          <li>
            <strong className={strongClass}>Google AdSense:</strong> You’ll see ads on some pages.
          </li>
          <li>
            <strong className={strongClass}>Booking.com affiliate links:</strong> If you book a hotel
            or stay through one of my links, I may earn a small commission at no extra cost to you.
          </li>
        </ul>
        <p className={bodyClass}>
          I recommend places because I think they’re worth your time, not because of a commission.
        </p>

        <h2 className={headingClass}>Found a mistake?</h2>
        <p className={bodyClass}>
          If something is out of date or wrong, email me. I read every message and fix errors as
          quickly as I can.
        </p>
        <p className={bodyClass}>Thanks for stopping by, and enjoy Tampa.</p>
        <p className={bodyClass}>
          <strong className={strongClass}>Ben Hayes.</strong>
        </p>

        <div className="mt-12 rounded-[var(--radius-card)] border border-line bg-white px-6 py-6 shadow-[0_8px_24px_rgba(8,52,60,0.08)]">
          <p className="font-display text-lg font-700 text-gulf-900">
            Have a question or a tip about Tampa?
          </p>
          <Link
            href="/contact"
            className="mt-4 inline-flex rounded-full bg-gulf-700 px-6 py-2.5 text-[15px] font-semibold text-white transition-hover hover:bg-gulf-900 hover:text-white"
          >
            Contact
          </Link>
        </div>
      </div>
    </article>
  );
}
