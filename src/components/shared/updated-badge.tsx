import { BadgeCheck } from "lucide-react";

interface UpdatedBadgeProps {
  /**
   * ISO date (YYYY-MM-DD) the underlying data was last verified — MUST be a
   * real dataset field (e.g. DEFAULT_FIGURES_LAST_VERIFIED / a cost row's
   * `lastVerifiedAt`). Renders nothing when null (T11/anti-pattern #10: never
   * stamp a fabricated "Updated" date).
   */
  lastVerified: string | null;
  className?: string;
}

/**
 * T11 — visible "Updated for {year}" trust badge shown near the calculator
 * title. The year is read from the SAME real `lastVerified` field as the
 * JSON-LD `dateModified` and the AuthorByline "Last updated" line, so all
 * three freshness signals on a page always agree and are never stamped with
 * the current render date.
 */
export function UpdatedBadge({ lastVerified, className }: UpdatedBadgeProps) {
  if (!lastVerified) return null;
  const date = new Date(lastVerified);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 ${className ?? ""}`}
    >
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
      Updated for {year}
    </span>
  );
}
