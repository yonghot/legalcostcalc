import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { SiteChrome } from "@/components/layout/site-chrome";
import { ConsentedAnalytics } from "@/components/consent/consented-analytics";
import { FeedbackWidget } from "@/components/shared/feedback-widget";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const normalizedCaPub = adsenseClientId
  ? adsenseClientId.startsWith("ca-")
    ? adsenseClientId
    : `ca-${adsenseClientId}`
  : undefined;

// Env guards: mirror the gating used in next.config.ts so the inline Consent
// Mode script + resource hints are only emitted when Google scripts can load.
const adsenseEnabled = Boolean(adsenseClientId);
const gaEnabled = Boolean(
  process.env.NEXT_PUBLIC_GA_ID || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
);

// Google Consent Mode v2 defaults. Static literal — no untrusted input. Must
// run before any Google script so the initial state is well-defined (denied).
const CONSENT_MODE_DEFAULTS =
  "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});window.gtag=window.gtag||gtag;";

export const metadata: Metadata = {
  title: {
    default: "LegalCostCalc — How Much Will Your Legal Matter Really Cost?",
    template: "%s — LegalCostCalc",
  },
  description:
    "Free legal cost calculator for all 50 US states. Get estimated costs for divorce, DUI, bankruptcy, personal injury, and more. Based on real data from multiple sources.",
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
  other: normalizedCaPub
    ? { "google-adsense-account": normalizedCaPub }
    : undefined,
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
          Google Consent Mode v2 DEFAULTS — must run BEFORE any Google script
          (gtag.js / adsbygoogle.js) so the initial state is well-defined. Starts
          DENIED everywhere; ConsentedAnalytics updates to granted per region
          (US/opt-out immediately on load; EEA/UK/CH on banner Accept).
          Emitted only when AdSense or GA is configured (env-guarded), so the
          free/no-env build ships nothing here. Content is a static literal.
        */}
        {(adsenseEnabled || gaEnabled) && (
          <script id="consent-mode-defaults">{CONSENT_MODE_DEFAULTS}</script>
        )}

        {/*
          Resource hints for AdSense — only meaningful when AdSense is set, but
          harmless always. Speeds up the ad request handshake (CWV).
        */}
        {adsenseEnabled && (
          <>
            <link
              rel="preconnect"
              href="https://pagead2.googlesyndication.com"
              crossOrigin="anonymous"
            />
            <link
              rel="dns-prefetch"
              href="https://googleads.g.doubleclick.net"
            />
          </>
        )}

        {/*
          Analytics/advertising scripts load unconditionally (env-guarded) via
          <ConsentedAnalytics>; whether personalized ads serve is governed by
          Consent Mode v2 above, not by whether the banner was accepted.

          EEA/UK AdSense consent: also configure Google's certified CMP in the
          AdSense dashboard → Privacy & messaging using your publisher ID
          (NEXT_PUBLIC_ADSENSE_CLIENT_ID) for TCF v2.2 compliance.
        */}
      </head>
      <body className="min-h-screen bg-white font-sans text-slate-900 antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-teal-600 focus:px-4 focus:py-2 focus:text-white focus:outline-none"
        >
          Skip to main content
        </a>
        <div className="flex min-h-screen flex-col">
          <SiteChrome>{children}</SiteChrome>
          <ConsentedAnalytics />
          <FeedbackWidget />
        </div>
      </body>
    </html>
  );
}
