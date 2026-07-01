/**
 * Unit tests for src/lib/utils/settlement-estimator.ts
 *
 * Formula: net = gross * (1 - contingencyPct / 100) - caseCosts, clamped >= 0
 *
 * Test cases:
 *   - Normal case: valid inputs => correct split
 *   - Zero case costs: net = gross * (1 - contingencyPct/100)
 *   - Costs > post-fee amount => COSTS_EXCEED_NET error (net clamped to 0)
 *   - Invalid gross (zero, negative, NaN, Infinity, non-number) => INVALID_GROSS
 *   - Invalid contingencyPct (0, 100, negative, > 100, NaN) => INVALID_CONTINGENCY_PCT
 *   - Invalid caseCosts (negative, NaN) => INVALID_CASE_COSTS
 *   - Boundary: gross == caseCosts after attorney fee (net == 0)
 *   - Default contingency constant is 33.33
 */

import { describe, it, expect } from "vitest";
import {
  estimateSettlementNet,
  DEFAULT_CONTINGENCY_PCT,
} from "@/lib/utils/settlement-estimator";

// ── Helpers ────────────────────────────────────────────────────────────────────

function ok(output: ReturnType<typeof estimateSettlementNet>) {
  if (!output.ok) throw new Error(`Expected ok=true, got error: ${output.error}`);
  return output.result;
}

function err(output: ReturnType<typeof estimateSettlementNet>) {
  if (output.ok) throw new Error("Expected ok=false, got ok=true");
  return output;
}

// ── Normal cases ───────────────────────────────────────────────────────────────

describe("estimateSettlementNet — normal cases", () => {
  it("computes correct split: $100,000 gross, 33% contingency, $5,000 costs", () => {
    const result = ok(
      estimateSettlementNet({
        grossSettlement: 100_000,
        contingencyPct: 33,
        caseCosts: 5_000,
      }),
    );
    // Attorney fee: 100,000 * 0.33 = 33,000
    // Net after fee: 100,000 - 33,000 = 67,000
    // Net after costs: 67,000 - 5,000 = 62,000
    expect(result.attorneyFeeUSD).toBeCloseTo(33_000, 2);
    expect(result.caseCostsUSD).toBe(5_000);
    expect(result.estimatedNetUSD).toBeCloseTo(62_000, 2);
    expect(result.netPct).toBeCloseTo(62, 2);
  });

  it("computes correct split using default contingency 33.33%", () => {
    const result = ok(
      estimateSettlementNet({
        grossSettlement: 300_000,
        contingencyPct: DEFAULT_CONTINGENCY_PCT,
        caseCosts: 10_000,
      }),
    );
    // Attorney fee: 300,000 * 0.3333 = 99,990
    // Net after fee: 300,000 - 99,990 = 200,010
    // Net after costs: 200,010 - 10,000 = 190,010
    expect(result.attorneyFeeUSD).toBeCloseTo(99_990, 0);
    expect(result.estimatedNetUSD).toBeCloseTo(190_010, 0);
  });

  it("works with 40% contingency (complex cases, near-trial)", () => {
    const result = ok(
      estimateSettlementNet({
        grossSettlement: 500_000,
        contingencyPct: 40,
        caseCosts: 20_000,
      }),
    );
    // Attorney fee: 500,000 * 0.40 = 200,000
    // Post-fee: 300,000; minus costs: 280,000
    expect(result.attorneyFeeUSD).toBeCloseTo(200_000, 2);
    expect(result.estimatedNetUSD).toBeCloseTo(280_000, 2);
    expect(result.netPct).toBeCloseTo(56, 2);
  });
});

// ── Zero case costs ────────────────────────────────────────────────────────────

describe("estimateSettlementNet — zero case costs", () => {
  it("returns net = gross * (1 - contingency) when caseCosts = 0", () => {
    const result = ok(
      estimateSettlementNet({
        grossSettlement: 100_000,
        contingencyPct: 25,
        caseCosts: 0,
      }),
    );
    expect(result.estimatedNetUSD).toBeCloseTo(75_000, 2);
    expect(result.caseCostsUSD).toBe(0);
    expect(result.netPct).toBeCloseTo(75, 2);
  });
});

// ── Costs exceed post-fee net (clamped) ───────────────────────────────────────

describe("estimateSettlementNet — costs exceed net after fees", () => {
  it("returns COSTS_EXCEED_NET when case costs exceed gross after attorney fee", () => {
    const output = err(
      estimateSettlementNet({
        grossSettlement: 10_000,
        contingencyPct: 33,
        caseCosts: 9_000, // post-fee = 6,700 < 9,000
      }),
    );
    expect(output.error).toBe("COSTS_EXCEED_NET");
    expect(output.message).toContain("$0");
  });

  it("returns COSTS_EXCEED_NET when costs exactly equal post-fee is < 0 (costs > post-fee)", () => {
    // gross = 1000, 50% contingency => post-fee = 500, costs = 600
    const output = err(
      estimateSettlementNet({
        grossSettlement: 1_000,
        contingencyPct: 50,
        caseCosts: 600,
      }),
    );
    expect(output.error).toBe("COSTS_EXCEED_NET");
  });

  it("returns ok with net = 0 when costs exactly equal post-fee amount", () => {
    // gross = 1000, 50% contingency => post-fee = 500, costs = 500
    const result = ok(
      estimateSettlementNet({
        grossSettlement: 1_000,
        contingencyPct: 50,
        caseCosts: 500,
      }),
    );
    expect(result.estimatedNetUSD).toBeCloseTo(0, 5);
  });
});

// ── Invalid gross ──────────────────────────────────────────────────────────────

describe("estimateSettlementNet — invalid gross settlement", () => {
  it("rejects zero gross", () => {
    const output = err(
      estimateSettlementNet({ grossSettlement: 0, contingencyPct: 33, caseCosts: 0 }),
    );
    expect(output.error).toBe("INVALID_GROSS");
  });

  it("rejects negative gross", () => {
    const output = err(
      estimateSettlementNet({ grossSettlement: -1000, contingencyPct: 33, caseCosts: 0 }),
    );
    expect(output.error).toBe("INVALID_GROSS");
  });

  it("rejects NaN gross", () => {
    const output = err(
      estimateSettlementNet({ grossSettlement: NaN, contingencyPct: 33, caseCosts: 0 }),
    );
    expect(output.error).toBe("INVALID_GROSS");
  });

  it("rejects Infinity gross", () => {
    const output = err(
      estimateSettlementNet({ grossSettlement: Infinity, contingencyPct: 33, caseCosts: 0 }),
    );
    expect(output.error).toBe("INVALID_GROSS");
  });

  it("rejects -Infinity gross", () => {
    const output = err(
      estimateSettlementNet({ grossSettlement: -Infinity, contingencyPct: 33, caseCosts: 0 }),
    );
    expect(output.error).toBe("INVALID_GROSS");
  });
});

// ── Invalid contingency pct ────────────────────────────────────────────────────

describe("estimateSettlementNet — invalid contingency percentage", () => {
  it("rejects 0%", () => {
    const output = err(
      estimateSettlementNet({ grossSettlement: 100_000, contingencyPct: 0, caseCosts: 0 }),
    );
    expect(output.error).toBe("INVALID_CONTINGENCY_PCT");
  });

  it("rejects exactly 100%", () => {
    const output = err(
      estimateSettlementNet({ grossSettlement: 100_000, contingencyPct: 100, caseCosts: 0 }),
    );
    expect(output.error).toBe("INVALID_CONTINGENCY_PCT");
  });

  it("rejects > 100%", () => {
    const output = err(
      estimateSettlementNet({ grossSettlement: 100_000, contingencyPct: 110, caseCosts: 0 }),
    );
    expect(output.error).toBe("INVALID_CONTINGENCY_PCT");
  });

  it("rejects negative percentage", () => {
    const output = err(
      estimateSettlementNet({ grossSettlement: 100_000, contingencyPct: -10, caseCosts: 0 }),
    );
    expect(output.error).toBe("INVALID_CONTINGENCY_PCT");
  });

  it("rejects NaN contingency", () => {
    const output = err(
      estimateSettlementNet({ grossSettlement: 100_000, contingencyPct: NaN, caseCosts: 0 }),
    );
    expect(output.error).toBe("INVALID_CONTINGENCY_PCT");
  });
});

// ── Invalid case costs ─────────────────────────────────────────────────────────

describe("estimateSettlementNet — invalid case costs", () => {
  it("rejects negative case costs", () => {
    const output = err(
      estimateSettlementNet({ grossSettlement: 100_000, contingencyPct: 33, caseCosts: -500 }),
    );
    expect(output.error).toBe("INVALID_CASE_COSTS");
  });

  it("rejects NaN case costs", () => {
    const output = err(
      estimateSettlementNet({ grossSettlement: 100_000, contingencyPct: 33, caseCosts: NaN }),
    );
    expect(output.error).toBe("INVALID_CASE_COSTS");
  });
});

// ── DEFAULT_CONTINGENCY_PCT constant ──────────────────────────────────────────

describe("DEFAULT_CONTINGENCY_PCT", () => {
  it("is 33.33", () => {
    expect(DEFAULT_CONTINGENCY_PCT).toBe(33.33);
  });

  it("produces a valid result when used as contingencyPct", () => {
    const output = estimateSettlementNet({
      grossSettlement: 100_000,
      contingencyPct: DEFAULT_CONTINGENCY_PCT,
      caseCosts: 0,
    });
    expect(output.ok).toBe(true);
  });
});
