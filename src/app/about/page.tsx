import { Metadata } from "next";
import Link from "next/link";
import { Disclaimer } from "@/components/shared/disclaimer";
import { Shield, Database, Scale, RefreshCw } from "lucide-react";

export const metadata: Metadata = {
  title: "About LegalCostCalc — Our Data & Methodology",
  description:
    "Learn how LegalCostCalc provides transparent, source-verified legal cost estimates across all 50 US states. Our methodology, data sources, and commitment to accuracy.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About LegalCostCalc — Our Data & Methodology",
    description:
      "Learn how LegalCostCalc provides transparent, source-verified legal cost estimates across all 50 US states.",
    type: "website",
    url: "https://legalcostcalc.vercel.app/about",
  },
};

function safeJsonLd(obj: Record<string, unknown>): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

export default function AboutPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About LegalCostCalc",
    description:
      "Learn how LegalCostCalc provides transparent, source-verified legal cost estimates across all 50 US states.",
    url: "https://legalcostcalc.vercel.app/about",
    isPartOf: {
      "@type": "WebSite",
      name: "LegalCostCalc",
      url: "https://legalcostcalc.vercel.app",
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
      />
      <section className="bg-gradient-to-b from-teal-50 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Disclaimer />

          <nav className="mt-8 text-sm text-slate-500">
            <Link
              href="/"
              className="rounded-sm hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
            >
              Home
            </Link>
            <span className="mx-2">/</span>
            <span>About</span>
          </nav>

          <div className="mt-4">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              About LegalCostCalc
            </h1>
            <p className="mt-3 max-w-3xl text-lg text-slate-600">
              We provide transparent, data-driven legal cost estimates to help Americans
              understand what legal services cost in their state.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
                    <Scale className="h-5 w-5 text-teal-600" aria-hidden="true" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900">Our Mission</h2>
                </div>
                <p className="mt-3 text-slate-600">
                  Legal costs in America lack transparency. Hiring an attorney is one of the
                  most stressful financial decisions people face, and most go in without any
                  idea of what to expect. LegalCostCalc exists to change that by providing
                  clear, researched cost ranges for common legal matters across all 50 states
                  and the District of Columbia.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
                    <Database className="h-5 w-5 text-teal-600" aria-hidden="true" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900">Our Data Sources</h2>
                </div>
                <p className="mt-3 text-slate-600">
                  Our cost estimates are compiled from publicly available data including
                  attorney fee surveys, state bar association reports, court filing fee
                  schedules, and legal service provider pricing. We cross-reference multiple
                  sources to ensure accuracy.
                </p>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />
                    State bar association fee surveys and reports
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />
                    Bureau of Labor Statistics (BLS) occupational data
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />
                    State court filing fee schedules
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />
                    Legal service provider published pricing
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
                    <Shield className="h-5 w-5 text-teal-600" aria-hidden="true" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900">Methodology</h2>
                </div>
                <p className="mt-3 text-slate-600">
                  We present cost estimates as ranges (low, median, high) because legal costs
                  vary significantly based on case complexity, attorney experience, and local
                  market conditions. Our methodology:
                </p>
                <ol className="mt-3 space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 font-semibold text-teal-600">1.</span>
                    Collect data from multiple independent sources
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 font-semibold text-teal-600">2.</span>
                    Adjust for state-level cost of living and market conditions
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 font-semibold text-teal-600">3.</span>
                    Segment by case complexity (simple, moderate, complex)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 font-semibold text-teal-600">4.</span>
                    Publish with source attribution and verification dates
                  </li>
                </ol>
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
                    <RefreshCw className="h-5 w-5 text-teal-600" aria-hidden="true" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900">Data Freshness</h2>
                </div>
                <p className="mt-3 text-slate-600">
                  We review and update our data quarterly. Every cost estimate shows its last
                  verification date. Data older than one year is flagged as potentially
                  outdated. We believe transparency about data freshness is essential for
                  building trust.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 rounded-lg border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-lg font-semibold text-amber-800">Important Notice</h2>
            <p className="mt-2 text-sm text-amber-700">
              LegalCostCalc is an informational tool only. Our cost estimates are for general
              reference purposes and should not be considered legal advice. Actual costs will
              vary based on your specific circumstances. We recommend consulting with a
              qualified attorney in your jurisdiction for accurate cost assessments of your
              individual legal matter.
            </p>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Disclaimer />
        </div>
      </section>
    </div>
  );
}
