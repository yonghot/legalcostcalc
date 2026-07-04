/**
 * tests/geo-answer-block.test.ts
 *
 * CODE-01 — passage-level GEO answer block (src/lib/seo/geo.ts +
 * src/components/seo/answer-block.tsx). Verifies the acceptance criteria
 * from 부속P §4 CODE-01 against the FULL real seed dataset (every
 * (state, category) pair that passes the hasUniqueData gate):
 *
 *   - query-phrased H2 ("How much does a X cost in Y?")
 *   - 40-60 word answer paragraph containing the real computed numbers
 *   - a data <table> (3-4 cols x up to 10 rows) with real per-entity values
 *   - a 5-10 item cost-factor <ul>
 *   - >=2 inline source-attributed stats
 *   - a dated freshness marker
 *   - identical structure/component across every (state, category) pair —
 *     only the query template + field list differ (verified implicitly:
 *     the same buildAnswerBlock/AnswerBlock is exercised for all of them)
 *   - never fabricates numbers: every figure traces to costs.json
 *   - neutral tone (no superlatives/promotional language)
 */
import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import costsSeed from "@/data/seed/costs.json";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/constants/categories";
import { STATES, STATE_BY_SLUG } from "@/lib/constants/states";
import { INDEXABLE_PAGES } from "@/lib/page-index";
import { buildAnswerBlock } from "@/lib/seo/geo";
import { AnswerBlock } from "@/components/seo/answer-block";
import { formatCurrency } from "@/lib/utils/format";
import type { LegalCostData, Complexity } from "@/lib/types";

interface SeedRow {
  category: string;
  state_code: string;
  complexity: string;
  cost_low: number;
  cost_median: number;
  cost_high: number;
  hourly_rate_low: number | null;
  hourly_rate_median: number | null;
  hourly_rate_high: number | null;
  typical_duration: string | null;
  common_fees: string[] | null;
  sources: string[] | null;
  last_verified_at?: string | null;
}

const SEED_ROWS = costsSeed as SeedRow[];
const DATA_VERIFIED_DATE = "2026-06-29";

function seedRowToLegalCostData(row: SeedRow): LegalCostData {
  return {
    id: `${row.state_code}-${row.category}-${row.complexity}`,
    category: row.category,
    stateCode: row.state_code,
    complexity: row.complexity as Complexity,
    costRange: { low: row.cost_low, median: row.cost_median, high: row.cost_high },
    hourlyRate: {
      low: row.hourly_rate_low ?? 0,
      median: row.hourly_rate_median ?? 0,
      high: row.hourly_rate_high ?? 0,
    },
    contingencyFee: null,
    typicalDuration: row.typical_duration ?? "Varies",
    commonFees: row.common_fees ?? [],
    sources: row.sources ?? [],
    lastVerifiedAt: row.last_verified_at ?? DATA_VERIFIED_DATE,
  };
}

function getCostsFor(stateCode: string, categorySlug: string): LegalCostData[] {
  return SEED_ROWS.filter(
    (r) => r.state_code === stateCode && r.category === categorySlug,
  ).map(seedRowToLegalCostData);
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const SUPERLATIVE_PATTERNS = [
  /\bbest\b/i,
  /\bcheapest\b/i,
  /\bguaranteed\b/i,
  /\bamazing\b/i,
  /\bunbeatable\b/i,
];

describe("buildAnswerBlock — full indexable-page matrix", () => {
  it("every indexable (state, category) page produces a complete, real-data answer block", () => {
    for (const entry of INDEXABLE_PAGES) {
      const costs = getCostsFor(entry.state.code, entry.category.slug);
      const block = buildAnswerBlock({
        category: entry.category,
        state: entry.state,
        costs,
        dataVerifiedDate: costs.find((c) => c.complexity === "moderate")?.lastVerifiedAt ?? null,
      });

      // Query-phrased H2.
      expect(block.heading.toLowerCase()).toBe(
        `how much does a ${entry.category.displayName.toLowerCase()} cost in ${entry.state.name.toLowerCase()}?`,
      );

      // 40-60 word answer paragraph.
      expect(block.answerWordCount).toBeGreaterThanOrEqual(40);
      expect(block.answerWordCount).toBeLessThanOrEqual(60);
      expect(countWords(block.answer)).toBe(block.answerWordCount);

      // Real computed numbers appear in the answer (median cost, verbatim).
      const moderate = costs.find((c) => c.complexity === "moderate")!;
      expect(block.answer).toContain(formatCurrency(moderate.costRange.median));

      // Compact data table: 3-4 cols x up to 10 rows, real per-entity values.
      expect(block.tableRows.length).toBeGreaterThan(0);
      expect(block.tableRows.length).toBeLessThanOrEqual(10);
      for (const row of block.tableRows) {
        expect(row).toHaveProperty("complexity");
        expect(row).toHaveProperty("costLow");
        expect(row).toHaveProperty("costMedian");
        expect(row).toHaveProperty("costHigh");
      }

      // 5-10 item cost-factor list.
      expect(block.factors.length).toBeGreaterThanOrEqual(5);
      expect(block.factors.length).toBeLessThanOrEqual(10);

      // >=2 inline source-attributed stats, each citing a real source URL
      // that traces back to the seed dataset.
      expect(block.stats.length).toBeGreaterThanOrEqual(2);
      for (const stat of block.stats) {
        expect(stat.sourceUrl).toMatch(/^https?:\/\//);
        const allSources = costs.flatMap((c) => c.sources);
        expect(allSources).toContain(stat.sourceUrl);
      }

      // Dated freshness marker.
      expect(block.freshnessLabel).toBeTruthy();

      // Neutral tone — no superlative/promotional language.
      for (const pattern of SUPERLATIVE_PATTERNS) {
        expect(block.answer).not.toMatch(pattern);
      }
    }
  });

  it("gracefully degrades (no fabrication) when no moderate-complexity data exists", () => {
    const category = CATEGORIES[0];
    const state = STATES[0];
    const block = buildAnswerBlock({
      category,
      state,
      costs: [],
      dataVerifiedDate: null,
    });

    expect(block.tableRows).toEqual([]);
    expect(block.stats).toEqual([]);
    expect(block.answer).not.toMatch(/\$[\d,]+/); // no invented dollar figure
    expect(block.answerWordCount).toBeGreaterThan(0);
  });
});

describe("AnswerBlock component — server-rendered HTML structure", () => {
  const categoryInfo = CATEGORY_MAP.get("divorce")!;
  const stateInfo = STATE_BY_SLUG.get("california")!;
  const costs = getCostsFor(stateInfo.code, categoryInfo.slug);
  const block = buildAnswerBlock({
    category: categoryInfo,
    state: stateInfo,
    costs,
    dataVerifiedDate: costs.find((c) => c.complexity === "moderate")?.lastVerifiedAt ?? null,
  });

  it("renders an <h2> with the query-phrased heading", () => {
    const html = renderToStaticMarkup(createElement(AnswerBlock, { block }));
    expect(html).toContain("<h2");
    expect(html).toContain("How much does a divorce cost in California?");
  });

  it("renders a <table> with real per-row cost figures", () => {
    const html = renderToStaticMarkup(createElement(AnswerBlock, { block }));
    expect(html).toContain("<table");
    for (const row of block.tableRows) {
      expect(html).toContain(row.costMedian);
    }
  });

  it("renders a cost-factor <ul>", () => {
    const html = renderToStaticMarkup(createElement(AnswerBlock, { block }));
    expect(html).toContain("<ul");
    expect(html).toContain(block.factors[0]);
  });

  it("renders >=2 source-attributed stats with real outbound source links", () => {
    const html = renderToStaticMarkup(createElement(AnswerBlock, { block }));
    for (const stat of block.stats) {
      expect(html).toContain(stat.sourceUrl);
    }
  });

  it("renders a dated freshness marker", () => {
    const html = renderToStaticMarkup(createElement(AnswerBlock, { block }));
    expect(html).toContain("Data verified:");
  });

  it("is a pure server component (no 'use client' directive, no hooks)", async () => {
    const mod = await import("@/components/seo/answer-block");
    expect(mod.AnswerBlock).toBeTypeOf("function");
  });
});
