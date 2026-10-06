import { Users, ShieldCheck, Info, CalendarClock } from "lucide-react";
import { getReviewerConfig } from "@/lib/reviewer";
import { PUBLISHER } from "@/lib/constants/publisher";
import { formatDate, type DateBasis } from "@/lib/content-dates";

interface AuthorBylineProps {
  /** ISO date from the page family's content-dates record; null omits the date line. */
  lastUpdated: string | null;
  /** Basis of that record; a source re-check reads "Sources checked", anything else "Last updated". */
  basis?: DateBasis;
  className?: string;
}

/**
 * Byline shown on tool/result pages: the publisher, a factual review status,
 * and a date taken only from a content-dates record (never `new Date()`).
 *
 * Review status is env-driven (see src/lib/reviewer.ts): with
 * NEXT_PUBLIC_REVIEWER_NAME set it shows the real named reviewer; otherwise it
 * states that no licensed attorney has reviewed the page. Never claim a review,
 * a reviewer or a team that does not exist.
 */
export function AuthorByline({ lastUpdated, basis, className }: AuthorBylineProps) {
  const updatedLabel = lastUpdated ? formatDate(lastUpdated) : null;
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
          {basis === "sources-rechecked" ? "Sources checked" : "Last updated"}: {updatedLabel}
        </span>
      )}
    </div>
  );
}
