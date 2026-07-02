import { Users, ShieldCheck, CalendarClock } from "lucide-react";
import { getReviewerConfig } from "@/lib/reviewer";

interface AuthorBylineProps {
  /**
   * ISO date (YYYY-MM-DD) the page content was last updated — MUST come from
   * a real verified-data field (e.g. a cost row's `lastVerifiedAt`, or
   * DEFAULT_FIGURES_LAST_VERIFIED). T11/anti-pattern #10: never default this
   * to `new Date()` — that renders a fabricated "freshness" signal that
   * changes on every deploy regardless of whether the underlying data
   * changed (deceptive-freshness risk). When no verified date is available,
   * pass `null` explicitly and the byline omits the "Last updated" line
   * rather than inventing one.
   */
  lastUpdated: string | null;
  className?: string;
}

/**
 * E-E-A-T byline shown on tool/result pages: a generic editorial-team author,
 * a reviewer line, and a "Last updated" date sourced ONLY from real
 * verified-data fields (never `new Date()`).
 *
 * K06 — reviewer identity is env/config-driven (see src/lib/reviewer.ts):
 * when NEXT_PUBLIC_REVIEWER_NAME (+ optionally _CREDENTIALS) is set, the byline
 * shows the real named/licensed reviewer. When unset, it falls back to the
 * existing honest "(legal reviewer pending)" placeholder copy — we NEVER
 * fabricate a name or credential. Actual reviewer sourcing/contracting is an
 * owner action (P04 in the ad-revenue spec); this component only renders
 * whatever the owner has configured.
 */
export function AuthorByline({ lastUpdated, className }: AuthorBylineProps) {
  const updatedLabel = formatUpdated(lastUpdated);
  const reviewer = getReviewerConfig();

  return (
    <div
      className={`flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 ${className ?? ""}`}
    >
      <span className="inline-flex items-center gap-1.5">
        <Users className="h-4 w-4 text-slate-400" aria-hidden="true" />
        By the <span className="font-medium text-slate-600">LegalCostCalc Editorial Team</span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <ShieldCheck className="h-4 w-4 text-slate-400" aria-hidden="true" />
        {reviewer ? (
          <>
            Reviewed by{" "}
            <span className="font-medium text-slate-600">
              {reviewer.name}
              {reviewer.credentials ? `, ${reviewer.credentials}` : ""}
            </span>
          </>
        ) : (
          <>
            {/* Placeholder — replace by setting NEXT_PUBLIC_REVIEWER_NAME once a
                real licensed attorney reviewer is contracted (ownerNeeded). */}
            Reviewed for accuracy{" "}
            <span className="italic text-slate-400">(legal reviewer pending)</span>
          </>
        )}
      </span>
      {updatedLabel && (
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock className="h-4 w-4 text-slate-400" aria-hidden="true" />
          Last updated: {updatedLabel}
        </span>
      )}
    </div>
  );
}

/** Returns a human-readable "Month Year" label, or null when no valid verified date exists. */
function formatUpdated(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
