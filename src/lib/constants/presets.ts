import type { LegalCategorySlug } from "@/lib/types";

/**
 * U-01 — Preset one-click calculator scenarios (부속U §4/§5).
 *
 * Each entry is a REAL `{category, state_code, complexity}` combination that
 * exists as a row in src/data/seed/costs.json — never an invented/rounded
 * number. `tests/calculator-presets.test.ts` asserts every preset below
 * resolves to an actual dataset row (dataset/engine equality), so this file
 * can never drift from the real data without failing the build.
 *
 * Labels use neutral, non-advisory "Example: ..." framing (YMYL rule — no
 * advice verbs like "should"/"need to", no outcome claims) per 부속U §5's
 * per-repo parameter row for legalcostcalc:
 *   CA divorce (uncontested -> simple) / NY will (estate-planning, simple) /
 *   TX DUI (criminal, typical -> moderate).
 */

export interface CalculatorPreset {
  /** Stable id for the button's key + any future analytics correlation (never sent as an event param — see cost-calculator.tsx). */
  id: string;
  /** Neutral, non-advisory button label. */
  label: string;
  category: LegalCategorySlug;
  stateCode: string;
  complexity: "simple" | "moderate" | "complex";
}

export const CALCULATOR_PRESETS: readonly CalculatorPreset[] = [
  {
    id: "ca-divorce-simple",
    label: "Example: California divorce, uncontested",
    category: "divorce",
    stateCode: "CA",
    complexity: "simple",
  },
  {
    id: "ny-estate-planning-simple",
    label: "Example: New York will, simple estate",
    category: "estate-planning",
    stateCode: "NY",
    complexity: "simple",
  },
  {
    id: "tx-dui-moderate",
    label: "Example: Texas DUI, typical case",
    category: "dui",
    stateCode: "TX",
    complexity: "moderate",
  },
] as const;
