/**
 * Settlement Net Estimator — pure utility (no side-effects, no I/O).
 *
 * Formula: net = gross * (1 - contingencyPct / 100) - caseCosts, clamped to >= 0
 *
 * Contingency-fee norm source:
 *   ABA Formal Opinion 11-458 & ABA Model Rules 1.5(c) confirm that contingency
 *   fees are lawful and customary in tort matters; the typical range is 25–40 %,
 *   with one-third (33.33 %) the most common pre-litigation rate.
 *   See also: Nolo, "Contingency Fee Basics"
 *   https://www.nolo.com/legal-encyclopedia/contingency-fees-lawyers-payment-28563.html
 *
 * INFORMATIONAL ONLY — NOT legal advice. Actual fees and costs are set by the
 * attorney agreement signed by the client.
 */

export interface SettlementEstimatorInput {
  /** Gross settlement amount in USD (must be > 0) */
  grossSettlement: number;
  /** Attorney contingency percentage (must be > 0 and <= 100) */
  contingencyPct: number;
  /** Total case costs advanced by attorney in USD (must be >= 0) */
  caseCosts: number;
}

export interface SettlementEstimatorResult {
  /** Estimated net amount the client receives, in USD (>= 0) */
  estimatedNetUSD: number;
  /** Amount going to attorney fees */
  attorneyFeeUSD: number;
  /** Total case costs deducted */
  caseCostsUSD: number;
  /** Effective net percentage of gross received by client */
  netPct: number;
}

export type SettlementEstimatorError =
  | "INVALID_GROSS"
  | "INVALID_CONTINGENCY_PCT"
  | "INVALID_CASE_COSTS"
  | "COSTS_EXCEED_NET";

export type SettlementEstimatorOutput =
  | { ok: true; result: SettlementEstimatorResult }
  | { ok: false; error: SettlementEstimatorError; message: string };

/**
 * Compute estimated client net from a gross personal-injury settlement.
 *
 * net = max(0, gross * (1 - contingencyPct / 100) - caseCosts)
 *
 * When `caseCosts > gross * (1 - contingencyPct / 100)` the net is clamped to
 * 0 and `error: "COSTS_EXCEED_NET"` is returned so the UI can surface a warning.
 */
export function estimateSettlementNet(
  input: SettlementEstimatorInput,
): SettlementEstimatorOutput {
  const { grossSettlement, contingencyPct, caseCosts } = input;

  // ── Input validation ───────────────────────────────────────────────────────
  if (
    typeof grossSettlement !== "number" ||
    !isFinite(grossSettlement) ||
    isNaN(grossSettlement) ||
    grossSettlement <= 0
  ) {
    return {
      ok: false,
      error: "INVALID_GROSS",
      message: "Gross settlement must be a positive number.",
    };
  }

  if (
    typeof contingencyPct !== "number" ||
    !isFinite(contingencyPct) ||
    isNaN(contingencyPct) ||
    contingencyPct <= 0 ||
    contingencyPct >= 100
  ) {
    return {
      ok: false,
      error: "INVALID_CONTINGENCY_PCT",
      message: "Contingency percentage must be between 0 and 100 (exclusive).",
    };
  }

  if (
    typeof caseCosts !== "number" ||
    !isFinite(caseCosts) ||
    isNaN(caseCosts) ||
    caseCosts < 0
  ) {
    return {
      ok: false,
      error: "INVALID_CASE_COSTS",
      message: "Case costs must be zero or a positive number.",
    };
  }

  // ── Computation ────────────────────────────────────────────────────────────
  const attorneyFeeUSD = grossSettlement * (contingencyPct / 100);
  const grossAfterFee = grossSettlement - attorneyFeeUSD;
  const rawNet = grossAfterFee - caseCosts;

  if (rawNet < 0) {
    // Deductions exceed the post-fee amount — clamp to 0 and surface warning.
    return {
      ok: false,
      error: "COSTS_EXCEED_NET",
      message:
        "Estimated case costs exceed the settlement net after attorney fees. " +
        "The estimated client net is $0. Verify your inputs with your attorney.",
    };
  }

  return {
    ok: true,
    result: {
      estimatedNetUSD: rawNet,
      attorneyFeeUSD,
      caseCostsUSD: caseCosts,
      netPct: (rawNet / grossSettlement) * 100,
    },
  };
}

/** Default contingency percentage (one-third / 33.33 %) — most common pre-litigation rate. */
export const DEFAULT_CONTINGENCY_PCT = 33.33;
