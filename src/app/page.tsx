import type { Metadata } from "next";
import { CostCalculator } from "@/components/calculator/cost-calculator";
import { getFeaturedPartners } from "@/lib/featured-partners";
import { Disclaimer, DisclaimerNote } from "@/components/shared/disclaimer";
import { CATEGORIES } from "@/lib/constants/categories";
import { STATES } from "@/lib/constants/states";
import { DEFAULT_STATE_SLUG } from "@/lib/constants/costs";
import Link from "next/link";
import {
  Scale,
  Shield,
  MapPin,
  TrendingUp,
  ArrowRight,
  ChevronDown,
  Car,
  HeartPulse,
  Landmark,
  Home,
  FileText,
  ShieldAlert,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { AffiliateSection } from "@/components/shared/affiliate-section";
import { OrganizationSchema } from "@/components/seo/organization-schema";
import { SoftwareApplicationSchema } from "@/components/seo/software-application-schema";
import { ArticleSchema } from "@/components/seo/article-schema";
import { CANONICAL_ORIGIN } from "@/lib/seo";
import { FOCUS_RING } from "@/lib/utils/styles";
import { POPULAR_STATE_CODES } from "@/lib/constants/popular";
import { getFamilyDate } from "@/lib/content-dates";
import { RecentCalculations } from "@/components/shared/recent-calculations";
import { HomePublisherContent } from "@/components/seo/home-publisher-content";
import { HomeAnswer } from "@/components/seo/home-answer";
import { HOME_DESCRIPTION } from "@/lib/constants/benchmarks";
import { AdsenseLoader } from "@/components/ads/adsense-loader";
import { PopularPages } from "@/components/seo/popular-pages";
import { topTrafficPages } from "@/lib/top-traffic";
import { NextSteps } from "@/components/calculator/next-steps";
import { homeNextSteps } from "@/lib/next-steps-server";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  divorce: Scale,
  dui: Car,
  "personal-injury": HeartPulse,
  bankruptcy: Landmark,
  "real-estate": Home,
  "estate-planning": FileText,
  "criminal-defense": ShieldAlert,
  immigration: Globe,
};

export default function HomePage() {
  const popularStates = STATES.filter((s) =>
    (POPULAR_STATE_CODES as readonly string[]).includes(s.code),
  );
  const popularPages = topTrafficPages({ limit: 6 });

  return (
    <div>
      <AdsenseLoader />
      <OrganizationSchema />
      <SoftwareApplicationSchema
        name="LegalCostCalc — Legal Cost Calculator"
        description="Free legal cost calculator for all 50 US states. Estimate attorney fees, court costs, and total expenses for divorce, DUI, bankruptcy, personal injury, and more."
        url="https://legalcostcalc.co/"
        dateModified={getFamilyDate("page:home")?.date ?? null}
      />
      {/* CODE-02: FAQPage JSON-LD removed (deprecated for SERP display in
          2026). The Q&A remains as visible on-page text in the FAQ section
          below (GEO-relevant), just no longer emitted as schema. Replaced by
          the still-supported rich-result set (Article here + WebSite/
          SearchAction via OrganizationSchema above). */}
      <ArticleSchema
        headline="How Much Do Legal Fees Really Cost?"
        description={HOME_DESCRIPTION}
        url={CANONICAL_ORIGIN}
        dateModified={getFamilyDate("page:home")?.date ?? null}
      />
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-teal-50 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <DisclaimerNote />

          <div className="mt-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              How Much Do Legal Fees{" "}
              <span className="text-teal-600">Really</span> Cost?
            </h1>
            <HomeAnswer />
          </div>

          {/* Calculator */}
          <div className="mt-10">
            <CostCalculator featuredPartners={getFeaturedPartners()} />
          </div>

          {/* T16 — Recent calculations (client-only, renders nothing when empty) */}
          <RecentCalculations />

          <NextSteps steps={homeNextSteps()} placement="home" className="mt-24" />
        </div>
      </section>

      {/* Trust Signals */}
      <section className="border-y border-slate-100 bg-slate-50 py-16" aria-label="Why trust our data">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="sr-only">Why Trust Our Data</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal-100">
                <MapPin className="h-5 w-5 text-teal-600" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">50 States + DC</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Cost data for every US jurisdiction, broken down by legal category and complexity.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal-100">
                <Shield className="h-5 w-5 text-teal-600" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Authoritative References</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Estimates modeled from publicly available legal-cost research, such as national fee guides and rate surveys.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal-100">
                <TrendingUp className="h-5 w-5 text-teal-600" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Dated Pages</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Each cost page shows when its content was last updated, so you can judge how current the estimates are.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <HomePublisherContent />

      {/* Categories Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900">Legal Cost Categories</h2>
          <p className="mt-2 text-slate-600">
            Explore estimated costs for common legal matters across the United States.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.slug] || Scale;
              return (
              <Link
                key={cat.slug}
                href={`/${DEFAULT_STATE_SLUG}/${cat.slug}-cost`}
                className={`group rounded-lg border border-slate-200 p-6 transition-all hover:border-teal-200 hover:shadow-md ${FOCUS_RING}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 transition-colors group-hover:bg-teal-100">
                    <Icon className="h-5 w-5 text-teal-600" aria-hidden="true" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-300 transition-colors group-hover:text-teal-500" aria-hidden="true" />
                </div>
                <h3 className="mt-3 font-semibold text-slate-900">{cat.displayName}</h3>
                <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                  {cat.description}
                </p>
              </Link>
              );
            })}
          </div>
        </div>
      </section>

      {popularPages.length > 0 && (
        <section className="border-t border-slate-100 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <PopularPages
              heading="Popular legal cost estimates"
              intro={
                <>
                  Cost estimates that visitors open most often. To see how fees are billed first, read{" "}
                  <Link
                    href="/how-legal-fees-work"
                    className={`font-medium text-teal-700 underline hover:text-teal-800 ${FOCUS_RING} rounded-sm`}
                  >
                    how legal fees work
                  </Link>
                  , or put two states side by side in the{" "}
                  <Link
                    href="/compare"
                    className={`font-medium text-teal-700 underline hover:text-teal-800 ${FOCUS_RING} rounded-sm`}
                  >
                    compare tool
                  </Link>
                  .
                </>
              }
              pages={popularPages}
            />
          </div>
        </section>
      )}

      {/* Popular States */}
      <section className="border-t border-slate-100 bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900">Popular States</h2>
          <p className="mt-2 text-slate-600">
            Browse legal costs by state. Each page shows costs for all legal categories.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {popularStates.map((state) => (
              <Link
                key={state.code}
                href={`/${state.slug}`}
                className={`rounded-lg border border-slate-200 bg-white p-3 text-center text-sm font-medium text-slate-700 transition-all hover:border-teal-200 hover:text-teal-700 hover:shadow-sm ${FOCUS_RING}`}
              >
                {state.name}
              </Link>
            ))}
          </div>

          {STATES.length > popularStates.length && (
            <details className="group mt-4">
              <summary className={`flex cursor-pointer items-center justify-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-800 ${FOCUS_RING} rounded-md`}>
                View all {STATES.length} states
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {STATES.filter(
                  (s) => !(POPULAR_STATE_CODES as readonly string[]).includes(s.code),
                ).map((state) => (
                  <Link
                    key={state.code}
                    href={`/${state.slug}`}
                    className={`rounded-lg border border-slate-200 bg-white p-3 text-center text-sm font-medium text-slate-700 transition-all hover:border-teal-200 hover:text-teal-700 hover:shadow-sm ${FOCUS_RING}`}
                  >
                    {state.name}
                  </Link>
                ))}
              </div>
            </details>
          )}
        </div>
      </section>

      {/* Affiliate CTAs */}
      <AffiliateSection className="py-16" />

      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Disclaimer id="disclaimer" />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-slate-100 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
          <dl className="mt-8 space-y-6">
            <div>
              <dt className="text-base font-semibold text-slate-900">
                How much does hiring a lawyer cost in the United States?
              </dt>
              <dd className="mt-2 text-sm text-slate-600">
                Attorney fees vary widely by practice area, state, and case complexity. Hourly
                rates typically range from $150 to $500+, while some cases use flat fees or
                contingency arrangements. Use our free calculator to get cost estimates specific
                to your legal matter and state.
              </dd>
              <dd className="mt-2 text-xs text-slate-600">
                Sources:{" "}
                <a
                  href="https://www.clio.com/resources/legal-trends/compare-lawyer-rates/"
                  className="underline hover:text-teal-600"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Clio Legal Trends Report
                </a>
                {"; "}
                <a
                  href="https://www.bls.gov/ooh/legal/lawyers.htm"
                  className="underline hover:text-teal-600"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Bureau of Labor Statistics — Lawyers
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-base font-semibold text-slate-900">
                What factors affect legal costs?
              </dt>
              <dd className="mt-2 text-sm text-slate-600">
                The main factors are: the type of legal matter (divorce, DUI, bankruptcy,
                etc.), your state, case complexity (simple, moderate, or complex), attorney
                experience, and whether the case goes to trial. Court filing fees and expert
                witness costs can also add to the total.
              </dd>
            </div>
            <div>
              <dt className="text-base font-semibold text-slate-900">
                Are the cost estimates on LegalCostCalc accurate?
              </dt>
              <dd className="mt-2 text-sm text-slate-600">
                Our estimates are illustrative ranges compiled from publicly available
                legal-cost research and official fee schedules. They are intended as a
                starting reference; actual costs may vary based on individual circumstances.
                This tool provides general information, not legal advice.
              </dd>
            </div>
            <div>
              <dt className="text-base font-semibold text-slate-900">
                What legal categories does LegalCostCalc cover?
              </dt>
              <dd className="mt-2 text-sm text-slate-600">
                We currently cover 8 legal categories across all 50 US states plus DC:
                Divorce, DUI/DWI, Personal Injury, Bankruptcy, Real Estate Closing, Estate
                Planning/Probate, Criminal Defense, and Immigration. Each category includes
                cost ranges, hourly rates, typical duration, and common fees.
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
