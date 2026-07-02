/**
 * figures.ts — Central metadata registry for hardcoded figures that drive
 * results and are NOT already covered by per-row `sources`/`lastVerifiedAt`
 * fields (see src/data/seed/costs.json, which carries its own `sources[]`
 * per row and is versioned globally via DATA_VERSION_DATE).
 *
 * COMPLIANCE RULE (P0 risk-mitigation pass): only real, verifiable
 * `lastVerified` dates and `source` URLs may be recorded here. Where no
 * verifiable source/date exists in repo docs, tests, or comments, the entry
 * is set to `lastVerified: null` / `source: null` and MUST also be listed as
 * an "unsourced figure" in the compliance report — never invent a date or a
 * source URL.
 *
 * ResultDisclaimer reads DEFAULT_FIGURES_LAST_VERIFIED to render "Figures
 * last updated: {date}" next to calculator results.
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
 * Cost dataset (src/data/seed/costs.json) — global verification date.
 * Source: PROGRESS.md "Phase-3 Handoff Note (2026-06-29)" — `DATA_VERSION_DATE`
 * bumped to 2026-06-29 after the cost-data regression pass (banned-URL cleanup,
 * `tests/costs-data-integrity.test.ts`). Per-row `sources[]` URLs are carried in
 * costs.json itself and surfaced in the UI (CostResult "Data Sources").
 */
export const COST_DATASET_FIGURE: FigureMeta = {
  label: "Legal cost dataset (all categories / states)",
  lastVerified: "2026-06-29",
  source: null,
  note:
    "Per-row sources[] are embedded in src/data/seed/costs.json and rendered " +
    "inline on each result. This entry tracks the dataset-wide verification " +
    "pass date (DATA_VERSION_DATE in src/lib/constants/data-meta.ts).",
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
export const VERIFIED_FIGURES: FigureMeta[] = [COST_DATASET_FIGURE];

/** Figures missing a verifiable date and/or source — reported, never fabricated. */
export const UNSOURCED_FIGURES: FigureMeta[] = [SETTLEMENT_CONTINGENCY_FIGURE];

/**
 * Default "figures last updated" date shown by ResultDisclaimer when no
 * page-specific date is supplied. Mirrors DATA_VERSION_DATE.
 */
export const DEFAULT_FIGURES_LAST_VERIFIED = COST_DATASET_FIGURE.lastVerified;
