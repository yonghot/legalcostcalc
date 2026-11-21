import { formatCurrency, lowerKeepAcronyms } from "@/lib/utils/format";
import { buildBenchmarkSynthesis } from "@/lib/seo/geo";
import { sumFeeRanges } from "@/lib/seo/state-faq";
import { getNationalAverageStateCount, getNationalMidpoint } from "@/lib/page-index";
import { verifiedFeeForLine } from "@/lib/verified-fees";
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
  const simpleRow = costs.find((c) => c.complexity === "simple");
  const complexRow = costs.find((c) => c.complexity === "complex");
  const tierFigures =
    simpleRow && complexRow
      ? `The same state records a simple-tier median of ${formatCurrency(simpleRow.costRange.median)} (range ${formatCurrency(simpleRow.costRange.low)}–${formatCurrency(simpleRow.costRange.high)}) and a complex-tier median of ${formatCurrency(complexRow.costRange.median)} (range ${formatCurrency(complexRow.costRange.low)}–${formatCurrency(complexRow.costRange.high)}).`
      : null;
  const notes = categoryInfo.costFormationNotes ?? [];
  const hourlyBilled = Boolean(moderate && moderate.hourlyRate.median > 0);
  const contingencyBilled = Boolean(moderate && !hourlyBilled && moderate.contingencyFee);

  // Fee arithmetic is limited to fee lines with a dated primary source. The
  // seed's fee ranges are identical in every state, so dividing them into a
  // state median or adding them up produced precision the data does not have.
  const feeShares = (() => {
    if (!moderate || moderate.costRange.median <= 0) return [];
    return moderate.commonFees.flatMap((fee) => {
      if (!verifiedFeeForLine(fee, stateInfo.code, categoryInfo.slug)) return [];
      const parsed = sumFeeRanges([fee]);
      if (!parsed) return [];
      const label = fee.replace(/\s*\([^)]*\)\s*$/, "").trim();
      const lowPct = (parsed.low / moderate.costRange.median) * 100;
      const highPct = (parsed.high / moderate.costRange.median) * 100;
      const fmt = (value: number) => (value < 1 ? value.toFixed(1) : String(Math.round(value)));
      return [
        `${label} runs ${formatCurrency(parsed.low)}–${formatCurrency(parsed.high)}, or ${
          fmt(lowPct) === fmt(highPct) ? `${fmt(lowPct)}%` : `${fmt(lowPct)}%–${fmt(highPct)}%`
        } of the ${stateInfo.name} median.`,
      ];
    });
  })();

  // One national baseline per page: the table midpoint the per-state analysis ranks against, not the average of state medians (r4-truth-R4-W06).
  const benchmarkSynthesis = buildBenchmarkSynthesis({
    categoryDisplayName: categoryInfo.displayName,
    stateName: stateInfo.name,
    localMedian: moderate?.costRange.median,
    nationalAverage: getNationalMidpoint(categoryInfo.slug),
    stateCount: getNationalAverageStateCount(categoryInfo.slug),
    baselineKind: "midpoint",
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
                Take a moderate-complexity {lowerKeepAcronyms(categoryInfo.displayName)} matter in{" "}
                {stateInfo.name}. The estimated median {contingencyBilled ? "of estimated case expenses" : "total"} is{" "}
                <span className="font-mono font-semibold text-teal-700">
                  {formatCurrency(moderate.costRange.median)}
                </span>
                , with the estimated range running from{" "}
                <span className="font-mono font-semibold">{formatCurrency(moderate.costRange.low)}</span>{" "}
                and{" "}
                <span className="font-mono font-semibold">{formatCurrency(moderate.costRange.high)}</span>
                .
                {contingencyBilled &&
                  " The attorney's own fee on a contingency matter is a percentage of any recovery and is not part of these dollar figures."}
                {tierFigures && ` ${tierFigures}`}
                {feeShares.length > 0 && " Fees with a dated primary source are sized against that median below."}
              </p>
              {feeShares.length > 0 && (
                <ul className="mt-3 list-disc space-y-1.5 pl-5">
                  {feeShares.map((share) => (
                    <li key={share}>{share}</li>
                  ))}
                </ul>
              )}
              {benchmarkSynthesis && <p className="mt-3">{benchmarkSynthesis}</p>}
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
