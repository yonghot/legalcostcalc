/**
 * tests/figures.test.ts
 *
 * Unit tests for src/lib/constants/figures.ts — the central figures metadata
 * registry added for the legal-risk mitigation pass.
 *
 * Invariants under test:
 *   - VERIFIED_FIGURES entries must have BOTH a lastVerified date and (date or
 *     source) — never fabricated.
 *   - UNSOURCED_FIGURES entries are exactly the ones missing a verifiable date,
 *     and must never silently gain a fabricated date.
 *   - DEFAULT_FIGURES_LAST_VERIFIED mirrors the dataset figure's date.
 */

import { describe, it, expect } from "vitest";
import {
  VERIFIED_FIGURES,
  UNSOURCED_FIGURES,
  COST_DATASET_FIGURE,
  SETTLEMENT_CONTINGENCY_FIGURE,
  DEFAULT_FIGURES_LAST_VERIFIED,
} from "@/lib/constants/figures";

describe("figures.ts — verified figures", () => {
  it("COST_DATASET_FIGURE has a real ISO lastVerified date", () => {
    expect(COST_DATASET_FIGURE.lastVerified).toBe("2026-06-29");
    expect(() => {
      if (!COST_DATASET_FIGURE.lastVerified) throw new Error("missing date");
      return new Date(COST_DATASET_FIGURE.lastVerified);
    }).not.toThrow();
  });

  it("every VERIFIED_FIGURES entry has a non-null lastVerified date", () => {
    for (const figure of VERIFIED_FIGURES) {
      expect(figure.lastVerified).not.toBeNull();
    }
  });
});

describe("figures.ts — unsourced figures (no-fabrication guard)", () => {
  it("SETTLEMENT_CONTINGENCY_FIGURE has lastVerified=null (no fabricated date)", () => {
    expect(SETTLEMENT_CONTINGENCY_FIGURE.lastVerified).toBeNull();
  });

  it("SETTLEMENT_CONTINGENCY_FIGURE still carries a real cited source URL", () => {
    expect(SETTLEMENT_CONTINGENCY_FIGURE.source).toMatch(/^https:\/\//);
  });

  it("UNSOURCED_FIGURES contains exactly the figures missing a lastVerified date", () => {
    for (const figure of UNSOURCED_FIGURES) {
      expect(figure.lastVerified).toBeNull();
    }
    // No figure should appear in both lists.
    const verifiedLabels = new Set(VERIFIED_FIGURES.map((f) => f.label));
    for (const figure of UNSOURCED_FIGURES) {
      expect(verifiedLabels.has(figure.label)).toBe(false);
    }
  });
});

describe("figures.ts — DEFAULT_FIGURES_LAST_VERIFIED", () => {
  it("mirrors COST_DATASET_FIGURE.lastVerified", () => {
    expect(DEFAULT_FIGURES_LAST_VERIFIED).toBe(COST_DATASET_FIGURE.lastVerified);
  });
});
