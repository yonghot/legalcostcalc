import type { Metadata } from "next";
import Link from "next/link";
import { Disclaimer } from "@/components/shared/disclaimer";
import { SettlementEstimatorForm } from "@/components/calculator/settlement-estimator-form";
import { AffiliateCTA } from "@/components/shared/affiliate-cta";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { FOCUS_RING } from "@/lib/utils/styles";

export const metadata: Metadata = {
  title: "Settlement Net Estimator — How Much Will I Actually Receive?",
  description:
    "Estimate your net settlement after attorney contingency fees and case costs. " +
    "Illustrative calculator only — actual amounts are determined by your attorney agreement.",
  alternates: {
    canonical: "/settlement-estimator",
  },
};

export default function SettlementEstimatorPage() {
  return (
    <div className="bg-gradient-to-b from-teal-50 to-white py-16 sm:py-20">
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "Settlement Net Estimator", href: "/settlement-estimator" },
        ]}
      />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Site-level top disclaimer */}
        <Disclaimer />

        {/* Breadcrumb */}
        <nav className="mt-6 text-sm text-slate-500" aria-label="Breadcrumb">
          <Link href="/" className={`hover:text-teal-600 ${FOCUS_RING} rounded-sm`}>
            Home
          </Link>
          <span className="mx-2" aria-hidden="true">/</span>
          <span aria-current="page">Settlement Net Estimator</span>
        </nav>

        {/* Page header */}
        <div className="mt-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Settlement Net Estimator
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            Estimate how much of a personal-injury settlement you may receive after attorney
            contingency fees and case costs are deducted. This is an illustrative tool
            only — your actual net will be determined by your signed attorney agreement.
          </p>
        </div>

        {/* How it works */}
        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-900">How the estimate works</h2>
          <p className="mt-2 text-sm text-slate-600">
            The calculator applies a simple formula:
          </p>
          <p className="mt-3 rounded-md bg-slate-50 px-4 py-3 font-mono text-sm text-slate-800">
            Client net = Gross settlement &times; (1 &minus; contingency&thinsp;%) &minus; case costs
          </p>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            <li>
              <span className="font-medium">Gross settlement</span> — the total amount the
              defendant or insurer agrees to pay.
            </li>
            <li>
              <span className="font-medium">Contingency fee</span> — a percentage of the gross
              that goes to your attorney (typically 25–40%; one-third is most common before
              litigation).
            </li>
            <li>
              <span className="font-medium">Case costs</span> — out-of-pocket expenses advanced
              by your attorney (medical records, experts, filing fees, depositions, etc.) that
              are reimbursed from the settlement.
            </li>
          </ul>
          <p className="mt-3 text-xs text-slate-400">
            Source:{" "}
            <a
              href="https://www.nolo.com/legal-encyclopedia/contingency-fees-lawyers-payment-28563.html"
              target="_blank"
              rel="noopener noreferrer"
              className={`underline hover:text-teal-700 ${FOCUS_RING} rounded-sm`}
            >
              Nolo: Contingency Fee Basics
            </a>
            {"; "}
            <a
              href="https://www.americanbar.org/groups/professional_responsibility/publications/model_rules_of_professional_conduct/rule_1_5_fees/"
              target="_blank"
              rel="noopener noreferrer"
              className={`underline hover:text-teal-700 ${FOCUS_RING} rounded-sm`}
            >
              ABA Model Rule 1.5 (Fees)
            </a>
          </p>
        </div>

        {/* Interactive estimator */}
        <div className="mt-8">
          <SettlementEstimatorForm />
        </div>

        {/* Affiliate CTA (env-gated) */}
        <div className="mt-10">
          <AffiliateCTA categorySlug="personal-injury" />
        </div>

        {/* Site-level bottom disclaimer */}
        <div className="mt-10">
          <Disclaimer />
        </div>
      </div>
    </div>
  );
}
