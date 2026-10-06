import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { SiteChrome } from "@/components/layout/site-chrome";
import { ConsentedAnalytics } from "@/components/consent/consented-analytics";
import { AnalyticsInit } from "@/components/consent/analytics-init";
import { FeedbackWidget } from "@/components/shared/feedback-widget";
import { WebVitalsReporter } from "@/components/shared/web-vitals-reporter";
import { resolveAdsenseClient } from "@/lib/env";
import { CONSENT_DEFAULT_SCRIPT } from "@/lib/consent/default-script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: {
    default: "LegalCostCalc — How Much Will Your Legal Matter Really Cost?",
    template: "%s — LegalCostCalc",
  },
  description:
    "Free legal cost calculator for all 50 US states. Get estimated costs for divorce, DUI, bankruptcy, personal injury, and more. Estimates modeled from published national fee guides and rate surveys.",
  keywords: [
    "legal cost calculator",
    "lawyer cost",
    "attorney fees",
    "divorce cost",
    "DUI cost",
    "bankruptcy cost",
    "legal fees by state",
  ],
  metadataBase: new URL("https://legalcostcalc.co"),
  other: { "google-adsense-account": resolveAdsenseClient() },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "LegalCostCalc",
    url: "https://legalcostcalc.co",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "LegalCostCalc — How Much Will Your Legal Matter Really Cost?",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LegalCostCalc — How Much Will Your Legal Matter Really Cost?",
    description:
      "Free legal cost calculator for all 50 US states. Get estimated costs for divorce, DUI, bankruptcy, personal injury, and more.",
  },
  robots: {
    index: true,
    follow: true,
    // K09 — Discover hygiene (부속M §5/§9): allow large image previews so
    // hub/insight pages are eligible for Google Discover surfacing. Applies
    // sitewide via metadata inheritance; buildMeta()'s explicit robots
    // overrides (thin-page noindex gate) also set this — see src/lib/seo.ts.
    "max-image-preview": "large",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        {/*
          Consent Mode v2 defaults, region-scoped: EEA/UK/CH denied (Google's
          certified CMP governs there), everywhere else granted. Must stay a
          server-rendered inline script ahead of every Google script; the AdSense
          loader is rendered by content pages in the body so it always follows.
        */}
        <script id="consent-mode-defaults">{CONSENT_DEFAULT_SCRIPT}</script>
      </head>
      <body
        className="min-h-screen bg-white font-sans text-slate-900 antialiased"
        suppressHydrationWarning
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-teal-600 focus:px-4 focus:py-2 focus:text-white focus:outline-none"
        >
          Skip to main content
        </a>
        <div className="flex min-h-screen flex-col">
          <SiteChrome>{children}</SiteChrome>
          <ConsentedAnalytics />
          <AnalyticsInit />
          <WebVitalsReporter />
          <FeedbackWidget />
        </div>
      </body>
    </html>
  );
}
