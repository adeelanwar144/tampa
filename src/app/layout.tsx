import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SiteAnalytics } from "@/components/analytics/GoogleAnalytics";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WeatherWidget } from "@/components/WeatherWidget";
import { resolveWeatherTips } from "@/lib/resolve-weather-tips";
import { SITE_NAME, SITE_URL } from "@/config/site";

const bricolage = localFont({
  src: "../fonts/bricolage-grotesque-latin.woff2",
  weight: "400 800",
  display: "swap",
  variable: "--font-bricolage",
});

const publicSans = localFont({
  src: "../fonts/public-sans-latin.woff2",
  weight: "400 600",
  display: "swap",
  variable: "--font-public-sans",
});

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — An independent guide to Tampa, FL`,
    template: "%s",
  },
  description:
    "An independent guide to eating, drinking, and getting outside in Tampa. Restaurants, bars, beaches and shops we've visited, filtered how you like.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0B5E6B",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${bricolage.variable} ${publicSans.variable}`} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-seaglass-50">
        <Header />
        <WeatherWidget
          city="Tampa"
          region="FL"
          latitude={27.9506}
          longitude={-82.4572}
          timeZone="America/New_York"
          tips={resolveWeatherTips()}
        />
        <main className="flex-1">{children}</main>
        <Footer />
        <SiteAnalytics />
      </body>
    </html>
  );
}
