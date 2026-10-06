import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import rawCosts from "@/data/seed/costs.json";

vi.mock("@/lib/repositories/cost-repository", () => ({
  findCostsByFilters: vi.fn(),
  findCostsByStatesAndCategory: vi.fn(),
}));

import { getCosts, getCostForPage, compareCosts } from "@/lib/services/cost-service";
import {
  findCostsByFilters,
  findCostsByStatesAndCategory,
} from "@/lib/repositories/cost-repository";
import { findSeedCostsByFilters } from "@/lib/repositories/cost-seed-repository";
import { costFamilyKey, getFamilyDate } from "@/lib/content-dates";

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.mocked(findCostsByFilters).mockRejectedValue(new Error("Database unavailable"));
  vi.mocked(findCostsByStatesAndCategory).mockRejectedValue(new Error("Database unavailable"));
});

afterEach(() => vi.restoreAllMocks());

describe("sourced cost content during database outages", () => {
  it("preserves every personal-injury contingency range in the seed repository", () => {
    for (const seed of rawCosts.filter((row) => row.category === "personal-injury")) {
      const [row] = findSeedCostsByFilters({
        category: seed.category,
        stateCode: seed.state_code,
        complexity: seed.complexity,
      });
      expect(row.contingency_fee_low).toBe(seed.contingency_fee_low);
      expect(row.contingency_fee_median).toBe(seed.contingency_fee_median);
      expect(row.contingency_fee_high).toBe(seed.contingency_fee_high);
    }
  });

  it.each([getCosts, (params: Parameters<typeof getCosts>[0]) =>
    getCostForPage(params.category!, params.stateCode!)])(
    "returns complete personal-injury content through a cost service entry point",
    async (lookup) => {
      const result = await lookup({ category: "personal-injury", stateCode: "CA" });
      expect(result).toHaveLength(3);
      for (const cost of result) {
        const seed = rawCosts.find((row) => row.category === cost.category &&
          row.state_code === cost.stateCode && row.complexity === cost.complexity)!;
        expect(cost.contingencyFee).toEqual({
          low: seed.contingency_fee_low,
          median: seed.contingency_fee_median,
          high: seed.contingency_fee_high,
        });
        expect(cost.sources).toEqual(seed.sources);
        expect(cost.lastVerifiedAt).toBe(`${getFamilyDate(costFamilyKey(cost.category))!.date}T00:00:00.000Z`);
      }
    },
  );

  it("preserves contingency fees in both states of a comparison", async () => {
    const comparison = await compareCosts(["CA", "TX"], "personal-injury");
    expect(comparison.states).toHaveLength(2);
    for (const state of comparison.states) {
      expect(state.costs).toHaveLength(3);
      expect(state.costs.every((cost) => cost.contingencyFee !== null)).toBe(true);
    }
  });

  it("keeps hourly matters without a contingency fee", async () => {
    const costs = await getCosts({ category: "divorce", stateCode: "CA" });
    expect(costs).toHaveLength(3);
    expect(costs.every((cost) => cost.contingencyFee === null)).toBe(true);
  });
});
