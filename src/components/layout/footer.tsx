import Link from "next/link";
import { Scale } from "lucide-react";
import { DISCLAIMER_TEXT } from "@/lib/constants/disclaimer";
import { CATEGORIES } from "@/lib/constants/categories";
import { FOCUS_RING_DARK } from "@/lib/utils/styles";
import { ManageConsentLink } from "@/components/consent/manage-consent-link";
import { ClearMyData } from "@/components/shared/clear-my-data";
import { FeedbackLink } from "@/components/shared/feedback-link";
import { PublishedBy } from "@/components/shared/published-by";
import { PUBLISHER } from "@/lib/constants/publisher";
import { latestContentYear } from "@/lib/content-dates";

const footerLink = `inline-flex min-h-11 items-center text-sm text-slate-400 transition-colors hover:text-teal-400 lg:min-h-8 ${FOCUS_RING_DARK} rounded-sm`;

export function Footer() {
  const currentYear = latestContentYear();

  return (
    <footer className="border-t border-slate-800 bg-slate-900 text-slate-300">
      {/* Disclaimer */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs leading-relaxed text-amber-700">
            {DISCLAIMER_TEXT}
          </p>
        </div>
      </div>

      {/* Links */}
      <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Scale className="h-5 w-5 text-teal-400" aria-hidden="true" />
              <span className="font-semibold text-white">LegalCostCalc</span>
            </div>
            <p className="text-sm text-slate-400">
              Free legal cost estimates for every US state. Helping you understand the
              estimated costs of legal matters.
            </p>
            <PublishedBy
              className="mt-3 text-sm text-slate-400"
              linkClassName={`text-slate-300 underline hover:text-teal-400 ${FOCUS_RING_DARK} rounded-sm`}
            />
            <p className="mt-1 text-sm text-slate-400">
              Corrections and questions:{" "}
              <a
                href={`mailto:${PUBLISHER.email}`}
                className={`text-slate-300 underline hover:text-teal-400 ${FOCUS_RING_DARK} rounded-sm`}
              >
                {PUBLISHER.email}
              </a>
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">Legal Categories</h3>
            <ul className="grid grid-cols-2 gap-x-4 sm:grid-cols-1">
              {CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/category/${cat.slug}`}
                    className={footerLink}
                  >
                    {cat.displayName} Costs
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">Resources</h3>
            <ul className="grid grid-cols-2 gap-x-4 sm:grid-cols-1">
              <li>
                <Link href="/" className={footerLink}>
                  Cost Calculator
                </Link>
              </li>
              <li>
                <Link href="/compare" className={footerLink}>
                  Compare Costs
                </Link>
              </li>
              <li>
                <Link href="/settlement-estimator" className={footerLink}>
                  Settlement Estimator
                </Link>
              </li>
              <li>
                <Link href="/how-legal-fees-work" className={footerLink}>
                  How Legal Fees Work
                </Link>
              </li>
              <li>
                <Link href="/legal-cost-statistics" className={footerLink}>
                  Legal Cost Statistics
                </Link>
              </li>
              <li>
                <Link href="/about" className={footerLink}>
                  About &amp; Methodology
                </Link>
              </li>
              <li>
                <Link href="/contact" className={footerLink}>
                  Contact
                </Link>
              </li>
              <li>
                <FeedbackLink
                  className={`text-left ${footerLink}`}
                />
              </li>
              <li>
                <Link href="/embed" className={footerLink}>
                  Embed Calculator
                </Link>
              </li>
              <li>
                <Link href="/privacy" className={footerLink}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className={footerLink}>
                  Terms of Service
                </Link>
              </li>
              <li className="col-span-2 sm:col-span-1">
                <ManageConsentLink
                  className={`text-left ${footerLink}`}
                />
              </li>
              <li>
                <ClearMyData
                  variant="link"
                  className={`text-left ${footerLink}`}
                />
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
          &copy; {currentYear} LegalCostCalc. All rights reserved. Not a law firm. Not legal advice.
        </div>
      </div>
    </footer>
  );
}
