import { AlertTriangle } from "lucide-react";
import { isSafeUrl } from "@/lib/utils/sanitize";

/**
 * ResultDisclaimer — layered disclaimer placed ADJACENT to calculator
 * results (never footer-only). Extends (does not duplicate) the existing
 * `Disclaimer` invariant component (src/components/shared/disclaimer.tsx),
 * which continues to render top+bottom on every page per CLAUDE.md.
 *
 * This component supplements that invariant with:
 *   - the strong LEGAL-vertical disclaimer skeleton (UPL risk mitigation)
 *   - an optional date label taken from the page family's content-dates record
 *   - an optional primary-source link slot
 *
 * Renders unconditionally (no env gate) — this is safety copy, not a
 * monetization/feature slot.
 */

export interface ResultDisclaimerProps {
  /** Date label such as "Updated October 2026"; omitted when no record exists. */
  dateText?: string | null;
  /** Optional primary-source URL to link ("verify with the official source"). Must be HTTPS. */
  sourceUrl?: string | null;
  /** Optional label for the source link. Defaults to "Primary source". */
  sourceLabel?: string;
  className?: string;
}

export function ResultDisclaimer({
  dateText,
  sourceUrl,
  sourceLabel = "Primary source",
  className,
}: ResultDisclaimerProps) {
  const safeSourceUrl = sourceUrl && isSafeUrl(sourceUrl) ? sourceUrl : null;

  return (
    <div
      className={`rounded-lg border border-amber-200 bg-amber-50 p-4 ${className ?? ""}`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700"
          aria-hidden="true"
        />
        <div className="space-y-2">
          <p className="text-sm leading-relaxed text-amber-700">
            This is an estimate for general informational purposes only. It is
            not legal advice. We are not a law firm, and no attorney-client
            relationship is created by using this tool. Figures may be
            outdated or inaccurate for your situation — verify with the
            official source. Costs vary by case and jurisdiction. Consult a
            licensed attorney in your jurisdiction before acting on these
            numbers.
          </p>
          {(dateText || safeSourceUrl) && (
            <p className="text-xs text-amber-600">
              {dateText}
              {dateText && safeSourceUrl && " · "}
              {safeSourceUrl && (
                <a
                  href={safeSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-amber-800"
                >
                  {sourceLabel}
                </a>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
