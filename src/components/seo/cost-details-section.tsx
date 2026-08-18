import Link from "next/link";
import { formatCurrency } from "@/lib/utils/format";
import type { CostRange, LegalCostData } from "@/lib/types";

interface CostDetailsSectionProps {
  categoryName: string;
  stateName: string;
  commonFees: string[];
  hourlyRate?: CostRange;
  typicalDuration?: string;
  /** All complexity rows for this pair — real data only, used for the levers list. */
  costs?: LegalCostData[];
}

export function CostDetailsSection({
  categoryName,
  stateName,
  commonFees,
  hourlyRate,
  typicalDuration,
  costs = [],
}: CostDetailsSectionProps) {
  // CODE-05 — "what affects cost" used to be a hardcoded five-item list,
  // byte-identical on all 408 pages and already covered by the answer block's
  // cost-factor list higher up. It is now the same five levers QUANTIFIED from
  // this state's own rows, so the section carries information instead of
  // repeating a generic checklist.
  const simple = costs.find((c) => c.complexity === "simple");
  const moderate = costs.find((c) => c.complexity === "moderate");
  const complex = costs.find((c) => c.complexity === "complex");
  const impliedHours = (row?: LegalCostData) =>
    row && row.hourlyRate.median > 0 ? Math.round(row.costRange.median / row.hourlyRate.median) : null;

  const levers: string[] = [];
  if (simple && complex && simple.costRange.median > 0) {
    levers.push(
      `Complexity tier: ${formatCurrency(simple.costRange.median)} simple to ${formatCurrency(
        complex.costRange.median,
      )} contested, a ${(complex.costRange.median / simple.costRange.median).toFixed(1)}x span.`,
    );
  }
  if (simple && complex && moderate) {
    levers.push(
      `Attorney rate: ${formatCurrency(simple.hourlyRate.low)}–${formatCurrency(
        complex.hourlyRate.high,
      )} an hour across the three tiers, median ${formatCurrency(
        moderate.hourlyRate.median,
      )} at moderate complexity.`,
    );
  }
  const hoursSimple = impliedHours(simple);
  const hoursModerate = impliedHours(moderate);
  const hoursComplex = impliedHours(complex);
  if (hoursSimple && hoursModerate && hoursComplex) {
    levers.push(
      `Billed hours: about ${hoursSimple} implied at the simple tier, ${hoursModerate} at moderate and ${hoursComplex} once contested.`,
    );
  }

  return (
    <section className="border-t border-slate-100 bg-slate-50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hourly rate + duration summary */}
        {(hourlyRate?.median ?? 0) > 0 && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-medium text-slate-500">
                Attorney Hourly Rate in {stateName}
              </h3>
              <p className="mt-1 font-mono text-lg font-bold text-slate-900">
                {formatCurrency(hourlyRate!.low)} – {formatCurrency(hourlyRate!.high)}
                <span className="ml-2 text-sm font-normal text-slate-500">
                  / hour
                </span>
              </p>
              <p className="mt-0.5 font-mono text-sm text-teal-600">
                Median: {formatCurrency(hourlyRate!.median)}/hr
              </p>
            </div>
            {typicalDuration && (
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-medium text-slate-500">
                  Typical Case Duration
                </h3>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {typicalDuration}
                </p>
                <p className="mt-0.5 text-sm text-slate-500">
                  For moderate complexity cases
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 text-xl font-bold text-slate-900">
              Common {categoryName} Fees in {stateName}
            </h2>
            <ul className="space-y-2">
              {commonFees.map((fee, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />
                  {fee}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-4 text-xl font-bold text-slate-900">
              What Affects {categoryName} Cost in {stateName}?
            </h2>
            {levers.length > 0 ? (
              <ul className="space-y-2 text-sm text-slate-700">
                {levers.map((lever) => (
                  <li key={lever} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />
                    {lever}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-600">
                Tier-by-tier figures for {stateName} are still being collected.
              </p>
            )}
          </div>
        </div>

        {/* U-05 (부속U §4/§5) — guide link, server-rendered inside this
            calculator-result-area section (curl/JS-off visible on every
            spoke page, unlike the client-only CostResult which only mounts
            after a user-driven calculation). */}
        <p className="mt-8 text-sm text-slate-500">
          New to how attorney fees work?{" "}
          <Link
            href="/how-legal-fees-work"
            className="font-medium text-teal-700 underline hover:text-teal-800"
          >
            Read the legal fees guide
          </Link>{" "}
          — hourly, flat, and contingency billing explained.
        </p>
      </div>
    </section>
  );
}
