import { Users, ShieldCheck, Info, CalendarClock } from "lucide-react";
import { getReviewerConfig } from "@/lib/reviewer";
import { PUBLISHER } from "@/lib/constants/publisher";

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
 * Byline shown on tool/result pages: the publisher, a factual review status,
 * and a "Last updated" date sourced ONLY from real verified-data fields
 * (never `new Date()`).
 *
 * Review status is env-driven (see src/lib/reviewer.ts): with
 * NEXT_PUBLIC_REVIEWER_NAME set it shows the real named reviewer; otherwise it
 * states that no licensed attorney has reviewed the page. Never claim a review,
 * a reviewer or a team that does not exist.
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
        Published by{" "}
        <a
          href={PUBLISHER.url}
          rel="noopener"
          className="font-medium text-slate-600 underline"
        >
          {PUBLISHER.name}
        </a>
      </span>
      {reviewer ? (
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-slate-400" aria-hidden="true" />
          Reviewed by{" "}
          <span className="font-medium text-slate-600">
            {reviewer.name}
            {reviewer.credentials ? `, ${reviewer.credentials}` : ""}
          </span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5">
          <Info className="h-4 w-4 text-slate-400" aria-hidden="true" />
          Not reviewed by a licensed attorney.
        </span>
      )}
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
