import type { Metadata } from "next";
import { CostCalculator } from "@/components/calculator/cost-calculator";
import { Disclaimer } from "@/components/shared/disclaimer";
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
import { AffiliateCTA } from "@/components/shared/affiliate-cta";
import { OrganizationSchema } from "@/components/seo/organization-schema";
import { FaqSchema } from "@/components/seo/faq-schema";
import { FOCUS_RING } from "@/lib/utils/styles";
import { POPULAR_STATE_CODES } from "@/lib/constants/popular";

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

const HOME_FAQ_QUESTIONS = [
  {
    question: "How much does hiring a lawyer cost in the United States?",
    answer:
      "Attorney fees vary widely by practice area, state, and case complexity. Hourly rates typically range from $150 to $500+, while some cases use flat fees or contingency arrangements. Use our free calculator to get cost estimates specific to your legal matter and state.",
  },
  {
    question: "What factors affect legal costs?",
    answer:
      "The main factors are: the type of legal matter (divorce, DUI, bankruptcy, etc.), your state, case complexity (simple, moderate, or complex), attorney experience, and whether the case goes to trial. Court filing fees and expert witness costs can also add to the total.",
  },
  {
    question: "Are the cost estimates on LegalCostCalc accurate?",
    answer:
      "Our estimates are based on publicly available data from legal industry sources, state bar associations, and court records. All data includes source citations and last-verified dates. Actual costs may vary based on individual circumstances. This tool provides informational ranges, not legal advice.",
  },
  {
    question: "How can I reduce my legal costs?",
    answer:
      "Common strategies include: choosing the right level of legal help (self-help vs. limited scope vs. full representation), gathering documents and information in advance, understanding fee structures (hourly vs. flat fee vs. contingency), and comparing costs across attorneys. Our state-by-state comparison tool can help you understand regional cost differences.",
  },
  {
    question: "What legal categories does LegalCostCalc cover?",
    answer:
      "We currently cover 8 legal categories across all 50 US states plus DC: Divorce, DUI/DWI, Personal Injury, Bankruptcy, Real Estate Closing, Estate Planning/Probate, Criminal Defense, and Immigration. Each category includes cost ranges, hourly rates, typical duration, and common fees.",
  },
];

export default function HomePage() {
  const popularStates = STATES.filter((s) =>
    (POPULAR_STATE_CODES as readonly string[]).includes(s.code),
  );

  return (
    <div>
      <OrganizationSchema />
      <FaqSchema questions={HOME_FAQ_QUESTIONS} />
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-teal-50 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Disclaimer />

          <div className="mt-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              How Much Will Your Legal Matter{" "}
              <span className="text-teal-600">Really</span> Cost?
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              Get free, data-driven cost estimates for legal matters across all 50 US states.
              Compare attorney fees, court costs, and total expenses.
            </p>
          </div>

          {/* Calculator */}
          <div className="mt-10">
            <CostCalculator />
          </div>
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
                <h3 className="font-semibold text-slate-900">Source-Verified Data</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Every cost estimate includes cited sources. Cross-referenced from multiple data points.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal-100">
                <TrendingUp className="h-5 w-5 text-teal-600" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Regularly Updated</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Data refreshed quarterly with dates shown so you know how current the estimates are.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

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
                href={`/${state.slug}/divorce-cost`}
                className={`rounded-lg border border-slate-200 bg-white p-3 text-center text-sm font-medium text-slate-700 transition-all hover:border-teal-200 hover:text-teal-700 hover:shadow-sm ${FOCUS_RING}`}
              >
                {state.name}
              </Link>
            ))}
          </div>

          {STATES.length > popularStates.length && (
            <details className="group mt-4">
              <summary className={`flex cursor-pointer items-center justify-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700 ${FOCUS_RING} rounded-md`}>
                View all {STATES.length} states
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {STATES.filter(
                  (s) => !(POPULAR_STATE_CODES as readonly string[]).includes(s.code),
                ).map((state) => (
                  <Link
                    key={state.code}
                    href={`/${state.slug}/divorce-cost`}
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
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AffiliateCTA />
        </div>
      </section>

      {/* Bottom Disclaimer */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Disclaimer />
        </div>
      </section>
    </div>
  );
}
