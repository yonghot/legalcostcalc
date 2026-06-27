import type { Metadata } from "next";
import Script from "next/script";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
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
  metadataBase: new URL("https://legalcostcalc.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "LegalCostCalc",
    url: "https://legalcostcalc.vercel.app",
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
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <Script
            defer
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
            strategy="afterInteractive"
          />
        )}
        {/* Google AdSense — only loads when a publisher ID (ca-pub-…) is configured.
            Set NEXT_PUBLIC_ADSENSE_CLIENT in the environment after approval. */}
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className="min-h-screen bg-white font-sans text-slate-900 antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-teal-600 focus:px-4 focus:py-2 focus:text-white focus:outline-none"
        >
          Skip to main content
        </a>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main id="main-content" className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
