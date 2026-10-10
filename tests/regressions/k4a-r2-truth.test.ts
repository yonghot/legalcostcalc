import { describe, expect, it } from "vitest";
import { trajectorySentence } from "@/lib/seo/state-context";
import { PAGES, collect, seedTable, strictRank, type Page } from "./helpers/k4a-oracle";

/*
 * Adversarial review round 2 (r2-truth-*): sentences whose claim the page's own numbers contradict.
 */

type Relation = "between" | "above-both" | "below-both" | "equals-simple" | "equals-complex";

const tierRanks = (p: Page): [number, number, number] =>
  (["simple", "moderate", "complex"] as const).map((tier) => {
    const table = seedTable(p.category, tier);
    return strictRank(table, table.find((r) => r.code === p.code)!.median);
  }) as [number, number, number];

const SLIDE = /places downward/;
const CLIMB = /moves up the table as complexity rises/;

describe("r2-truth-TRAJ-01: the closing relation of the tier trajectory agrees with the three tier ranks", () => {
  it("'sits between the two extremes' needs the moderate rank strictly between the simple and complex ranks", () => {
    let seen = 0;
    const v = collect((p) => {
      if (!/sits between the two extremes/.test(trajectorySentence(p.ctx, p.label) ?? "")) return [];
      seen++;
      const [s, m, c] = tierRanks(p);
      return m > Math.min(s, c) && m < Math.max(s, c) ? [] : [`ranks ${s}/${m}/${c}`];
    });
    expect(seen).toBeGreaterThan(0);
    expect(v).toEqual([]);
  });

  it("'understates where it sits once a matter is contested' needs the moderate rank to be a larger number than the complex rank", () => {
    let seen = 0;
    const v = collect((p) => {
      if (!/understates where it sits once a matter is contested/.test(trajectorySentence(p.ctx, p.label) ?? "")) return [];
      seen++;
      const [s, m, c] = tierRanks(p);
      return m > c ? [] : [`ranks ${s}/${m}/${c}`];
    });
    expect(seen).toBeGreaterThan(0);
    expect(v).toEqual([]);
  });

  it("every page in the slide branch names the relation its tier ranks give", () => {
    const wording: Record<Relation, RegExp> = {
      between: /sits between the two extremes/,
      "above-both": /sits above both of the other tiers rather than between them/,
      "below-both": /sits below both of the other tiers rather than between them/,
      "equals-simple": /matches the simple tier's; the fall comes between the moderate and complex tiers/,
      "equals-complex": /matches the complex tier's; the fall comes between the simple and moderate tiers/,
    };
    const counts: Partial<Record<Relation, number>> = {};
    const v = collect((p) => {
      const t = trajectorySentence(p.ctx, p.label) ?? "";
      if (!SLIDE.test(t)) return [];
      const [s, m, c] = tierRanks(p);
      const relation: Relation = m === s ? "equals-simple" : m === c ? "equals-complex" : m < s ? "above-both" : m > c ? "below-both" : "between";
      counts[relation] = (counts[relation] ?? 0) + 1;
      return wording[relation].test(t) ? [] : [`ranks ${s}/${m}/${c} (${relation}): ${t}`];
    });
    expect(counts.between).toBeGreaterThan(0);
    expect(counts["below-both"]).toBeGreaterThan(0);
    expect(counts["above-both"]).toBeGreaterThan(0);
    expect(v).toEqual([]);
  });

  it("every page in the climb branch names the relation its tier ranks give", () => {
    const wording = {
      understates: /understates where it sits once a matter is contested/,
      highest: /highest position of the three, so the headline moderate figure does not understate where the state sits once a matter is contested/,
      same: /moderate and complex tiers hold the same position, so the headline moderate figure already shows where the state sits once a matter is contested/,
    };
    const counts: Record<string, number> = {};
    const v = collect((p) => {
      const t = trajectorySentence(p.ctx, p.label) ?? "";
      if (!CLIMB.test(t)) return [];
      const [s, m, c] = tierRanks(p);
      const relation = m > c ? "understates" : m < c ? "highest" : "same";
      counts[relation] = (counts[relation] ?? 0) + 1;
      return wording[relation].test(t) ? [] : [`ranks ${s}/${m}/${c} (${relation}): ${t}`];
    });
    expect(counts.understates).toBeGreaterThan(0);
    expect(counts.highest).toBeGreaterThan(0);
    expect(v).toEqual([]);
  });

  it("the branches are exercised on constructed ranks too, ties included", () => {
    const base = PAGES[0]!;
    const sentence = (s: number, m: number, c: number) => {
      const t = base.ctx.tiers;
      const ctx = {
        ...base.ctx,
        tierRankShift: s - c,
        tiers: { simple: { ...t.simple!, rank: s }, moderate: { ...t.moderate!, rank: m }, complex: { ...t.complex!, rank: c } },
      };
      return trajectorySentence(ctx, base.label) ?? "";
    };
    expect(sentence(8, 11, 14)).toMatch(/sits between the two extremes/);
    expect(sentence(8, 15, 14)).toMatch(/sits below both of the other tiers rather than between them/);
    expect(sentence(8, 5, 14)).toMatch(/sits above both of the other tiers rather than between them/);
    expect(sentence(8, 8, 14)).toMatch(/matches the simple tier's; the fall comes between the moderate and complex tiers/);
    expect(sentence(8, 14, 14)).toMatch(/matches the complex tier's; the fall comes between the simple and moderate tiers/);
    expect(sentence(14, 20, 8)).toMatch(/understates where it sits once a matter is contested/);
    expect(sentence(14, 5, 8)).toMatch(/highest position of the three, so the headline moderate figure does not understate/);
    expect(sentence(14, 8, 8)).toMatch(/hold the same position, so the headline moderate figure already shows/);
    expect(sentence(14, 14, 8)).toMatch(/understates where it sits once a matter is contested/);
  });
});
