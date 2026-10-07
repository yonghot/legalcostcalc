import Link from "next/link";
import { MethodNote } from "@/components/seo/method-note";
import { UpdatedBadge } from "@/components/shared/updated-badge";
import { buildStatisticsAggregate, widestSpreadRow } from "@/lib/seo/statistics";
import { getFamilyDate } from "@/lib/content-dates";
import { formatCurrency } from "@/lib/utils/format";
import { FOCUS_RING } from "@/lib/utils/styles";

const linkClass = `font-medium text-teal-700 underline hover:text-teal-800 ${FOCUS_RING} rounded-sm`;

export function CompareOverview() {
  const { categoryRows } = buildStatisticsAggregate();
  const widest = widestSpreadRow(categoryRows);
  if (!widest) return null;

  const matter = widest.categoryDisplayName;
  const gap = widest.highestState.median - widest.lowestState.median;

  return (
    <section aria-labelledby="compare-overview-heading" className="mt-12 border-t border-slate-200 pt-10">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="compare-overview-heading" className="text-2xl font-bold text-slate-900">
          How far apart state estimates sit
        </h2>
        <UpdatedBadge record={getFamilyDate("page:compare")} />
      </div>
      <p className="mt-3 text-slate-700">
        The tool above sets two states side by side for one matter type, or two matter types within one
        state, at the simple, moderate, and complex levels. This overview shows how wide the gaps between
        states run in the estimates behind it, using each state&apos;s moderate-complexity median.
      </p>

      <h3 className="mt-8 text-lg font-semibold text-slate-900">
        Example: {matter} in {widest.highestState.name} and {widest.lowestState.name}
      </h3>
      <p className="mt-2 text-slate-700">
        {matter} shows the widest gap of the {categoryRows.length} matter types. The median estimate is{" "}
        <span className="font-mono font-semibold">{formatCurrency(widest.highestState.median)}</span> in{" "}
        {widest.highestState.name} and{" "}
        <span className="font-mono font-semibold">{formatCurrency(widest.lowestState.median)}</span> in{" "}
        {widest.lowestState.name}, a difference of {formatCurrency(gap)}, or {widest.highVsLowPercent}% more
        in {widest.highestState.name} than in {widest.lowestState.name}. The average of state medians for{" "}
        {matter.toLowerCase()} is {formatCurrency(widest.nationalAverage)}, taken over the{" "}
        {widest.stateCount} states counted.
      </p>

      <h3 className="mt-8 text-lg font-semibold text-slate-900">Highest and lowest state by matter type</h3>
      <ul className="mt-3 space-y-2 text-slate-700">
        {categoryRows.map((row) => (
          <li key={row.categorySlug}>
            <Link href={`/category/${row.categorySlug}`} className={linkClass}>
              {row.categoryDisplayName}
            </Link>
            : {row.highestState.name} {formatCurrency(row.highestState.median)}, {row.lowestState.name}{" "}
            {formatCurrency(row.lowestState.median)}, {row.stateCount} states counted.
          </li>
        ))}
      </ul>

      <h3 className="mt-8 text-lg font-semibold text-slate-900">How to read these figures</h3>
      <p className="mt-2 text-slate-700">
        Each figure is the median estimate for a state at moderate complexity, shown as one number so states
        can be lined up. A state is counted for a matter type only when its estimate is sourced and differs
        from every other state&apos;s figure, so the number of states counted varies by matter type.
      </p>
      <MethodNote scope="each state" className="mt-3 text-slate-700" />
      <p className="mt-3 text-slate-700">
        A gap between two states describes the estimates only. It does not predict what a particular
        attorney would charge, which depends on the matter, its complexity, and the terms of the
        engagement. The full table with averages is on{" "}
        <Link href="/legal-cost-statistics" className={linkClass}>
          Legal Cost Statistics
        </Link>
        , and how fees are billed is explained in{" "}
        <Link href="/how-legal-fees-work" className={linkClass}>
          how legal fees work
        </Link>
        .
      </p>
    </section>
  );
}
