/**
 * Tests for static data repositories and cost-lookup helpers
 * that do NOT require a Supabase connection.
 *
 * Tests cover:
 *   - findCategoryBySlug (category-repository) — static data lookup
 *   - findStateByCode / findStateBySlug (state-repository) — static data lookup
 *   - costs.json direct lookup by category/state/complexity (data-integrity cross-check)
 */

import { describe, it, expect } from "vitest";
import {
  findAllCategories,
  findCategoryBySlug,
} from "@/lib/repositories/category-repository";
import {
  findAllStates,
  findStateByCode,
  findStateBySlug,
} from "@/lib/repositories/state-repository";
import rawCosts from "../src/data/seed/costs.json";

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
}

const costs = rawCosts as CostCell[];

// ── Helper: in-memory cost lookup (mirrors what the DB does) ──────────────────

function lookupCost(
  category: string,
  stateCode: string,
  complexity: string,
): CostCell | undefined {
  return costs.find(
    (c) =>
      c.category === category &&
      c.state_code === stateCode &&
      c.complexity === complexity,
  );
}

// ── Suite: category-repository (static data) ──────────────────────────────────

describe("findAllCategories — static data", () => {
  it("returns a non-empty array", async () => {
    const cats = await findAllCategories();
    expect(cats.length).toBeGreaterThan(0);
  });

  it("returns exactly 8 categories (one per legal domain)", async () => {
    const cats = await findAllCategories();
    expect(cats).toHaveLength(8);
  });

  it("each category has a non-empty slug and displayName", async () => {
    const cats = await findAllCategories();
    for (const cat of cats) {
      expect(cat.slug).toBeTruthy();
      expect(cat.displayName).toBeTruthy();
    }
  });
});

describe("findCategoryBySlug — normal, boundary, missing cases", () => {
  it("returns the correct category for 'divorce'", async () => {
    const cat = await findCategoryBySlug("divorce");
    expect(cat).not.toBeNull();
    expect(cat?.slug).toBe("divorce");
    expect(cat?.displayName).toBe("Divorce");
  });

  it("returns the correct category for 'immigration'", async () => {
    const cat = await findCategoryBySlug("immigration");
    expect(cat).not.toBeNull();
    expect(cat?.slug).toBe("immigration");
  });

  it("returns null for an unknown slug", async () => {
    const cat = await findCategoryBySlug("unicorn-law");
    expect(cat).toBeNull();
  });

  it("returns null for an empty string slug", async () => {
    const cat = await findCategoryBySlug("");
    expect(cat).toBeNull();
  });

  it("is case-sensitive (uppercase slug returns null)", async () => {
    const cat = await findCategoryBySlug("Divorce");
    expect(cat).toBeNull();
  });
});

// ── Suite: state-repository (static data) ─────────────────────────────────────

describe("findAllStates — static data", () => {
  it("returns a non-empty array", async () => {
    const states = await findAllStates();
    expect(states.length).toBeGreaterThan(0);
  });

  it("returns exactly 51 entries (50 states + DC)", async () => {
    const states = await findAllStates();
    expect(states).toHaveLength(51);
  });

  it("each state has a non-empty code, name, and slug", async () => {
    const states = await findAllStates();
    for (const s of states) {
      expect(s.code).toBeTruthy();
      expect(s.name).toBeTruthy();
      expect(s.slug).toBeTruthy();
    }
  });
});

describe("findStateByCode — normal, boundary, missing cases", () => {
  it("returns the correct state for 'CA'", async () => {
    const s = await findStateByCode("CA");
    expect(s).not.toBeNull();
    expect(s?.code).toBe("CA");
    expect(s?.name).toBe("California");
  });

  it("is case-insensitive (lowercase 'ca' returns California)", async () => {
    const s = await findStateByCode("ca");
    expect(s?.code).toBe("CA");
  });

  it("returns the correct state for 'DC'", async () => {
    const s = await findStateByCode("DC");
    expect(s).not.toBeNull();
    expect(s?.name).toBe("District of Columbia");
  });

  it("returns null for an unknown code", async () => {
    const s = await findStateByCode("ZZ");
    expect(s).toBeNull();
  });

  it("returns null for an empty string", async () => {
    const s = await findStateByCode("");
    expect(s).toBeNull();
  });
});

describe("findStateBySlug — normal, boundary, missing cases", () => {
  it("returns the correct state for 'california'", async () => {
    const s = await findStateBySlug("california");
    expect(s).not.toBeNull();
    expect(s?.code).toBe("CA");
  });

  it("returns the correct state for 'district-of-columbia'", async () => {
    const s = await findStateBySlug("district-of-columbia");
    expect(s).not.toBeNull();
    expect(s?.code).toBe("DC");
  });

  it("returns null for an unknown slug", async () => {
    const s = await findStateBySlug("not-a-state");
    expect(s).toBeNull();
  });

  it("returns null for an empty string", async () => {
    const s = await findStateBySlug("");
    expect(s).toBeNull();
  });
});

// ── Suite: in-memory cost lookup (category/state/complexity) ──────────────────

describe("in-memory cost lookup — normal, boundary, missing", () => {
  it("finds a cost cell for divorce/CA/simple", () => {
    const cell = lookupCost("divorce", "CA", "simple");
    expect(cell).toBeDefined();
    expect(cell?.category).toBe("divorce");
    expect(cell?.state_code).toBe("CA");
    expect(cell?.complexity).toBe("simple");
  });

  it("finds a cost cell for immigration/NY/complex", () => {
    const cell = lookupCost("immigration", "NY", "complex");
    expect(cell).toBeDefined();
    expect(cell?.category).toBe("immigration");
  });

  it("finds a cost cell for dui/TX/moderate", () => {
    const cell = lookupCost("dui", "TX", "moderate");
    expect(cell).toBeDefined();
    expect(cell?.cost_median).toBeGreaterThan(0);
  });

  it("all 8 categories x 51 states x 3 complexities = 1224 cells are reachable", () => {
    const categories = ["divorce", "dui", "personal-injury", "bankruptcy", "real-estate", "estate-planning", "criminal-defense", "immigration"];
    const states = (rawCosts as CostCell[])
      .map((c) => c.state_code)
      .filter((v, i, a) => a.indexOf(v) === i);
    const complexities = ["simple", "moderate", "complex"];

    let found = 0;
    for (const cat of categories) {
      for (const state of states) {
        for (const complexity of complexities) {
          const cell = lookupCost(cat, state, complexity);
          if (cell) found++;
        }
      }
    }
    expect(found).toBe(1224);
  });

  it("returns undefined for a non-existent combination", () => {
    const cell = lookupCost("divorce", "ZZ", "simple");
    expect(cell).toBeUndefined();
  });

  it("returns undefined for an invalid complexity value", () => {
    const cell = lookupCost("divorce", "CA", "impossible");
    expect(cell).toBeUndefined();
  });

  it("boundary: finds first state alphabetically (AL)", () => {
    const cell = lookupCost("divorce", "AL", "simple");
    expect(cell).toBeDefined();
    expect(cell?.state_code).toBe("AL");
  });

  it("boundary: finds last state alphabetically (WY)", () => {
    const cell = lookupCost("divorce", "WY", "complex");
    expect(cell).toBeDefined();
    expect(cell?.state_code).toBe("WY");
  });
});
