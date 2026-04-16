import { formatCurrency } from "@/lib/utils/format";
import type { CostRange } from "@/lib/types";

interface CostDetailsSectionProps {
  categoryName: string;
  stateName: string;
  commonFees: string[];
  hourlyRate?: CostRange;
  typicalDuration?: string;
}

export function CostDetailsSection({
  categoryName,
  stateName,
  commonFees,
  hourlyRate,
  typicalDuration,
}: CostDetailsSectionProps) {
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
              What Affects {categoryName} Cost?
            </h2>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />
                Case complexity (simple, moderate, or complex)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />
                Attorney experience and reputation
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />
                Local market rates in {stateName}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />
                Whether the case goes to trial or is settled
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />
                Court filing fees and administrative costs
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
