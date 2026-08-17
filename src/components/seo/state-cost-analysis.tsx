import Link from "next/link";
import {
  buildStateCostContext,
  positionSentence,
  spreadSentence,
  complexitySentence,
  hoursSentence,
} from "@/lib/seo/state-context";
import { formatCurrency } from "@/lib/utils/format";
import type { LegalCostData } from "@/lib/types/cost";

/**
 * StateCostAnalysis — CODE-05 (부속W) per-entity publisher content.
 *
 * The measured problem: sibling pages here were 85.2% identical by 5-gram
 * overlap at ~830 body words, which is what "low value content" means in
 * practice — a template with the state name swapped. This section adds the
 * CODE-05 sections that were missing as ORIGINAL, per-entity analysis:
 *
 *   1. Methodology     — how the range is derived and what drives it
 *   2. This state in context — rank, vs peer median, implied hours, complexity
 *                        multiple, band width; every sentence shape chosen
 *                        conditionally from THIS state's numbers, so two
 *                        sibling pages differ structurally, not just numerically
 *   3. Worked examples — two, computed from this state's real simple/complex rows
 *   4. Assumptions & when this is wrong — the edge cases that break the estimate
 *   5. Sources         — the citations already attached to the row, with the date
 *
 * Server-rendered plain markup (no accordion, nothing client-gated) so a
 * crawler or reviewer with JS disabled reads the whole thing — the audit that
 * found this problem read raw HTML, and so does AdSense's review.
 *
 * UPL (CLAUDE.md invariant): descriptive statistics about published fee ranges
 * only. No recommendation, no outcome prediction, no application of law to a
 * situation, no "you should".
 */

interface Props {
  stateCode: string;
  stateName: string;
  categorySlug: string;
  /** Human label for the matter, e.g. "divorce" — used inside prose. */
  matterLabel: string;
  /** The moderate-complexity row for this pair (the page's headline figures). */
  moderate: LegalCostData | undefined;
  simple: LegalCostData | undefined;
  complex: LegalCostData | undefined;
}

export function StateCostAnalysis({
  stateCode,
  stateName,
  categorySlug,
  matterLabel,
  moderate,
  simple,
  complex,
}: Props) {
  if (!moderate) return null;

  const ctx = buildStateCostContext(stateCode, categorySlug, {
    hourlyRateMedian: moderate.hourlyRate.median,
    costLow: moderate.costRange.low,
    costHigh: moderate.costRange.high,
  });
  if (!ctx) return null;

  const sentences = [
    positionSentence(ctx, stateName, matterLabel),
    hoursSentence(ctx, matterLabel),
    complexitySentence(ctx, matterLabel),
    spreadSentence(ctx, matterLabel),
  ].filter((s): s is string => Boolean(s));

  const sources = Array.from(new Set(moderate.sources ?? []));

  // Per-row verification date (CLAUDE.md data rule: display lastVerifiedAt
  // wherever cost figures appear). Falls back to the raw string if unparseable
  // rather than inventing a date.
  const parsedVerified = new Date(moderate.lastVerifiedAt);
  const lastVerifiedLabel = Number.isNaN(parsedVerified.getTime())
    ? moderate.lastVerifiedAt
    : parsedVerified.toLocaleDateString("en-US", { year: "numeric", month: "long" });

  return (
    <section className="py-8" aria-labelledby="cost-analysis-heading">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 id="cost-analysis-heading" className="text-2xl font-bold text-slate-900">
          How the {stateName} {matterLabel} cost range is calculated
        </h2>

        {/* 1. Methodology */}
        <p className="mt-4 text-base leading-relaxed text-slate-700">
          Every figure on this page comes from published fee surveys and
          state-court fee schedules for {stateName}, not from a formula applied
          to a national average. Each matter type is recorded at three
          complexity tiers, and each tier carries its own low, median and high
          figure: the median is the middle of what the sources report, and the
          low and high mark where reported quotes stop clustering rather than
          the cheapest or most expensive case anyone has ever filed. The
          calculator above does not model your matter — it reads the tier you
          select and shows the recorded band for {stateName}, so the number you
          see is a description of the market, not a prediction about your case.
        </p>

        {/* 2. This state in context — conditional, per-entity prose */}
        <h3 className="mt-8 text-lg font-semibold text-slate-900">
          What the {stateName} numbers show
        </h3>
        <div className="mt-3 space-y-3">
          {sentences.map((sentence) => (
            <p key={sentence} className="text-base leading-relaxed text-slate-700">
              {sentence}
            </p>
          ))}
        </div>

        {/* 3. Worked examples from this state's real rows */}
        <h3 className="mt-8 text-lg font-semibold text-slate-900">
          Two worked examples using {stateName} figures
        </h3>
        <div className="mt-3 space-y-4">
          {simple && (
            <p className="text-base leading-relaxed text-slate-700">
              <span className="font-medium">Straightforward matter.</span> A{" "}
              {matterLabel} recorded at the simple tier in {stateName} has a
              median of {formatCurrency(simple.costRange.median)}, inside a band of{" "}
              {formatCurrency(simple.costRange.low)}–{formatCurrency(simple.costRange.high)}.
              At the tier&apos;s median hourly rate of{" "}
              {formatCurrency(simple.hourlyRate.median)} an hour, that median
              corresponds to roughly{" "}
              {Math.max(1, Math.round(simple.costRange.median / Math.max(1, simple.hourlyRate.median)))}{" "}
              hours of attorney time, and the sources put the typical timeline at{" "}
              {simple.typicalDuration}. Court and service costs are additional;
              the fees the sources list separately for this tier are{" "}
              {(simple.commonFees ?? []).join("; ") || "not itemised"}.
            </p>
          )}
          {complex && (
            <p className="text-base leading-relaxed text-slate-700">
              <span className="font-medium">Contested or complicated matter.</span>{" "}
              At the complex tier the {stateName} median rises to{" "}
              {formatCurrency(complex.costRange.median)} within a{" "}
              {formatCurrency(complex.costRange.low)}–{formatCurrency(complex.costRange.high)}{" "}
              band, and the recorded timeline stretches to{" "}
              {complex.typicalDuration}. The step up from the simple tier is
              what most people are actually asking about when they search for a
              cost: the same matter type, in the same state, with facts that
              require discovery, expert input or a hearing.
            </p>
          )}
        </div>

        {/* 4. Assumptions and when this is wrong */}
        <h3 className="mt-8 text-lg font-semibold text-slate-900">
          Assumptions, and when this estimate will be wrong
        </h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-slate-700">
          <li>
            The bands describe {stateName} as a whole. Metropolitan rates inside
            a state routinely sit above the statewide median, and rural rates
            below it, so a quote from a large-city firm can exceed the high end
            here without being out of line.
          </li>
          <li>
            Complexity is self-selected. If the tier you picked turns out to
            understate the matter — an uncontested filing that becomes
            contested, for example — the applicable band is the higher tier&apos;s,
            not an adjusted version of this one.
          </li>
          <li>
            Court filing fees and service costs are listed separately and are set
            by statute or local rule; they change on their own schedule,
            independently of attorney rates.
          </li>
          <li>
            Flat-fee, limited-scope and contingency arrangements do not map onto
            an hourly band at all. Where those dominate a matter type, the
            hourly figures are context rather than a billing forecast.
          </li>
          <li>
            The figures carry a verification date, not a live feed. Rates
            reported before the date shown below will lag current market rates.
          </li>
        </ul>

        {/* 5. Sources */}
        <h3 className="mt-8 text-lg font-semibold text-slate-900">
          Sources for the {stateName} figures
        </h3>
        {sources.length > 0 ? (
          <ul className="mt-3 space-y-1.5 text-sm">
            {sources.map((src) => (
              <li key={src}>
                <a
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-700 underline hover:text-teal-800"
                >
                  {(() => {
                    try {
                      return new URL(src).hostname.replace(/^www\./, "");
                    } catch {
                      return src;
                    }
                  })()}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            No source list is recorded for this row; treat the figures as an
            unverified estimate until one is added.
          </p>
        )}
        <p className="mt-3 text-xs text-slate-500">
          Figures last verified {lastVerifiedLabel}. Confirm current filing fees
          with the {stateName} court before relying on them, and see the{" "}
          <Link href="/how-legal-fees-work" className="font-medium text-teal-700 underline hover:text-teal-800">
            legal fees guide
          </Link>{" "}
          for how hourly, flat and contingency billing differ.
        </p>
      </div>
    </section>
  );
}
