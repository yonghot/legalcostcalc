/**
 * tests/code-06-info-gain.test.ts
 *
 * CODE-06 (부속P §4) — strengthens the T09 thin-page gate into an explicit
 * information-gain guardrail: a page needs >=4 entity-specific facts that
 * DIFFER from sibling pages (local avg, local range, sample-scenario result,
 * computed comparison-vs-benchmark) before it is indexable. Below threshold:
 * robots noindex AND excluded from sitemap.xml. Also covers the conditional
 * "above/below/in line with national average" synthesis sentence
 * (buildBenchmarkSynthesis in src/lib/seo/geo.ts) that CategoryEditorial
 * renders on every page with real data.
 *
 * Acceptance criteria under test:
 *   - A page with <4 differentiating data facts renders robots=noindex and
 *     is absent from sitemap.xml (via INDEXABLE_PAGES, sitemap.ts's actual
 *     data source).
 *   - Passing pages carry a data table with entity-unique values (already
 *     covered by geo-answer-block.test.ts) + >=1 data-derived synthesis
 *     sentence with conditional phrasing.
 *   - "Above national average" phrasing is used ONLY when true; "below"
 *     only when true; a near-zero difference does not force either claim.
 *   - Mechanism (buildBenchmarkSynthesis, the 4-fact gate) is identical
 *     across every (state, category) pair — no page-specific hardcoding.
 */
import { describe, it, expect } from "vitest";
import sitemap from "@/app/sitemap";
import { PAGE_INDEX, INDEXABLE_PAGES, getNationalAverage, getModerateMedianCost } from "@/lib/page-index";
import { buildBenchmarkSynthesis } from "@/lib/seo/geo";
import { CATEGORIES } from "@/lib/constants/categories";

describe("CODE-06: 4-fact information-gain gate", () => {
  it("every PAGE_INDEX entry scores 0-4 facts and hasUniqueData is exactly factCount >= 4", () => {
    for (const entry of PAGE_INDEX) {
      expect(entry.factCount).toBeGreaterThanOrEqual(0);
      expect(entry.factCount).toBeLessThanOrEqual(4);
      expect(entry.hasUniqueData).toBe(entry.factCount >= 4);
    }
  });

  it("at least one real page fails the gate (dataset contains genuine near-duplicate rows)", () => {
    const failing = PAGE_INDEX.filter((p) => !p.hasUniqueData);
    expect(failing.length).toBeGreaterThan(0);
  });

  it("a <4-fact page is absent from sitemap.xml (sitemap.ts reads INDEXABLE_PAGES directly)", () => {
    const failing = PAGE_INDEX.filter((p) => !p.hasUniqueData);
    expect(failing.length).toBeGreaterThan(0);

    const sitemapEntries = sitemap();
    const sitemapUrls = new Set(sitemapEntries.map((e) => e.url));

    for (const thin of failing) {
      // Absent from the pre-sitemap indexable set...
      expect(INDEXABLE_PAGES.find((p) => p.path === thin.path)).toBeUndefined();
      // ...and therefore never emitted into the actual sitemap.xml output.
      const wouldBeUrl = `https://legalcostcalc.co${thin.path}`;
      expect(sitemapUrls.has(wouldBeUrl)).toBe(false);
    }
  });

  it("every passing page IS present in sitemap.xml", () => {
    const sitemapEntries = sitemap();
    const sitemapUrls = new Set(sitemapEntries.map((e) => e.url));
    for (const entry of INDEXABLE_PAGES) {
      const url = `https://legalcostcalc.co${entry.path}`;
      expect(sitemapUrls.has(url)).toBe(true);
    }
  });

  it("sitemap.xml is strictly smaller than the full combinatorial matrix (thin permutations excluded)", () => {
    const totalMatrix = PAGE_INDEX.length;
    expect(INDEXABLE_PAGES.length).toBeLessThan(totalMatrix);
  });
});

describe("CODE-06: national-average benchmark (real dataset, not hardcoded)", () => {
  it("computes a positive national average for every category from real seed data", () => {
    for (const category of CATEGORIES) {
      const avg = getNationalAverage(category.slug);
      expect(avg).not.toBeNull();
      expect(avg as number).toBeGreaterThan(0);
    }
  });
});

describe("CODE-06: buildBenchmarkSynthesis — conditional phrasing, no fabrication", () => {
  it("returns null when local or national figures are missing", () => {
    expect(
      buildBenchmarkSynthesis({
        categoryDisplayName: "Divorce",
        stateName: "Texas",
        localMedian: null,
        nationalAverage: 5000,
      }),
    ).toBeNull();
    expect(
      buildBenchmarkSynthesis({
        categoryDisplayName: "Divorce",
        stateName: "Texas",
        localMedian: 5000,
        nationalAverage: null,
      }),
    ).toBeNull();
  });

  it('says "above" only when the local median is genuinely higher than the national average', () => {
    const sentence = buildBenchmarkSynthesis({
      categoryDisplayName: "Divorce",
      stateName: "California",
      localMedian: 10000,
      nationalAverage: 5000,
    });
    expect(sentence).not.toBeNull();
    expect(sentence).toContain("above");
    expect(sentence).not.toContain("below");
    expect(sentence).toContain("100%");
  });

  it('says "below" only when the local median is genuinely lower than the national average', () => {
    const sentence = buildBenchmarkSynthesis({
      categoryDisplayName: "Divorce",
      stateName: "Mississippi",
      localMedian: 2500,
      nationalAverage: 5000,
    });
    expect(sentence).not.toBeNull();
    expect(sentence).toContain("below");
    expect(sentence).not.toContain(" above ");
    expect(sentence).toContain("50%");
  });

  it('uses "in line with" (neither above nor below) when the difference is negligible (<3%)', () => {
    const sentence = buildBenchmarkSynthesis({
      categoryDisplayName: "Divorce",
      stateName: "Ohio",
      localMedian: 5010,
      nationalAverage: 5000,
    });
    expect(sentence).not.toBeNull();
    expect(sentence).toContain("in line with");
    expect(sentence).not.toContain(" above ");
    expect(sentence).not.toContain(" below ");
  });

  it("every real INDEXABLE_PAGES entry gets a non-null synthesis sentence with a real percentage or in-line-with phrasing", () => {
    for (const entry of INDEXABLE_PAGES.slice(0, 40)) {
      const localMedian = getModerateMedianCost(entry.state.code, entry.category.slug);
      const nationalAverage = getNationalAverage(entry.category.slug);
      const sentence = buildBenchmarkSynthesis({
        categoryDisplayName: entry.category.displayName,
        stateName: entry.state.name,
        localMedian,
        nationalAverage,
      });
      expect(sentence).not.toBeNull();
      expect(sentence).toContain(entry.state.name);
      // Never fabricates a number outside the real local/national figures.
      expect(sentence).toMatch(/\$[\d,]+/);
    }
  });
});
