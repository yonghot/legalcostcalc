"use client";

/**
 * T15 — Shareable result URLs: "Copy link" + Web Share button rendered next
 * to a calculator result.
 *
 * SENSITIVE SITE (legalcostcalc, IS_SENSITIVE_SITE=true): per the spec's
 * sensitive-site exclusion, calculator inputs must NEVER be URL-encoded
 * (query params leak via logs/referrers) — the share target is the
 * CATEGORY/STATE-level CLEAN canonical path only (e.g.
 * "/california/divorce-cost"), with ZERO input/result state in the URL.
 * This is simpler than the non-sensitive-site pattern (query-param
 * serialization + hydration) because the clean spoke-page URL already *is*
 * the category-level result page — there is nothing to serialize. Complexity
 * (the one calculator input on this page) is deliberately EXCLUDED from the
 * shared URL, matching the "zero input state" requirement.
 *
 * `result_share` fires on click, never on mount (only a real share action).
 */

import { useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Copy, Check, Share2 } from "lucide-react";
import { FOCUS_RING } from "@/lib/utils/styles";
import { trackEvent } from "@/lib/analytics";
import { CANONICAL_ORIGIN } from "@/lib/seo";

interface ResultShareProps {
  /** calc_type for the result_share event, e.g. "divorce" or "settlement_estimator". */
  calcType: string;
  className?: string;
}

export function ResultShare({ calcType, className }: ResultShareProps) {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const [canWebShare, setCanWebShare] = useState(false);

  // Resolve navigator.share availability only on the client, post-mount —
  // avoids SSR/CSR mismatch (navigator is unavailable during SSR, so this
  // can't be computed in the initial render). Runs once ([] deps); no
  // cascading-render concern — mirrors the pattern in TermsGate.tsx.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanWebShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  // Clean category/state-level URL — no query string, no input/result state.
  const shareUrl = `${CANONICAL_ORIGIN}${pathname}`;

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable/denied — non-fatal, no fallback UI needed
      // since the link is also visible/selectable via the input if present.
    }
    trackEvent("result_share", { calc_type: calcType, method: "copy_link" });
  }, [shareUrl, calcType]);

  const handleWebShare = useCallback(async () => {
    try {
      await navigator.share({ url: shareUrl });
      trackEvent("result_share", { calc_type: calcType, method: "web_share" });
    } catch {
      // User cancelled the native share sheet, or the API rejected — no
      // event fires for a cancelled/failed share (mirrors "only a real
      // share action" for copy_link, which fires unconditionally since the
      // clipboard write is the action itself).
    }
  }, [shareUrl, calcType]);

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      <button
        type="button"
        onClick={handleCopyLink}
        className={`inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 ${FOCUS_RING}`}
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-teal-600" aria-hidden="true" />
            Link copied
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            Copy link to this result
          </>
        )}
      </button>
      {canWebShare && (
        <button
          type="button"
          onClick={handleWebShare}
          className={`inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 ${FOCUS_RING}`}
        >
          <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
          Share
        </button>
      )}
    </div>
  );
}
