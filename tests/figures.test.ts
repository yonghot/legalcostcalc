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
 *   - The cost dataset has no verification date: the retired 2026-06-29
 *     constant was bumped by hand with no recorded comparison against sources.
 */

import { describe, it, expect } from "vitest";
import {
  VERIFIED_FIGURES,
  UNSOURCED_FIGURES,
  COST_DATASET_FIGURE,
  SETTLEMENT_CONTINGENCY_FIGURE,
} from "@/lib/constants/figures";

describe("figures.ts — verified figures", () => {
  it("COST_DATASET_FIGURE carries no verification date and is listed as unsourced", () => {
    expect(COST_DATASET_FIGURE.lastVerified).toBeNull();
    expect(UNSOURCED_FIGURES).toContain(COST_DATASET_FIGURE);
    expect(VERIFIED_FIGURES).not.toContain(COST_DATASET_FIGURE);
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

describe("figures.ts — no global verification date", () => {
  it("does not export the retired default date", async () => {
    const mod = await import("@/lib/constants/figures");
    expect(mod).not.toHaveProperty("DEFAULT_FIGURES_LAST_VERIFIED");
  });
});
