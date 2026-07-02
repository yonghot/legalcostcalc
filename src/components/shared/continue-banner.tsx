"use client";

import { History, X } from "lucide-react";
import { FOCUS_RING } from "@/lib/utils/styles";

interface ContinueBannerProps {
  onApply: () => void;
  onDismiss: () => void;
  className?: string;
}

/**
 * T16 — dismissible "Continue where you left off" banner. Rendered when
 * useCalculatorPersistence() has a saved, allowlist-filtered state for the
 * current calc_type. Applying calls the caller's restore() (which fires
 * state_restored); dismissing just hides the banner for this session
 * without firing any event or deleting the saved state.
 */
export function ContinueBanner({ onApply, onDismiss, className }: ContinueBannerProps) {
  return (
    <div
      role="status"
      className={`flex items-center justify-between gap-3 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 ${className ?? ""}`}
    >
      <div className="flex items-center gap-2.5">
        <History className="h-4 w-4 flex-shrink-0 text-teal-600" aria-hidden="true" />
        <p className="text-sm text-teal-800">You have a previous calculation saved.</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onApply}
          className={`rounded-md bg-teal-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-700 ${FOCUS_RING}`}
        >
          Continue where you left off
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className={`rounded-md p-1.5 text-teal-500 transition-colors hover:bg-teal-100 ${FOCUS_RING}`}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
