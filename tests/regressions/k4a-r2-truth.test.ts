import { describe, expect, it } from "vitest";
import { trajectorySentence } from "@/lib/seo/state-context";
import { PAGES, collect, seedTable, strictRank, type Page } from "./helpers/k4a-oracle";

/*
 * Adversarial review round 2 (r2-truth-*), reduced by the 2026-10-11 convergence order and again by round 4
 * (r4-truth-R4-W02): the tier trajectory prints the three strict ranks and the net difference between the simple and
 * complex ranks. It says nothing about direction, monotony or the moderate tier's relation to the other two.
 */

const tierRanks = (p: Page): [number, number, number] =>
  (["simple", "moderate", "complex"] as const).map((tier) => {
    const table = seedTable(p.category, tier);
    return strictRank(table, table.find((r) => r.code === p.code)!.median);
  }) as [number, number, number];

const O = "(\\d+)(?:st|nd|rd|th)";
const NET = new RegExp(`^Rank by tier: ${O} at the simple tier, ${O} at moderate, ${O} at complex of (\\d+), a net difference of (\\d+) places between the simple and complex tiers\\.$`);
const RELATION = /understates|does not understate|already shows|sits between|rather than|above both|below both|matches the (?:simple|complex)|highest position/;
const DIRECTION = /climb|slide|fall of|moves up|downward|as complexity rises|gets harder|becomes harder/;

describe("r2-truth-TRAJ-01: the tier trajectory prints the three ranks and the net difference, and no relation between the tiers", () => {
  it("no page keeps a closing relation sentence for the moderate tier or a direction of travel", () => {
    let seen = 0;
    const v = collect((p) => {
      const t = trajectorySentence(p.ctx) ?? "";
      if (NET.test(t)) seen++;
      return RELATION.test(t) || DIRECTION.test(t) ? [t] : [];
    });
    expect(seen).toBeGreaterThan(40);
    expect(v).toEqual([]);
  });

  it("every page with a net difference of 4 to 9 prints the strict ranks of its three tiers and the difference between the simple and complex ranks", () => {
    const counts = { simpleHigher: 0, complexHigher: 0 };
    const v = collect((p) => {
      const t = trajectorySentence(p.ctx) ?? "";
      const [s, m, c] = tierRanks(p);
      const net = t.match(NET);
      const diff = Math.abs(s - c);
      if (diff >= 4 && diff < 10) {
        if (s > c) counts.simpleHigher++;
        else counts.complexHigher++;
        if (!net) return [`ranks ${s}/${m}/${c}: no net-difference form in "${t}"`];
        return [net[1], net[2], net[3]].join() === [s, m, c].join() && Number(net[5]) === diff ? [] : [`says ${net.slice(1, 6)} for ranks ${s}/${m}/${c}`];
      }
      return net ? [`a net-difference form for ranks ${s}/${m}/${c}`] : [];
    });
    expect(counts.simpleHigher).toBeGreaterThan(10);
    expect(counts.complexHigher).toBeGreaterThan(10);
    expect(v).toEqual([]);
  });

  it("constructed ranks, ties included, print the ranks and the net difference and nothing about how the moderate tier relates to the others", () => {
    const base = PAGES[0]!;
    const sentence = (s: number, m: number, c: number) => {
      const t = base.ctx.tiers;
      const ctx = {
        ...base.ctx,
        tierRankShift: s - c,
        tiers: { simple: { ...t.simple!, rank: s }, moderate: { ...t.moderate!, rank: m }, complex: { ...t.complex!, rank: c } },
      };
      return trajectorySentence(ctx) ?? "";
    };
    for (const [s, m, c] of [[8, 11, 14], [8, 15, 14], [8, 5, 14], [8, 8, 14], [8, 14, 14], [14, 20, 8], [14, 5, 8], [14, 8, 8], [14, 14, 8]] as const) {
      const text = sentence(s, m, c);
      expect(text, `${s}/${m}/${c}`).not.toMatch(RELATION);
      expect(text, `${s}/${m}/${c}`).not.toMatch(DIRECTION);
      expect(text, `${s}/${m}/${c}`).toMatch(NET);
    }
  });
});
