import { Users, ShieldCheck, CalendarClock } from "lucide-react";

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
 * a clearly-marked reviewer PLACEHOLDER (we do NOT fabricate a named licensed
 * attorney — a real reviewer is listed under ownerNeeded), and a "Last updated"
 * date sourced ONLY from real verified-data fields (never `new Date()`).
 * Keeps trust signals honest and policy-safe for YMYL legal content.
 */
export function AuthorByline({ lastUpdated, className }: AuthorBylineProps) {
  const updatedLabel = formatUpdated(lastUpdated);

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
        {/* Placeholder — replace with a real licensed attorney reviewer (ownerNeeded). */}
        Reviewed for accuracy <span className="italic text-slate-400">(legal reviewer pending)</span>
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
