import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CategoryInfo } from "@/lib/types/category";
import { StateInfo } from "@/lib/types/state";

interface RelatedLinksProps {
  stateInfo: StateInfo;
  categoryInfo: CategoryInfo;
  otherCategories: CategoryInfo[];
  allOtherStates: StateInfo[];
}

const INITIAL_STATES_SHOWN = 10;

const linkClassName =
  "flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm transition-all hover:border-teal-200 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2";

export function RelatedLinks({ stateInfo, categoryInfo, otherCategories, allOtherStates }: RelatedLinksProps) {
  const displayedStates = allOtherStates.slice(0, INITIAL_STATES_SHOWN);
  const remainingStatesCount = allOtherStates.length - displayedStates.length;

  return (
    <section className="border-t border-slate-100 bg-slate-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Other categories in this state */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              Other Legal Costs in {stateInfo.name}
            </h3>
            <div className="space-y-2">
              {otherCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/${stateInfo.slug}/${cat.slug}-cost`}
                  className={linkClassName}
                >
                  <span className="font-medium text-slate-700">{cat.displayName} Cost</span>
                  <ArrowRight className="h-4 w-4 text-slate-300" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>

          {/* Same category in other states */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              {categoryInfo.displayName} Cost in Other States
            </h3>
            <div className="space-y-2">
              {displayedStates.map((state) => (
                <Link
                  key={state.code}
                  href={`/${state.slug}/${categoryInfo.slug}-cost`}
                  className={linkClassName}
                >
                  <span className="font-medium text-slate-700">{state.name}</span>
                  <ArrowRight className="h-4 w-4 text-slate-300" aria-hidden="true" />
                </Link>
              ))}
              {remainingStatesCount > 0 && (
                <details className="rounded-lg border border-slate-200 bg-white">
                  <summary className="cursor-pointer p-3 text-sm font-medium text-teal-600 hover:text-teal-700">
                    View {remainingStatesCount} more states
                  </summary>
                  <div className="space-y-2 p-3 pt-0">
                    {allOtherStates.slice(INITIAL_STATES_SHOWN).map((state) => (
                      <Link
                        key={state.code}
                        href={`/${state.slug}/${categoryInfo.slug}-cost`}
                        className={linkClassName}
                      >
                        <span className="font-medium text-slate-700">{state.name}</span>
                        <ArrowRight className="h-4 w-4 text-slate-300" aria-hidden="true" />
                      </Link>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
