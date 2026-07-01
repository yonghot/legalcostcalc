/**
 * DATA-INTEGRITY tests for src/data/seed/costs.json
 *
 * Ensures:
 *   (a) Exactly 1224 cells present
 *   (b) cost_low <= cost_median <= cost_high per cell
 *   (c) hourly_rate_low <= hourly_rate_median <= hourly_rate_high per cell
 *   (d) sources[] is non-empty per cell
 *
 * REGRESSION GUARD (2026-06-29 credibility corrections):
 *   No source URL may match fabricated patterns that were removed on 2026-06-29.
 */

import { describe, it, expect } from "vitest";
import rawData from "../src/data/seed/costs.json";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CostCell {
  category: string;
  state_code: string;
  complexity: string;
  cost_low: number;
  cost_median: number;
  cost_high: number;
  hourly_rate_low?: number | null;
  hourly_rate_median?: number | null;
  hourly_rate_high?: number | null;
  sources?: string[];
  [key: string]: unknown;
}

const costs = rawData as CostCell[];

// ── Helper factories ───────────────────────────────────────────────────────────

/**
 * Build a human-readable cell label for assertion messages.
 */
function cellLabel(cell: CostCell): string {
  return `${cell.category}/${cell.state_code}/${cell.complexity}`;
}

// ── Banned URL patterns (2026-06-29 removals) ─────────────────────────────────

const BANNED_URL_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
  {
    pattern: /courts\.state\.[a-z]{2}\.us/,
    description: "fabricated state court URLs (courts.state.<xx>.us)",
  },
  {
    pattern: /martindale\.com/,
    description: "martindale.com (removed 2026-06-29)",
  },
  {
    pattern: /-costs-fees\.html/,
    description: "fabricated -costs-fees.html slug pattern",
  },
  {
    pattern: /legal-guides\/ugc\/.+-attorney-fees/,
    description: "fabricated legal-guides/ugc/...-attorney-fees UGC paths",
  },
];

// ── Suite: Cell count ─────────────────────────────────────────────────────────

describe("costs.json — cell count", () => {
  it("contains exactly 1224 cells", () => {
    expect(costs).toHaveLength(1224);
  });
});

// ── Suite: Cost range ordering per cell ───────────────────────────────────────

describe("costs.json — cost ordering: cost_low <= cost_median <= cost_high", () => {
  it("every cell satisfies cost_low <= cost_median", () => {
    const violations = costs.filter((c) => c.cost_low > c.cost_median);
    expect(violations, `Cells with cost_low > cost_median: ${violations.map(cellLabel).join(", ")}`).toHaveLength(0);
  });

  it("every cell satisfies cost_median <= cost_high", () => {
    const violations = costs.filter((c) => c.cost_median > c.cost_high);
    expect(violations, `Cells with cost_median > cost_high: ${violations.map(cellLabel).join(", ")}`).toHaveLength(0);
  });

  it("boundary: cost_low === cost_median is acceptable (no violation)", () => {
    // This test affirms that equality is allowed, not a failure.
    const equalLowMedian = costs.filter((c) => c.cost_low === c.cost_median);
    // Just confirm we don't throw; the value may be 0 or more.
    expect(equalLowMedian.length).toBeGreaterThanOrEqual(0);
  });

  it("all cost values are non-negative numbers", () => {
    const violations = costs.filter(
      (c) =>
        typeof c.cost_low !== "number" ||
        typeof c.cost_median !== "number" ||
        typeof c.cost_high !== "number" ||
        c.cost_low < 0 ||
        c.cost_median < 0 ||
        c.cost_high < 0,
    );
    expect(violations, `Cells with invalid cost values: ${violations.map(cellLabel).join(", ")}`).toHaveLength(0);
  });
});

// ── Suite: Hourly rate ordering per cell ─────────────────────────────────────

describe("costs.json — hourly rate ordering: low <= median <= high", () => {
  it("every cell with hourly rates satisfies hourly_rate_low <= hourly_rate_median", () => {
    const violations = costs.filter((c) => {
      if (c.hourly_rate_low == null || c.hourly_rate_median == null) return false;
      return c.hourly_rate_low > c.hourly_rate_median;
    });
    expect(
      violations,
      `Cells with hourly_rate_low > hourly_rate_median: ${violations.map(cellLabel).join(", ")}`,
    ).toHaveLength(0);
  });

  it("every cell with hourly rates satisfies hourly_rate_median <= hourly_rate_high", () => {
    const violations = costs.filter((c) => {
      if (c.hourly_rate_median == null || c.hourly_rate_high == null) return false;
      return c.hourly_rate_median > c.hourly_rate_high;
    });
    expect(
      violations,
      `Cells with hourly_rate_median > hourly_rate_high: ${violations.map(cellLabel).join(", ")}`,
    ).toHaveLength(0);
  });

  it("all present hourly rate values are non-negative numbers", () => {
    const violations = costs.filter((c) => {
      const fields = [c.hourly_rate_low, c.hourly_rate_median, c.hourly_rate_high];
      return fields.some((f) => f != null && (typeof f !== "number" || f < 0));
    });
    expect(violations, `Cells with invalid hourly rate values: ${violations.map(cellLabel).join(", ")}`).toHaveLength(0);
  });

  it("boundary: hourly_rate_low === hourly_rate_median is acceptable", () => {
    const equalLowMedian = costs.filter(
      (c) =>
        c.hourly_rate_low != null &&
        c.hourly_rate_median != null &&
        c.hourly_rate_low === c.hourly_rate_median,
    );
    expect(equalLowMedian.length).toBeGreaterThanOrEqual(0);
  });
});

// ── Suite: Sources non-empty per cell ────────────────────────────────────────

describe("costs.json — sources[] non-empty", () => {
  it("every cell has a sources array", () => {
    const violations = costs.filter((c) => !Array.isArray(c.sources));
    expect(violations, `Cells missing sources array: ${violations.map(cellLabel).join(", ")}`).toHaveLength(0);
  });

  it("every cell has at least one source URL", () => {
    const violations = costs.filter(
      (c) => !Array.isArray(c.sources) || c.sources.length === 0,
    );
    expect(violations, `Cells with empty sources: ${violations.map(cellLabel).join(", ")}`).toHaveLength(0);
  });

  it("all source entries are non-empty strings", () => {
    const violations: string[] = [];
    for (const cell of costs) {
      if (!Array.isArray(cell.sources)) continue;
      for (const src of cell.sources) {
        if (typeof src !== "string" || src.trim() === "") {
          violations.push(cellLabel(cell));
        }
      }
    }
    expect(violations, `Cells with blank source entries: ${violations.join(", ")}`).toHaveLength(0);
  });
});

// ── Suite: Required fields present ───────────────────────────────────────────

describe("costs.json — required fields present", () => {
  const REQUIRED_FIELDS = ["category", "state_code", "complexity", "cost_low", "cost_median", "cost_high"];

  for (const field of REQUIRED_FIELDS) {
    it(`every cell has a truthy '${field}' field`, () => {
      const violations = costs.filter(
        (c) => c[field] === undefined || c[field] === null || c[field] === "",
      );
      expect(
        violations,
        `Cells missing '${field}': ${violations.map(cellLabel).join(", ")}`,
      ).toHaveLength(0);
    });
  }
});

// ── Suite: REGRESSION GUARD — banned URL patterns (2026-06-29) ───────────────

describe("costs.json — REGRESSION GUARD: banned fabricated URL patterns (removed 2026-06-29)", () => {
  for (const { pattern, description } of BANNED_URL_PATTERNS) {
    it(`no source URL matches banned pattern: ${description}`, () => {
      const hits: string[] = [];

      for (const cell of costs) {
        if (!Array.isArray(cell.sources)) continue;
        for (const url of cell.sources) {
          if (pattern.test(url)) {
            hits.push(`${cellLabel(cell)} → "${url}"`);
          }
        }
      }

      expect(
        hits,
        `Banned URLs found (pattern: ${pattern.toString()}): ${hits.join(" | ")}`,
      ).toHaveLength(0);
    });
  }

  it("summary: zero total banned URLs across all 1224 cells", () => {
    const allBanned: string[] = [];

    for (const cell of costs) {
      if (!Array.isArray(cell.sources)) continue;
      for (const url of cell.sources) {
        for (const { pattern } of BANNED_URL_PATTERNS) {
          if (pattern.test(url)) {
            allBanned.push(url);
            break;
          }
        }
      }
    }

    expect(allBanned, `Total banned URLs: ${allBanned.length}`).toHaveLength(0);
  });
});
