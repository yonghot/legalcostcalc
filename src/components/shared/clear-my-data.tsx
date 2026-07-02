"use client";

import { useState, useCallback } from "react";
import { Trash2, Check } from "lucide-react";
import { FOCUS_RING } from "@/lib/utils/styles";
import { clearAllCalculatorData } from "@/lib/hooks/use-calculator-persistence";

interface ClearMyDataProps {
  className?: string;
  /**
   * "card" (default) — bordered white pill, for use on light surfaces (e.g.
   * near the calculator/results). "link" — bare text button matching the
   * footer's ManageConsentLink styling; pass className for the footer's
   * dark-theme text colors.
   */
  variant?: "card" | "link";
}

/**
 * T16 — visible "Clear my data" control. Wipes every `cc_*` localStorage
 * key (saved calculator state, recent-calculations list, internal-traffic
 * marker) via clearAllCalculatorData(). No confirmation dialog is used
 * (Next.js/browser confirm() is disruptive and this is a low-stakes,
 * reversible-by-recalculating action) — instead shows an inline "Cleared"
 * acknowledgement for 2s, mirroring the ResultShare "Link copied" pattern.
 */
export function ClearMyData({ className, variant = "card" }: ClearMyDataProps) {
  const [cleared, setCleared] = useState(false);

  const handleClear = useCallback(() => {
    clearAllCalculatorData();
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  }, []);

  const baseClasses =
    variant === "card"
      ? `inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 ${FOCUS_RING}`
      : "inline-flex items-center gap-1.5";

  return (
    <button
      type="button"
      onClick={handleClear}
      className={`${baseClasses} ${className ?? ""}`}
    >
      {cleared ? (
        <>
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          Cleared
        </>
      ) : (
        <>
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Clear my calculator data
        </>
      )}
    </button>
  );
}
