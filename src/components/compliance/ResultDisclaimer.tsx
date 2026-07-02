import { AlertTriangle } from "lucide-react";
import { isSafeUrl } from "@/lib/utils/sanitize";
import { DEFAULT_FIGURES_LAST_VERIFIED } from "@/lib/constants/figures";

/**
 * ResultDisclaimer — layered disclaimer placed ADJACENT to calculator
 * results (never footer-only). Extends (does not duplicate) the existing
 * `Disclaimer` invariant component (src/components/shared/disclaimer.tsx),
 * which continues to render top+bottom on every page per CLAUDE.md.
 *
 * This component supplements that invariant with:
 *   - the strong LEGAL-vertical disclaimer skeleton (UPL risk mitigation)
 *   - a "Figures last updated" date read from the central figures config
 *   - an optional primary-source link slot
 *
 * Renders unconditionally (no env gate) — this is safety copy, not a
 * monetization/feature slot.
 */

export interface ResultDisclaimerProps {
  /** ISO date (YYYY-MM-DD) the relevant figures were last verified. Falls back to the dataset default. */
  lastVerified?: string | null;
  /** Optional primary-source URL to link ("verify with the official source"). Must be HTTPS. */
  sourceUrl?: string | null;
  /** Optional label for the source link. Defaults to "Primary source". */
  sourceLabel?: string;
  className?: string;
}

export function ResultDisclaimer({
  lastVerified = DEFAULT_FIGURES_LAST_VERIFIED,
  sourceUrl,
  sourceLabel = "Primary source",
  className,
}: ResultDisclaimerProps) {
  const safeSourceUrl = sourceUrl && isSafeUrl(sourceUrl) ? sourceUrl : null;

  const formattedDate = lastVerified
    ? new Date(lastVerified).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

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
          {(formattedDate || safeSourceUrl) && (
            <p className="text-xs text-amber-600">
              {formattedDate && <>Figures last updated: {formattedDate}</>}
              {formattedDate && safeSourceUrl && " · "}
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
