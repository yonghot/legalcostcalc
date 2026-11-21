import Link from "next/link";
import { formatCurrency } from "@/lib/utils/format";
import { FOCUS_RING } from "@/lib/utils/styles";
import { CASE_EXPENSE_MATTERS, stateWithTies, type CategoryStatRow } from "@/lib/seo/statistics";

interface StatisticsTableProps {
  rows: CategoryStatRow[];
}

/**
 * CODE-04 — ranked data table for the /legal-cost-statistics page: national
 * average, highest-cost state, and lowest-cost state per legal-matter
 * category, sorted most-expensive-first. Server-rendered plain <Link>s
 * (no client JS) so the table content — and the AI-citation target it
 * represents — is present in the initial HTML response.
 */
export function StatisticsTable({ rows }: StatisticsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <caption className="sr-only">
          Average state median legal cost by matter type, with highest- and lowest-cost states
        </caption>
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Matter Type
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Average of State Medians
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              States
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Highest-Cost State
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Lowest-Cost State
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              High vs. Low
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.categorySlug} className="transition-colors hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">
                <Link
                  href={`/category/${row.categorySlug}`}
                  className={`text-teal-700 underline-offset-2 hover:underline ${FOCUS_RING} rounded-sm`}
                >
                  {row.categoryDisplayName}
                </Link>
                {CASE_EXPENSE_MATTERS.has(row.categorySlug) && (
                  <span className="ml-1 font-normal text-slate-600">(case expenses)</span>
                )}
              </td>
              <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                {formatCurrency(row.nationalAverage)}
              </td>
              <td className="px-4 py-3 font-mono text-slate-600">{row.stateCount}</td>
              <td className="px-4 py-3">
                <Link
                  href={`/${row.highestState.slug}/${row.categorySlug}-cost`}
                  className={`font-mono text-slate-700 hover:text-teal-700 hover:underline ${FOCUS_RING} rounded-sm`}
                >
                  {stateWithTies(row.highestState)}: {formatCurrency(row.highestState.median)}
                </Link>
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/${row.lowestState.slug}/${row.categorySlug}-cost`}
                  className={`font-mono text-slate-700 hover:text-teal-700 hover:underline ${FOCUS_RING} rounded-sm`}
                >
                  {stateWithTies(row.lowestState)}: {formatCurrency(row.lowestState.median)}
                </Link>
              </td>
              <td className="px-4 py-3 font-mono text-slate-600">+{row.highVsLowPercent}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
