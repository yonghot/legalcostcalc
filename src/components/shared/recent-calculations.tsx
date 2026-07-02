"use client";

/**
 * T16 — homepage "Recent calculations" list. Client-only (localStorage
 * read), max 5 entries, calc_type + date ONLY — never a stored result value,
 * consistent with the sensitive-site rule (no result_bucket/input state
 * anywhere in local storage on legalcostcalc). Renders nothing when empty,
 * so the homepage looks identical to a first-time visitor.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { History } from "lucide-react";
import { getRecentCalculations } from "@/lib/hooks/use-calculator-persistence";
import { CATEGORY_MAP } from "@/lib/constants/categories";
import { CARD_HOVER, FOCUS_RING } from "@/lib/utils/styles";

interface RecentEntry {
  calcType: string;
  date: string;
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Maps a saved calc_type back to a human label + link, when it's a known category slug. Non-category calc_types (e.g. "settlement_estimator", "compare") get a generic fallback link. */
function resolveEntry(calcType: string): { label: string; href: string } | null {
  const category = CATEGORY_MAP.get(calcType);
  if (category) {
    return { label: `${category.displayName} Cost`, href: "/" };
  }
  if (calcType === "settlement_estimator") {
    return { label: "Settlement Net Estimator", href: "/settlement-estimator" };
  }
  if (calcType === "compare") {
    return { label: "Compare Legal Costs", href: "/compare" };
  }
  return null;
}

export function RecentCalculations() {
  const [entries, setEntries] = useState<RecentEntry[]>([]);

  // localStorage is client-only, so this must be resolved post-mount (avoids
  // an SSR/CSR hydration mismatch). Runs once ([] deps); no cascading-render
  // concern — mirrors the pattern in TermsGate.tsx.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntries(getRecentCalculations());
  }, []);

  if (entries.length === 0) return null;

  return (
    <section className="mt-8" aria-labelledby="recent-calculations-heading">
      <h2
        id="recent-calculations-heading"
        className="flex items-center gap-2 text-sm font-semibold text-slate-700"
      >
        <History className="h-4 w-4 text-slate-400" aria-hidden="true" />
        Recent calculations
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {entries.map((entry) => {
          const resolved = resolveEntry(entry.calcType);
          if (!resolved) return null;
          return (
            <Link
              key={entry.calcType}
              href={resolved.href}
              className={`inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 ${CARD_HOVER} ${FOCUS_RING}`}
            >
              <span className="font-medium text-slate-700">{resolved.label}</span>
              <span className="text-slate-400">{formatRelativeDate(entry.date)}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
