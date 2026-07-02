"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { FOCUS_RING } from "@/lib/utils/styles";

/**
 * TermsGate — clickwrap consent gate shown before the FIRST calculation.
 *
 * Requires an ACTIVE affirmative action (checkbox, unchecked by default —
 * never pre-checked, never browse-wrap). Persists consent in localStorage
 * with an ISO timestamp; once accepted, the gate never shows again on this
 * device/browser.
 *
 * Two integration modes:
 *   - `useTermsGate()` hook — for button-triggered calculators. Wrap the
 *     calculate/submit handler with `guard(fn)`; if consent hasn't been
 *     given yet, the inline checkbox card renders instead of running `fn`,
 *     and `fn` runs automatically once the box is checked and accepted.
 *   - `<TermsGateOverlay>` — for LIVE (slider-driven) calculators. Renders a
 *     non-dismissable overlay/inline card OVER the results area only; the
 *     inputs above/around it remain usable. Disappears permanently once
 *     agreed.
 *
 * SSR-safe: localStorage is only read/written inside effects/handlers, never
 * during render, so this never throws during server rendering.
 */

const STORAGE_KEY = "terms_gate_consent";

interface StoredConsent {
  accepted: true;
  acceptedAt: string; // ISO timestamp
}

function readStoredConsent(): StoredConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredConsent>;
    return parsed && parsed.accepted === true && typeof parsed.acceptedAt === "string"
      ? (parsed as StoredConsent)
      : null;
  } catch {
    return null;
  }
}

function writeStoredConsent(): void {
  if (typeof window === "undefined") return;
  try {
    const record: StoredConsent = {
      accepted: true,
      acceptedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // localStorage unavailable (private mode, quota, etc.) — consent will be
    // re-asked next time. Non-fatal; never throw from a compliance gate.
  }
}

/**
 * Hook for button-triggered calculators. Returns whether consent has been
 * recorded, a `checked` state for the inline checkbox UI, and a `guard()`
 * wrapper to gate the actual calculate handler.
 */
export function useTermsGate() {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null); // null = not yet resolved (SSR)
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Intentional: consent state depends on localStorage, which is only
    // readable on the client, so it must be resolved post-mount (avoids an
    // SSR/CSR hydration mismatch). Runs once ([] deps); no cascading-render
    // concern — mirrors the pattern in cookie-consent-banner.tsx.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasConsented(Boolean(readStoredConsent()));
  }, []);

  const accept = useCallback(() => {
    if (!checked) return false;
    writeStoredConsent();
    setHasConsented(true);
    return true;
  }, [checked]);

  /**
   * Wrap a calculate/submit handler: if consent already exists, calls `fn`
   * immediately. If not, does nothing (the caller should render
   * <TermsGateInline> and let the user accept, then retry).
   */
  const guard = useCallback(
    <T extends unknown[]>(fn: (...args: T) => void) =>
      (...args: T) => {
        if (hasConsented) fn(...args);
      },
    [hasConsented],
  );

  return {
    /** true = accepted, false = not yet accepted, null = not resolved (SSR/first paint) */
    hasConsented,
    checked,
    setChecked,
    accept,
    guard,
  };
}

interface TermsGateCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  onAccept: () => void;
  /** Disable the accept action until checked=true (caller may also disable button directly). */
  className?: string;
}

/**
 * Shared checkbox + label + "Continue" affordance. Used both inline (button-
 * triggered calculators) and inside the overlay (live calculators).
 */
export function TermsGateCheckbox({
  checked,
  onCheckedChange,
  onAccept,
  className,
}: TermsGateCheckboxProps) {
  const inputId = useId();

  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-4 ${className ?? ""}`}>
      <div className="flex items-start gap-3">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          className={`mt-0.5 h-4 w-4 flex-shrink-0 rounded border-slate-300 text-teal-600 ${FOCUS_RING}`}
        />
        <label htmlFor={inputId} className="text-sm text-slate-700">
          I agree to the{" "}
          <Link
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className={`text-teal-700 underline ${FOCUS_RING} rounded-sm`}
          >
            Terms of Use
          </Link>{" "}
          and understand results are estimates, not professional advice.
        </label>
      </div>
      <button
        type="button"
        onClick={onAccept}
        disabled={!checked}
        className={`mt-3 w-full rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${FOCUS_RING}`}
      >
        Continue
      </button>
    </div>
  );
}

/**
 * Inline variant — rendered in place of (or above) the calculate button on
 * button-triggered calculators until consent is recorded.
 */
export function TermsGateInline({
  checked,
  onCheckedChange,
  onAccept,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  onAccept: () => void;
}) {
  return (
    <TermsGateCheckbox
      checked={checked}
      onCheckedChange={onCheckedChange}
      onAccept={onAccept}
    />
  );
}

/**
 * Overlay variant — for LIVE (slider-driven) calculators. Renders a
 * non-dismissable card positioned over the RESULTS area only (pass the
 * results container as `children` alongside this, or render this as a sibling
 * absolutely positioned over the results region). Inputs stay usable; only
 * the results are obscured until the user agrees.
 */
export function TermsGateOverlay({
  checked,
  onCheckedChange,
  onAccept,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  onAccept: () => void;
}) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/95 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md">
        <div className="mb-3 flex items-center gap-2 text-slate-700">
          <ShieldAlert className="h-5 w-5 text-teal-600" aria-hidden="true" />
          <p className="text-sm font-medium">Before you see results</p>
        </div>
        <TermsGateCheckbox
          checked={checked}
          onCheckedChange={onCheckedChange}
          onAccept={onAccept}
        />
      </div>
    </div>
  );
}
