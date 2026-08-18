import { formatCurrency } from "@/lib/utils/format";
import { buildBenchmarkSynthesis } from "@/lib/seo/geo";
import { sumFeeRanges } from "@/lib/seo/state-faq";

/** How many statutory lines the itemised list shows — the total must match it. */
const MAX_ITEMISED_FEES = 4;
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
  const notes = categoryInfo.costFormationNotes ?? [];

  // CODE-05 — the worked example used to restate the hourly band, the implied
  // hours, the duration and the fee list that three other sections of the page
  // had already shown, which made it one of the largest identical blocks two
  // sibling pages shared. It now does arithmetic those sections do not: each
  // statutory line sized against THIS state's median, so the percentages differ
  // per state even though the fee schedule does not.
  // The itemised list below renders at most four fees, so the total has to be
  // the total OF THOSE FOUR. Summing every recorded fee while showing a subset
  // produced a figure the visible lines could not add up to on all 408 pages —
  // a reader checking the arithmetic would find it wrong.
  const itemisedFees = moderate ? moderate.commonFees.slice(0, MAX_ITEMISED_FEES) : [];
  const feeTotals = moderate ? sumFeeRanges(itemisedFees) : null;
  const omittedFeeCount = moderate ? moderate.commonFees.length - itemisedFees.length : 0;
  const feeShares = (() => {
    if (!moderate || moderate.costRange.median <= 0) return [];
    return itemisedFees.flatMap((fee) => {
      const parsed = sumFeeRanges([fee]);
      if (!parsed) return [];
      const label = fee.replace(/\s*\([^)]*\)\s*$/, "").trim();
      const lowPct = (parsed.low / moderate.costRange.median) * 100;
      const highPct = (parsed.high / moderate.costRange.median) * 100;
      const fmt = (value: number) => (value < 1 ? value.toFixed(1) : String(Math.round(value)));
      return [
        `${label} runs ${formatCurrency(parsed.low)}–${formatCurrency(parsed.high)}, or ${fmt(
          lowPct,
        )}%–${fmt(highPct)}% of the ${stateInfo.name} median.`,
      ];
    });
  })();

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
                {stateInfo.name}. The recorded median total is{" "}
                <span className="font-mono font-semibold text-teal-700">
                  {formatCurrency(moderate.costRange.median)}
                </span>
                , with reported quotes clustering between{" "}
                <span className="font-mono font-semibold">{formatCurrency(moderate.costRange.low)}</span>{" "}
                and{" "}
                <span className="font-mono font-semibold">{formatCurrency(moderate.costRange.high)}</span>
                . Each statutory line below is sized against that median.
              </p>
              {feeShares.length > 0 && (
                <ul className="mt-3 list-disc space-y-1.5 pl-5">
                  {feeShares.map((share) => (
                    <li key={share}>{share}</li>
                  ))}
                </ul>
              )}
              {feeTotals && (
                <p className="mt-3">
                  Added together the itemised lines come to{" "}
                  <span className="font-mono font-semibold">{formatCurrency(feeTotals.low)}</span>–
                  <span className="font-mono font-semibold">{formatCurrency(feeTotals.high)}</span>,
                  which leaves roughly{" "}
                  <span className="font-mono font-semibold">
                    {formatCurrency(Math.max(0, moderate.costRange.median - feeTotals.high))}
                  </span>
                  –
                  <span className="font-mono font-semibold">
                    {formatCurrency(Math.max(0, moderate.costRange.median - feeTotals.low))}
                  </span>{" "}
                  of the {stateInfo.name} median as professional time — the part that
                  differs between quotes.
                  {omittedFeeCount > 0 && (
                    <>
                      {" "}
                      {omittedFeeCount === 1
                        ? "One further recorded fee is not itemised above and is not in that total."
                        : `${omittedFeeCount} further recorded fees are not itemised above and are not in that total.`}
                    </>
                  )}
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
