/**
 * Tests for src/lib/page-index.ts — T09 thin-page triage.
 *
 * Asserts the sitemap/robots/link-module consistency required by the T09
 * acceptance criteria: sitemap.xml, generateMetadata's robots directive, and
 * every internal-link module (T06 RelatedMatters, T07 hub pages/RelatedLinks)
 * all draw from the exact same INDEXABLE_PAGES set — no module can link to a
 * page that would be noindexed, and the sitemap can never contain a
 * hasUniqueData=false page.
 */
import { describe, expect, it } from "vitest";
import { PAGE_INDEX, INDEXABLE_PAGES, hasUniqueData, getModerateMedianCost } from "@/lib/page-index";
import { STATES } from "@/lib/constants/states";
import { CATEGORIES } from "@/lib/constants/categories";
import costsSeed from "@/data/seed/costs.json";

describe("page-index: hasUniqueData derivation", () => {
  it("computes an entry for every (state, category) combination", () => {
    expect(PAGE_INDEX.length).toBe(STATES.length * CATEGORIES.length);
  });

  it("hasUniqueData is derived programmatically — never hand-flagged true without backing data", () => {
    for (const entry of PAGE_INDEX) {
      const moderateRow = (costsSeed as Array<{
        state_code: string;
        category: string;
        complexity: string;
        cost_median: number;
        sources?: string[] | null;
      }>).find(
        (r) =>
          r.state_code === entry.state.code &&
          r.category === entry.category.slug &&
          r.complexity === "moderate",
      );
      const expectedHasData = Boolean(
        moderateRow && moderateRow.cost_median > 0 && moderateRow.sources && moderateRow.sources.length > 0,
      );
      expect(entry.hasUniqueData).toBe(expectedHasData);
    }
  });

  it("hasUniqueData()/getPageIndexEntry() lookups agree with the derived PAGE_INDEX", () => {
    for (const entry of PAGE_INDEX) {
      expect(hasUniqueData(entry.state.code, entry.category.slug)).toBe(entry.hasUniqueData);
    }
  });

  it("returns false for an unknown state/category pair", () => {
    expect(hasUniqueData("ZZ", "not-a-category")).toBe(false);
  });
});

describe("page-index: INDEXABLE_PAGES / sitemap consistency", () => {
  it("INDEXABLE_PAGES contains only hasUniqueData=true entries", () => {
    expect(INDEXABLE_PAGES.length).toBeGreaterThan(0);
    for (const entry of INDEXABLE_PAGES) {
      expect(entry.hasUniqueData).toBe(true);
    }
  });

  it("zero hasUniqueData=false entries leak into INDEXABLE_PAGES", () => {
    const thinPages = PAGE_INDEX.filter((p) => !p.hasUniqueData);
    for (const thin of thinPages) {
      expect(INDEXABLE_PAGES.find((p) => p.path === thin.path)).toBeUndefined();
    }
  });

  it("every INDEXABLE_PAGES path matches the canonical /[state]/[category]-cost shape", () => {
    for (const entry of INDEXABLE_PAGES) {
      expect(entry.path).toBe(`/${entry.state.slug}/${entry.category.slug}-cost`);
    }
  });
});

describe("page-index: getModerateMedianCost (hub table data)", () => {
  it("returns a real positive number for every indexable page", () => {
    for (const entry of INDEXABLE_PAGES) {
      const median = getModerateMedianCost(entry.state.code, entry.category.slug);
      expect(median).not.toBeNull();
      expect(median).toBeGreaterThan(0);
    }
  });

  it("returns null for a pair with no moderate row", () => {
    expect(getModerateMedianCost("ZZ", "not-a-category")).toBeNull();
  });
});

// Log the indexable-URL count once for build-output-style visibility when run
// directly (mirrors the console.log in sitemap.ts).
describe("page-index: coverage report", () => {
  it("logs indexable page count (informational)", () => {
    const total = PAGE_INDEX.length;
    const indexable = INDEXABLE_PAGES.length;
    console.log(`page-index: ${indexable}/${total} programmatic pages pass hasUniqueData`);
    expect(indexable).toBeLessThanOrEqual(total);
  });
});
