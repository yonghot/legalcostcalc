"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CategoryInfo } from "@/lib/types/category";
import { StateInfo } from "@/lib/types/state";
import { CARD_HOVER, FOCUS_RING } from "@/lib/utils/styles";
import { trackEvent } from "@/lib/analytics";

function handleRelatedClick(linkUrl: string) {
  trackEvent("related_click", { link_module: "inline", link_url: linkUrl });
}

interface RelatedLinksProps {
  stateInfo: StateInfo;
  categoryInfo: CategoryInfo;
  otherCategories: CategoryInfo[];
  allOtherStates: StateInfo[];
}

// T07 build-time cap: total TEMPLATE-GENERATED internal links per spoke page
// must stay <=20 (breadcrumb[2] + hub-bar[2] + otherCategories[7] +
// STATES_SHOWN + 1 "view all states" hub link). See
// tests/internal-link-cap.test.ts for the full-page assertion. This module
// renders otherCategories (7) + STATES_SHOWN state links + 1 hub link — no
// "view N more states" wall of 40 extra DOM links.
const INITIAL_STATES_SHOWN = 6;

const linkClassName =
  `flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm ${CARD_HOVER} ${FOCUS_RING}`;

export function RelatedLinks({ stateInfo, categoryInfo, otherCategories, allOtherStates }: RelatedLinksProps) {
  const displayedStates = allOtherStates.slice(0, INITIAL_STATES_SHOWN);
  const remainingStatesCount = allOtherStates.length - displayedStates.length;

  return (
    <section className="border-t border-slate-100 bg-slate-50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Other categories in this state */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              Other Legal Costs in {stateInfo.name}
            </h3>
            <div className="space-y-2">
              {otherCategories.map((cat) => {
                const href = `/${stateInfo.slug}/${cat.slug}-cost`;
                return (
                  <Link
                    key={cat.slug}
                    href={href}
                    className={linkClassName}
                    onClick={() => handleRelatedClick(href)}
                  >
                    <span className="font-medium text-slate-700">{cat.displayName} Cost</span>
                    <ArrowRight className="h-5 w-5 text-slate-300" aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Same category in other states */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              {categoryInfo.displayName} Cost in Other States
            </h3>
            <div className="space-y-2">
              {displayedStates.map((state) => {
                const href = `/${state.slug}/${categoryInfo.slug}-cost`;
                return (
                  <Link
                    key={state.code}
                    href={href}
                    className={linkClassName}
                    onClick={() => handleRelatedClick(href)}
                  >
                    <span className="font-medium text-slate-700">{state.name}</span>
                    <ArrowRight className="h-5 w-5 text-slate-300" aria-hidden="true" />
                  </Link>
                );
              })}
              {/* T07: link to the category hub page (which lists all states in
                  a real data table) instead of rendering the remaining ~40
                  state links directly in this page's DOM — keeps this spoke
                  page's template-generated internal link count <=20. */}
              {remainingStatesCount > 0 && (
                <Link
                  href={`/category/${categoryInfo.slug}`}
                  className={`flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm font-medium text-teal-600 hover:text-teal-700 ${FOCUS_RING}`}
                  onClick={() => trackEvent("related_click", { link_module: "hub", link_url: `/category/${categoryInfo.slug}` })}
                >
                  View all {remainingStatesCount + displayedStates.length} states
                  <ArrowRight className="h-5 w-5 text-teal-300" aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
