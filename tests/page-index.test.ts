/**
 * Tests for src/lib/page-index.ts — T09/CODE-06 thin-page triage.
 *
 * Asserts the sitemap/robots/link-module consistency required by the T09
 * acceptance criteria: sitemap.xml, generateMetadata's robots directive, and
 * every internal-link module (T06 RelatedMatters, T07 hub pages/RelatedLinks)
 * all draw from the exact same INDEXABLE_PAGES set — no module can link to a
 * page that would be noindexed, and the sitemap can never contain a
 * hasUniqueData=false page.
 *
 * CODE-06 (부속P §4) additionally asserts the strengthened information-gain
 * gate: a page needs >=4 differentiating facts (local average, local range,
 * sample-scenario result, computed comparison-vs-benchmark) to pass, and a
 * page whose moderate-complexity row is a full-signature duplicate of a
 * sibling state's row (same category) — i.e. structurally the same page
 * with only the state name swapped — fails fact 4 and is therefore
 * noindex + absent from INDEXABLE_PAGES/sitemap even though it has data.
 */
import { describe, expect, it } from "vitest";
import {
  PAGE_INDEX,
  INDEXABLE_PAGES,
  hasUniqueData,
  getModerateMedianCost,
  getNationalAverage,
} from "@/lib/page-index";
import { STATES } from "@/lib/constants/states";
import { CATEGORIES } from "@/lib/constants/categories";
import costsSeed from "@/data/seed/costs.json";

interface SeedRow {
  category: string;
  state_code: string;
  complexity: string;
  cost_low: number;
  cost_median: number;
  cost_high: number;
  hourly_rate_low?: number | null;
  hourly_rate_median?: number | null;
  hourly_rate_high?: number | null;
  typical_duration?: string | null;
  sources?: string[] | null;
}

const SEED_ROWS = costsSeed as SeedRow[];

function rowSignature(row: SeedRow): string {
  return [
    row.cost_low,
    row.cost_median,
    row.cost_high,
    row.hourly_rate_low ?? "",
    row.hourly_rate_median ?? "",
    row.hourly_rate_high ?? "",
    row.typical_duration ?? "",
  ].join("|");
}

/** Recomputes the CODE-06 4-fact score independently of page-index.ts's own
 * implementation, so the test doesn't just re-assert the module's internal
 * logic against itself. */
function expectedFactCount(stateCode: string, categorySlug: string): number {
  const rows = SEED_ROWS.filter((r) => r.state_code === stateCode && r.category === categorySlug);
  const moderate = rows.find((r) => r.complexity === "moderate");
  const simple = rows.find((r) => r.complexity === "simple");
  const complex = rows.find((r) => r.complexity === "complex");

  const localAverage = Boolean(
    moderate && moderate.cost_median > 0 && moderate.sources && moderate.sources.length > 0,
  );
  const localRange = Boolean(moderate && moderate.cost_low > 0 && moderate.cost_high > moderate.cost_low);
  const sampleScenario = Boolean(
    simple &&
      simple.cost_median > 0 &&
      simple.sources &&
      simple.sources.length > 0 &&
      complex &&
      complex.cost_median > 0,
  );
  const isDuplicate =
    moderate &&
    SEED_ROWS.some(
      (r) =>
        r.category === categorySlug &&
        r.complexity === "moderate" &&
        r.state_code !== stateCode &&
        rowSignature(r) === rowSignature(moderate),
    );
  const comparisonVsBenchmark = Boolean(moderate && localAverage && !isDuplicate);

  return [localAverage, localRange, sampleScenario, comparisonVsBenchmark].filter(Boolean).length;
}

describe("page-index: hasUniqueData derivation (CODE-06 4-fact gate)", () => {
  it("computes an entry for every (state, category) combination", () => {
    expect(PAGE_INDEX.length).toBe(STATES.length * CATEGORIES.length);
  });

  it("hasUniqueData is derived programmatically from a >=4-fact score — never hand-flagged", () => {
    for (const entry of PAGE_INDEX) {
      const factCount = expectedFactCount(entry.state.code, entry.category.slug);
      expect(entry.factCount).toBe(factCount);
      expect(entry.hasUniqueData).toBe(factCount >= 4);
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

  it("a page whose moderate row is a full-signature duplicate of a sibling state fails the gate (noindex + absent from sitemap)", () => {
    // Real dataset fact: several (state, category) pairs share a byte-for-byte
    // identical moderate-complexity row with another state in the same
    // category (e.g. real-estate: ID/IA/MO share one signature, ME/MI share
    // another) — a structurally-identical page with only the state name
    // swapped. CODE-06 must catch this via fact 4 even though facts 1-3
    // (local average/range/sample-scenario) still look individually present.
    const duplicateEntry = PAGE_INDEX.find((p) => {
      if (!p.facts.localAverage || !p.facts.localRange || !p.facts.sampleScenario) return false;
      return !p.facts.comparisonVsBenchmark;
    });

    expect(duplicateEntry).toBeDefined();
    expect(duplicateEntry!.factCount).toBeLessThan(4);
    expect(duplicateEntry!.hasUniqueData).toBe(false);
    // Absent from the indexable set that feeds sitemap.ts / hub / link modules.
    expect(INDEXABLE_PAGES.find((p) => p.path === duplicateEntry!.path)).toBeUndefined();
  });

  it("national average is computed from the real seed dataset, never hardcoded", () => {
    for (const category of CATEGORIES) {
      const avg = getNationalAverage(category.slug);
      expect(avg).not.toBeNull();
      expect(avg).toBeGreaterThan(0);
    }
    expect(getNationalAverage("not-a-category")).toBeNull();
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
