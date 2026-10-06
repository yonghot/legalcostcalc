/**
 * figures.ts — Central metadata registry for hardcoded figures that drive
 * results and are NOT already covered by per-row `sources` fields (see
 * src/data/seed/costs.json, which carries its own `sources[]` per row; page
 * dates live in src/data/content-dates.json).
 *
 * COMPLIANCE RULE (P0 risk-mitigation pass): only real, verifiable
 * `lastVerified` dates and `source` URLs may be recorded here. Where no
 * verifiable source/date exists in repo docs, tests, or comments, the entry
 * is set to `lastVerified: null` / `source: null` and MUST also be listed as
 * an "unsourced figure" in the compliance report — never invent a date or a
 * source URL.
 *
 */

export interface FigureMeta {
  /** Human label for the figure/constant this describes. */
  label: string;
  /** ISO date (YYYY-MM-DD) the figure was last verified, or null if unknown. */
  lastVerified: string | null;
  /** Source URL the figure was verified against, or null if unknown. */
  source: string | null;
  /** Free-text note — e.g. where the date/source was recovered from. */
  note?: string;
}

/**
 * Cost dataset (src/data/seed/costs.json). The 2026-06-29 "verification date"
 * was a constant bumped by hand; no comparison against the cited sources was
 * recorded, so the dataset carries no verification date. Per-row `sources[]`
 * URLs are in costs.json and shown in the UI (CostResult "Data Sources").
 */
export const COST_DATASET_FIGURE: FigureMeta = {
  label: "Legal cost dataset (all categories / states)",
  lastVerified: null,
  source: null,
  note:
    "No recorded comparison of the figures against the cited sources; page " +
    "dates come from src/data/content-dates.json and mark content changes.",
};

/**
 * Settlement estimator — one-third (33.33%) default contingency rate.
 * Source: cited inline in settlement-estimator-form.tsx and
 * settlement-estimator.ts (ABA Model Rule 1.5(c); Nolo, "Contingency Fee
 * Basics"). No specific verification date is recorded in repo history for
 * this constant, so `lastVerified` is left null per the no-fabrication rule.
 */
export const SETTLEMENT_CONTINGENCY_FIGURE: FigureMeta = {
  label: "Default contingency fee (33.33%)",
  lastVerified: null,
  source:
    "https://www.nolo.com/legal-encyclopedia/contingency-fees-lawyers-payment-28563.html",
  note:
    "ABA Model Rule 1.5(c) is also cited alongside Nolo in the UI, but no " +
    "verification date for this constant exists in repo docs/tests — do not " +
    "invent one.",
};

/** Figures with a known, repo-verifiable source AND date — safe to surface directly. */
export const VERIFIED_FIGURES: FigureMeta[] = [];

/** Figures missing a verifiable date and/or source — reported, never fabricated. */
export const UNSOURCED_FIGURES: FigureMeta[] = [COST_DATASET_FIGURE, SETTLEMENT_CONTINGENCY_FIGURE];
