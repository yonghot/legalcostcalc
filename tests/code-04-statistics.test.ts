/**
 * tests/code-04-statistics.test.ts
 *
 * CODE-04 (부속P §4) — data/statistic "linkable asset" page + machine-
 * readable feeds. Verifies the acceptance criteria against the REAL seed
 * dataset:
 *   - a headline stat, a ranked data table (one row per category), and
 *     >=3 one-line quotable findings
 *   - every figure traces to buildStatisticsAggregate()'s real inputs
 *     (INDEXABLE_PAGES / costs.json via lib/page-index.ts) — no fabrication
 *   - data.json and data.csv route handlers return the SAME figures as the
 *     aggregate (single source of truth, not three independently-maintained
 *     copies)
 *   - the page is present in sitemap.xml
 */
import { describe, it, expect } from "vitest";
import { buildStatisticsAggregate } from "@/lib/seo/statistics";
import { CATEGORIES } from "@/lib/constants/categories";
import { INDEXABLE_PAGES, getNationalAverage } from "@/lib/page-index";
import { GET as getJson } from "@/app/legal-cost-statistics/data.json/route";
import { GET as getCsv } from "@/app/legal-cost-statistics/data.csv/route";
import sitemap from "@/app/sitemap";

describe("CODE-04: buildStatisticsAggregate — real data, no fabrication", () => {
  const aggregate = buildStatisticsAggregate();

  it("produces one row per category with real, positive data", () => {
    expect(aggregate.categoryRows.length).toBeGreaterThan(0);
    expect(aggregate.categoryRows.length).toBeLessThanOrEqual(CATEGORIES.length);
    for (const row of aggregate.categoryRows) {
      expect(row.nationalAverage).toBeGreaterThan(0);
      expect(row.highestState.median).toBeGreaterThan(0);
      expect(row.lowestState.median).toBeGreaterThan(0);
      expect(row.highestState.median).toBeGreaterThanOrEqual(row.lowestState.median);
      expect(row.stateCount).toBeGreaterThan(0);
    }
  });

  it("every category row's nationalAverage matches the real getNationalAverage() figure", () => {
    for (const row of aggregate.categoryRows) {
      const expected = getNationalAverage(row.categorySlug);
      expect(expected).not.toBeNull();
      expect(row.nationalAverage).toBe(Math.round(expected as number));
    }
  });

  it("highest/lowest states are drawn only from INDEXABLE_PAGES (CODE-06-gated, never thin/duplicate pages)", () => {
    for (const row of aggregate.categoryRows) {
      const indexableCodes = new Set(
        INDEXABLE_PAGES.filter((p) => p.category.slug === row.categorySlug).map((p) => p.state.code),
      );
      expect(indexableCodes.has(row.highestState.code)).toBe(true);
      expect(indexableCodes.has(row.lowestState.code)).toBe(true);
    }
  });

  it("has a headline stat (the most expensive category nationally)", () => {
    expect(aggregate.headline).toBeDefined();
    const maxAvg = Math.max(...aggregate.categoryRows.map((r) => r.nationalAverage));
    expect(aggregate.headline.nationalAverage).toBe(maxAvg);
  });

  it("produces 3-5 one-line quotable findings, each grounded in a real category row", () => {
    expect(aggregate.findings.length).toBeGreaterThanOrEqual(3);
    expect(aggregate.findings.length).toBeLessThanOrEqual(5);
    for (const finding of aggregate.findings) {
      expect(typeof finding).toBe("string");
      expect(finding.length).toBeGreaterThan(10);
      // Every finding must reference at least one real category display name.
      const mentionsRealCategory = aggregate.categoryRows.some((r) =>
        finding.includes(r.categoryDisplayName),
      );
      expect(mentionsRealCategory).toBe(true);
    }
  });

  it("total data points equals the sum of real per-category state counts", () => {
    const expectedTotal = aggregate.categoryRows.reduce((sum, r) => sum + r.stateCount, 0);
    expect(aggregate.totalDataPoints).toBe(expectedTotal);
  });
});

describe("CODE-04: /legal-cost-statistics/data.json feed", () => {
  it("returns the SAME real figures as buildStatisticsAggregate() (single source of truth)", async () => {
    const aggregate = buildStatisticsAggregate();
    const response = await getJson();
    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.totalDataPoints).toBe(aggregate.totalDataPoints);
    expect(body.findings).toEqual(aggregate.findings);
    expect(body.categories.length).toBe(aggregate.categoryRows.length);

    for (let i = 0; i < aggregate.categoryRows.length; i++) {
      const row = aggregate.categoryRows[i];
      const jsonRow = body.categories[i];
      expect(jsonRow.category).toBe(row.categorySlug);
      expect(jsonRow.nationalAverageMedianCost).toBe(row.nationalAverage);
      expect(jsonRow.highestCostState.code).toBe(row.highestState.code);
      expect(jsonRow.lowestCostState.code).toBe(row.lowestState.code);
    }
  });
});

describe("CODE-04: /legal-cost-statistics/data.csv feed", () => {
  it("returns a CSV with a header row and one data row per category, matching the aggregate", async () => {
    const aggregate = buildStatisticsAggregate();
    const response = await getCsv();
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/csv");

    const text = await response.text();
    const lines = text.trim().split("\n");
    expect(lines.length).toBe(aggregate.categoryRows.length + 1); // header + rows

    const header = lines[0].split(",");
    expect(header).toContain("national_average_median_cost_usd");
    expect(header).toContain("highest_cost_state_code");
    expect(header).toContain("lowest_cost_state_code");

    // Spot-check the first data row matches the first aggregate row.
    const firstDataCols = lines[1].split(",");
    expect(firstDataCols[0]).toBe(aggregate.categoryRows[0].categorySlug);
    expect(Number(firstDataCols[2])).toBe(aggregate.categoryRows[0].nationalAverage);
  });
});

describe("CODE-04: sitemap inclusion", () => {
  it("includes /legal-cost-statistics in sitemap.xml", () => {
    const entries = sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls.some((u) => u.endsWith("/legal-cost-statistics"))).toBe(true);
  });
});
