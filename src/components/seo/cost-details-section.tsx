interface CostDetailsSectionProps {
  categoryName: string;
  stateName: string;
  commonFees: string[];
}

export function CostDetailsSection({ categoryName, stateName, commonFees }: CostDetailsSectionProps) {
  return (
    <section className="border-t border-slate-100 bg-slate-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
