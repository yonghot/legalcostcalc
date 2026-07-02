"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CATEGORIES } from "@/lib/constants/categories";
import { hasUniqueData } from "@/lib/page-index";
import { CARD_HOVER, FOCUS_RING } from "@/lib/utils/styles";
import { trackEvent } from "@/lib/analytics";

interface RelatedMattersProps {
  stateCode: string;
  stateSlug: string;
  stateName: string;
  /** Current category slug — excluded from suggestions. */
  categorySlug: string;
}

const MAX_LINKS = 5;
const MIN_LINKS = 3;

function handleRelatedClick(linkUrl: string) {
  trackEvent("related_click", { link_module: "result_related", link_url: linkUrl });
}

/**
 * T06 — RelatedCalculators-at-the-result-moment module. INTERNAL sibling
 * links only (never the cross-SITE module, which stays
 * src/components/seo/related-calculators.tsx / link_type:'crosslink').
 *
 * Renders ONLY when the caller has a user-driven result (mounted inside
 * CostResult, which itself only renders once `results` is set by a real
 * calculation — see cost-calculator.tsx's hasUserInteractedRef/T03 guard).
 *
 * Links are computed from the same static dataset (CATEGORIES) that backs
 * the programmatic pages, filtered through the T09 hasUniqueData gate so
 * this module never links to a thin/noindexed page. Never input-derived —
 * suggestions are keyed only on the current category + state, both of which
 * are non-sensitive route params, never a calculator result value.
 */
export function RelatedMatters({ stateCode, stateSlug, stateName, categorySlug }: RelatedMattersProps) {
  const candidates = CATEGORIES.filter(
    (c) => c.slug !== categorySlug && hasUniqueData(stateCode, c.slug),
  ).slice(0, MAX_LINKS);

  if (candidates.length < MIN_LINKS) return null;

  return (
    <section
      className="mt-8 rounded-lg border border-slate-200 bg-white p-5"
      aria-labelledby="related-matters-heading"
    >
      <h2 id="related-matters-heading" className="text-base font-semibold text-slate-900">
        More calculators
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Other legal matter costs in {stateName}.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {candidates.map((cat) => {
          const href = `/${stateSlug}/${cat.slug}-cost`;
          return (
            <Link
              key={cat.slug}
              href={href}
              onClick={() => handleRelatedClick(href)}
              className={`flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ${CARD_HOVER} ${FOCUS_RING}`}
            >
              <span className="font-medium text-slate-700">{cat.displayName} Cost</span>
              <ArrowRight className="h-4 w-4 text-slate-300" aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
