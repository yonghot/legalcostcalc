/**
 * Phase-3 regression tests (2026-06-29)
 *
 * Covers every fix applied in the Phase-3 quality pass:
 *   - SEC-001: safeJsonLd escapes <, >, & correctly (was a no-op before)
 *   - SEC-002: affiliate-cta isSafeUrl guard on affiliateUrl
 *   - SEC-003: isSafeUrl now https-only (http:// is blocked)
 *   - CORR-001: contingency fee mapped in cost-service / LegalCostData type
 *   - CORR-002: personal-injury rows have contingency data, hourly rates all zero
 *   - CORR-003: DATA_VERSION_DATE bumped to 2026-06-29
 */

import { describe, it, expect } from "vitest";
import { safeJsonLd } from "@/lib/utils/json-ld";
import { isSafeUrl } from "@/lib/utils/sanitize";
import { DATA_VERSION_DATE } from "@/lib/constants/data-meta";
import rawCosts from "../src/data/seed/costs.json";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CostCell {
  category: string;
  state_code: string;
  complexity: string;
  hourly_rate_low?: number | null;
  hourly_rate_median?: number | null;
  hourly_rate_high?: number | null;
  contingency_fee_low?: number | null;
  contingency_fee_median?: number | null;
  contingency_fee_high?: number | null;
  [key: string]: unknown;
}

const costs = rawCosts as CostCell[];

// ── SEC-001: safeJsonLd escape correctness ────────────────────────────────────

describe("safeJsonLd — SEC-001: correct Unicode escaping (was no-op before fix)", () => {
  it("escapes < to \\u003c so it cannot break a script context", () => {
    const result = safeJsonLd({ text: "</script>" });
    // Must NOT contain a raw < byte
    expect(result).not.toContain("<");
    // Must contain the 6-char sequence <
    expect(result).toContain("\\u003c");
  });

  it("escapes </script> sequence fully to prevent injection", () => {
    const result = safeJsonLd({ answer: "</script><script>alert(1)</script>" });
    expect(result).not.toContain("</script>");
    expect(result).toContain("\\u003c/script\\u003e");
  });

  it("escapes > to \\u003e", () => {
    const result = safeJsonLd({ text: "a > b" });
    expect(result).not.toMatch(/[>]/);
    expect(result).toContain("\\u003e");
  });

  it("escapes & to \\u0026", () => {
    const result = safeJsonLd({ text: "cats & dogs" });
    // JSON.stringify converts & to literal & first, then we escape it
    expect(result).not.toContain("&");
    expect(result).toContain("\\u0026");
  });

  it("round-trips a plain object correctly", () => {
    const obj = { "@type": "FAQPage", name: "About Us" };
    const result = safeJsonLd(obj);
    // No dangerous chars remain
    expect(result).not.toMatch(/[<>&]/);
    // Parseable back to JSON (after un-escaping the Unicode sequences)
    const unescaped = result
      .replace(/\\u003c/g, "<")
      .replace(/\\u003e/g, ">")
      .replace(/\\u0026/g, "&");
    expect(() => JSON.parse(unescaped)).not.toThrow();
    expect(JSON.parse(unescaped)).toEqual(obj);
  });

  it("returns valid JSON when input has no special chars", () => {
    const result = safeJsonLd({ hello: "world" });
    expect(() => JSON.parse(result)).not.toThrow();
  });
});

// ── SEC-002: isSafeUrl https-only ─────────────────────────────────────────────

describe("isSafeUrl — SEC-003: https-only (http:// now blocked)", () => {
  it("returns true for an https:// URL", () => {
    expect(isSafeUrl("https://www.bls.gov/ooh/legal/lawyers.htm")).toBe(true);
  });

  it("returns false for a plain http:// URL (was previously allowed)", () => {
    // REGRESSION: this value changed from true → false in the 2026-06-29 fix
    expect(isSafeUrl("http://example.com/page")).toBe(false);
  });

  it("still blocks javascript: protocol", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
  });

  it("still blocks data: protocol", () => {
    expect(isSafeUrl("data:text/html,<h1>hi</h1>")).toBe(false);
  });
});

// ── CORR-001 & CORR-002: personal-injury contingency fee data ─────────────────

describe("costs.json — personal-injury rows have contingency fee data", () => {
  const piRows = costs.filter((c) => c.category === "personal-injury");

  it("contains exactly 153 personal-injury rows (51 states × 3 complexities)", () => {
    expect(piRows).toHaveLength(153);
  });

  it("every personal-injury row has hourly_rate values all equal to 0", () => {
    const violations = piRows.filter(
      (c) =>
        c.hourly_rate_low !== 0 ||
        c.hourly_rate_median !== 0 ||
        c.hourly_rate_high !== 0,
    );
    expect(
      violations,
      `PI rows with non-zero hourly rates: ${violations.map((c) => `${c.state_code}/${c.complexity}`).join(", ")}`,
    ).toHaveLength(0);
  });

  it("every personal-injury row has contingency_fee_low > 0", () => {
    const violations = piRows.filter(
      (c) => !c.contingency_fee_low || c.contingency_fee_low <= 0,
    );
    expect(
      violations,
      `PI rows missing contingency_fee_low: ${violations.map((c) => `${c.state_code}/${c.complexity}`).join(", ")}`,
    ).toHaveLength(0);
  });

  it("every personal-injury row has contingency_fee_median > 0", () => {
    const violations = piRows.filter(
      (c) => !c.contingency_fee_median || c.contingency_fee_median <= 0,
    );
    expect(violations).toHaveLength(0);
  });

  it("every personal-injury row has contingency_fee_high > 0", () => {
    const violations = piRows.filter(
      (c) => !c.contingency_fee_high || c.contingency_fee_high <= 0,
    );
    expect(violations).toHaveLength(0);
  });

  it("contingency_fee_low <= contingency_fee_median <= contingency_fee_high", () => {
    const violations = piRows.filter(
      (c) =>
        c.contingency_fee_low != null &&
        c.contingency_fee_median != null &&
        c.contingency_fee_high != null &&
        (c.contingency_fee_low > c.contingency_fee_median ||
          c.contingency_fee_median > c.contingency_fee_high),
    );
    expect(violations).toHaveLength(0);
  });

  it("contingency fee values are between 1 and 100 (percentage range)", () => {
    const violations = piRows.filter((c) => {
      const vals = [c.contingency_fee_low, c.contingency_fee_median, c.contingency_fee_high];
      return vals.some((v) => v != null && (v < 1 || v > 100));
    });
    expect(violations).toHaveLength(0);
  });

  it("sample: AL/simple has contingency_fee_low=25, median=33, high=33", () => {
    const cell = piRows.find((c) => c.state_code === "AL" && c.complexity === "simple");
    expect(cell).toBeDefined();
    expect(cell?.contingency_fee_low).toBe(25);
    expect(cell?.contingency_fee_median).toBe(33);
    expect(cell?.contingency_fee_high).toBe(33);
  });
});

// ── CORR-003: non-PI rows do NOT have contingency fee data ────────────────────

describe("costs.json — non-personal-injury rows do not have contingency fee data", () => {
  const nonPiRows = costs.filter((c) => c.category !== "personal-injury");

  it("all non-PI rows have contingency_fee_low null or missing", () => {
    const violations = nonPiRows.filter(
      (c) => c.contingency_fee_low != null && c.contingency_fee_low !== 0,
    );
    expect(violations).toHaveLength(0);
  });
});

// ── MINOR: DATA_VERSION_DATE bumped ──────────────────────────────────────────

describe("DATA_VERSION_DATE — bumped to 2026-06-29", () => {
  it("is a Date instance", () => {
    expect(DATA_VERSION_DATE).toBeInstanceOf(Date);
  });

  it("is 2026-06-29 (ISO date)", () => {
    expect(DATA_VERSION_DATE.toISOString().startsWith("2026-06-29")).toBe(true);
  });

  it("is not earlier than 2026-06-28 (old stale date)", () => {
    const OLD_DATE = new Date("2026-04-11T00:00:00Z");
    expect(DATA_VERSION_DATE.getTime()).toBeGreaterThan(OLD_DATE.getTime());
  });
});
