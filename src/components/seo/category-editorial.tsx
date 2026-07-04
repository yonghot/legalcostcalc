import { formatCurrency } from "@/lib/utils/format";
import { buildBenchmarkSynthesis } from "@/lib/seo/geo";
import { getNationalAverage } from "@/lib/page-index";
import type { CategoryInfo } from "@/lib/types/category";
import type { StateInfo } from "@/lib/types/state";
import type { LegalCostData } from "@/lib/types";

interface CategoryEditorialProps {
  categoryInfo: CategoryInfo;
  stateInfo: StateInfo;
  /** All complexity rows for this (state, category) pair, real data only. */
  costs: LegalCostData[];
  /**
   * Visible FAQ text. CODE-02: these question/answer pairs are no longer
   * also emitted as FAQPage JSON-LD (deprecated for SERP display in 2026) —
   * this on-page rendering is now the only place they appear, which is
   * exactly what GEO research favors (extractable passage text, not schema).
   */
  faqQuestions: { question: string; answer: string }[];
}

/**
 * K01 — on-page editorial depth for every indexable /[state]/[slug] spoke.
 *
 * ENTITY LEVEL: content is per-CATEGORY (categoryInfo.costFormationNotes —
 * distinct real facts about how that practice area's costs form, see
 * src/lib/constants/categories.ts) interpolated with per-STATE real figures
 * (the page's own `costs` data, sourced from src/data/seed/costs.json — no
 * invented numbers). Never a single noun-swapped template across categories.
 *
 * Rendered BELOW the calculator/result area (LCP intact). Server component —
 * no client JS for static text. Reuses the existing Disclaimer/AuthorByline/
 * FAQ data the page already computes rather than duplicating sections.
 */
export function CategoryEditorial({
  categoryInfo,
  stateInfo,
  costs,
  faqQuestions,
}: CategoryEditorialProps) {
  const moderate = costs.find((c) => c.complexity === "moderate");
  const simple = costs.find((c) => c.complexity === "simple");
  const complex = costs.find((c) => c.complexity === "complex");
  const notes = categoryInfo.costFormationNotes ?? [];

  // CODE-06 — data-derived synthesis sentence comparing this page's own
  // median against the category's real national average (conditional
  // "above"/"below"/"in line with" phrasing driven by the actual numbers,
  // never a fixed template sentence).
  const benchmarkSynthesis = buildBenchmarkSynthesis({
    categoryDisplayName: categoryInfo.displayName,
    stateName: stateInfo.name,
    localMedian: moderate?.costRange.median,
    nationalAverage: getNationalAverage(categoryInfo.slug),
  });

  // Nothing real to interpolate — render nothing rather than a thin/fabricated section.
  if (!moderate && notes.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-slate-100 bg-white py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {notes.length > 0 && (
          <div className="mb-12">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              How {categoryInfo.displayName} Costs Work
            </h2>
            <div className="space-y-4 text-sm leading-relaxed text-slate-700 sm:text-base">
              {notes.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        )}

        {moderate && (
          <div className="mb-12">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              Worked Example: {categoryInfo.displayName} in {stateInfo.name}
            </h2>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-sm leading-relaxed text-slate-700 sm:text-base">
              <p>
                Take a moderate-complexity {categoryInfo.displayName.toLowerCase()} matter in{" "}
                {stateInfo.name}. Based on this page&apos;s sourced data, the median total cost is{" "}
                <span className="font-mono font-semibold text-teal-700">
                  {formatCurrency(moderate.costRange.median)}
                </span>
                , with most cases falling between{" "}
                <span className="font-mono font-semibold">{formatCurrency(moderate.costRange.low)}</span>{" "}
                and{" "}
                <span className="font-mono font-semibold">{formatCurrency(moderate.costRange.high)}</span>
                .
                {moderate.hourlyRate.median > 0 && (
                  <>
                    {" "}
                    At a typical local attorney rate of{" "}
                    <span className="font-mono font-semibold">
                      {formatCurrency(moderate.hourlyRate.median)}/hr
                    </span>{" "}
                    (range {formatCurrency(moderate.hourlyRate.low)}–
                    {formatCurrency(moderate.hourlyRate.high)}/hr), that median cost corresponds to
                    roughly{" "}
                    <span className="font-mono font-semibold">
                      {Math.max(1, Math.round(moderate.costRange.median / moderate.hourlyRate.median))}
                    </span>{" "}
                    billable hours of attorney work.
                  </>
                )}
                {moderate.typicalDuration && (
                  <> A case at this complexity level typically takes {moderate.typicalDuration} to resolve.</>
                )}
              </p>
              {moderate.commonFees.length > 0 && (
                <p className="mt-3">
                  On top of the attorney fee itself, this case would typically also involve:{" "}
                  {moderate.commonFees.slice(0, 3).join("; ")}.
                </p>
              )}
              {simple && complex && (
                <p className="mt-3">
                  Complexity changes the number meaningfully: a simple case in {stateInfo.name} runs
                  closer to{" "}
                  <span className="font-mono font-semibold">
                    {formatCurrency(simple.costRange.median)}
                  </span>
                  , while a complex case can reach{" "}
                  <span className="font-mono font-semibold">
                    {formatCurrency(complex.costRange.median)}
                  </span>{" "}
                  or more — the calculator above lets you compare all three complexity levels directly.
                </p>
              )}
              {benchmarkSynthesis && (
                // CODE-06 — analytical-synthesis sentence, data-derived, with
                // phrasing conditional on the real comparison direction (see
                // buildBenchmarkSynthesis: "above"/"below"/"in line with").
                <p className="mt-3">{benchmarkSynthesis}</p>
              )}
            </div>
          </div>
        )}

        {faqQuestions.length > 0 && (
          <div>
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              Frequently Asked Questions
            </h2>
            <dl className="divide-y divide-slate-100">
              {faqQuestions.map((faq, i) => (
                <div key={i} className="py-4 first:pt-0">
                  <dt className="font-semibold text-slate-900">{faq.question}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-slate-700 sm:text-base">
                    {faq.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </section>
  );
}
