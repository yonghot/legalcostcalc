"use client";

/**
 * T16 — useCalculatorPersistence: shared localStorage persistence hook.
 *
 * Auto-saves the last inputs for a calc_type to `cc_state_{calc_type}`
 * (JSON, versioned via a `schemaVersion` field). Consumers use the returned
 * `savedState` to render a dismissible "Continue where you left off" banner;
 * applying it should call `restore()`, which fires `state_restored` — the
 * ONLY place this fires (never automatically on mount/load).
 *
 * SENSITIVE SITE (legalcostcalc, IS_SENSITIVE_SITE=true): matter-detail
 * field persistence is OFF BY DEFAULT. Callers must pass an explicit
 * `allowedFields` allowlist of the field keys that are safe to persist for
 * that calculator; any field not in the allowlist is silently dropped
 * before it ever reaches localStorage. `CostCalculator`'s three fields
 * (category, stateCode, complexity) are route-level/non-sensitive selectors
 * already exposed in the URL path — they are the intended default allowlist.
 * Free-text/numeric matter-detail fields (e.g. the settlement estimator's
 * gross/pct/costs) must NOT be included in any allowlist passed here unless
 * a future explicit user-facing toggle authorizes it (not implemented in
 * this wave — no such toggle exists yet, so no numeric/financial field is
 * ever persisted).
 *
 * Client-side only — no consent-surface change (localStorage functional
 * storage, no new pixels/scripts).
 */

import { useCallback, useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";

const SCHEMA_VERSION = 1;
const STORAGE_PREFIX = "cc_state_";
const RECENT_CALCULATIONS_KEY = "cc_recent_calculations";
const MAX_RECENT = 5;

export interface PersistedCalculatorState<T extends object> {
  schemaVersion: number;
  calcType: string;
  savedAt: string; // ISO timestamp
  fields: Partial<T>;
}

interface RecentCalculationEntry {
  calcType: string;
  date: string; // ISO timestamp
}

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded / private mode / disabled storage — non-fatal, the
    // "Continue where you left off" feature simply won't persist.
  }
}

/**
 * Filters `fields` down to only the keys present in `allowedFields`. Applied
 * BEFORE anything is written to localStorage or read back out — the
 * allowlist is enforced on both write and read so a value written by an
 * older/looser allowlist can never leak back in after a tightened allowlist
 * ships.
 */
function pickAllowed<T extends object>(
  fields: Partial<T>,
  allowedFields: readonly (keyof T)[],
): Partial<T> {
  const out: Partial<T> = {};
  for (const key of allowedFields) {
    if (key in fields) {
      out[key] = fields[key];
    }
  }
  return out;
}

/** Appends a { calcType, date } entry to the homepage "Recent calculations" list (max 5, most-recent-first). Never stores result/input values — calc_type + date only, safe on sensitive sites. */
function pushRecentCalculation(calcType: string): void {
  if (typeof window === "undefined") return;
  const existing = readJson<RecentCalculationEntry[]>(RECENT_CALCULATIONS_KEY) ?? [];
  const withoutDupe = existing.filter((e) => e.calcType !== calcType);
  const updated = [{ calcType, date: new Date().toISOString() }, ...withoutDupe].slice(
    0,
    MAX_RECENT,
  );
  writeJson(RECENT_CALCULATIONS_KEY, updated);
}

export function getRecentCalculations(): RecentCalculationEntry[] {
  return readJson<RecentCalculationEntry[]>(RECENT_CALCULATIONS_KEY) ?? [];
}

/**
 * Wipes every `cc_*` key from localStorage (the "Clear my data" control).
 * Matches the SAME prefix used by this hook (`cc_state_*`), the recent-
 * calculations list (`cc_recent_calculations`), and the T02 internal-traffic
 * marker (`cc_traffic_type`) — a single control clears all first-party
 * calculator-related local storage.
 */
export function clearAllCalculatorData(): void {
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith("cc_")) keys.push(key);
    }
    for (const key of keys) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Non-fatal — storage unavailable.
  }
}

interface UseCalculatorPersistenceOptions<T extends object> {
  calcType: string;
  /** Allowlist of field keys safe to persist for this calc_type (sensitive-site gate — see module docs). */
  allowedFields: readonly (keyof T)[];
}

export function useCalculatorPersistence<T extends object>({
  calcType,
  allowedFields,
}: UseCalculatorPersistenceOptions<T>) {
  const storageKey = `${STORAGE_PREFIX}${calcType}`;
  const [savedState, setSavedState] = useState<PersistedCalculatorState<T> | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Resolve saved state post-mount only (localStorage is client-only) —
  // avoids SSR/CSR hydration mismatch. Never fires state_restored here.
  useEffect(() => {
    const raw = readJson<PersistedCalculatorState<T>>(storageKey);
    if (raw && raw.schemaVersion === SCHEMA_VERSION) {
      const filtered: PersistedCalculatorState<T> = {
        ...raw,
        fields: pickAllowed(raw.fields, allowedFields),
      };
      if (Object.keys(filtered.fields).length > 0) {
        setSavedState(filtered);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  /** Auto-saves the given fields (filtered through allowedFields) for this calc_type. Call on every real input change. */
  const save = useCallback(
    (fields: Partial<T>) => {
      const filtered = pickAllowed(fields, allowedFields);
      if (Object.keys(filtered).length === 0) return;
      const record: PersistedCalculatorState<T> = {
        schemaVersion: SCHEMA_VERSION,
        calcType,
        savedAt: new Date().toISOString(),
        fields: filtered,
      };
      writeJson(storageKey, record);
    },
    [calcType, storageKey, allowedFields],
  );

  /**
   * Records this calc_type as a homepage "Recent calculation" (calc_type +
   * date only). Call on a completed/successful calculation, independent of
   * `save()`. Accepts an optional override for calculators whose storage
   * namespace (`calcType` passed to the hook) differs from the semantic
   * calc_type of the specific calculation just completed (e.g.
   * CostCalculator uses a fixed "cost_calculator" storage namespace but
   * should record the user's actually-selected category here).
   */
  const recordRecent = useCallback(
    (calcTypeOverride?: string) => {
      pushRecentCalculation(calcTypeOverride ?? calcType);
    },
    [calcType],
  );

  /**
   * Applies the saved state to the caller's own input state (via `onApply`),
   * dismisses the banner, and fires state_restored — the ONLY call site for
   * this event. Never called automatically; only from a user clicking
   * "Continue where you left off". Accepts the same calcTypeOverride as
   * recordRecent(), for the same reason.
   */
  const restore = useCallback(
    (onApply: (fields: Partial<T>) => void, calcTypeOverride?: string) => {
      if (!savedState) return;
      onApply(savedState.fields);
      setBannerDismissed(true);
      trackEvent("state_restored", { calc_type: calcTypeOverride ?? calcType });
    },
    [savedState, calcType],
  );

  const dismissBanner = useCallback(() => {
    setBannerDismissed(true);
  }, []);

  const clearThisCalculator = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // Non-fatal.
    }
    setSavedState(null);
  }, [storageKey]);

  return {
    /** Non-null when a valid, allowlist-filtered saved state exists and the banner hasn't been dismissed. */
    savedState: bannerDismissed ? null : savedState,
    save,
    restore,
    dismissBanner,
    clearThisCalculator,
    recordRecent,
  };
}
