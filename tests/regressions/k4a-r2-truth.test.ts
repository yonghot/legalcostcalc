import { describe, expect, it } from "vitest";
import { trajectorySentence } from "@/lib/seo/state-context";
import { PAGES, collect, seedTable, strictRank, type Page } from "./helpers/k4a-oracle";

/*
 * Adversarial review round 2 (r2-truth-*), reduced by the 2026-10-11 convergence order: the tier trajectory prints the
 * three strict ranks and the shift and draws no relation between the moderate tier and the other two.
 */

const tierRanks = (p: Page): [number, number, number] =>
  (["simple", "moderate", "complex"] as const).map((tier) => {
    const table = seedTable(p.category, tier);
    return strictRank(table, table.find((r) => r.code === p.code)!.median);
  }) as [number, number, number];

const O = "(\\d+)(?:st|nd|rd|th)";
const CLIMB = new RegExp(`moves up the table as complexity rises: ${O} at the simple tier, ${O} at moderate, ${O} at complex, a climb of (\\d+) places\\.$`);
const SLIDE = new RegExp(`slides (\\d+) places downward: ${O} at the simple tier, ${O} at moderate, ${O} at complex\\.$`);
const RELATION = /understates|does not understate|already shows|sits between|rather than|above both|below both|matches the (?:simple|complex)|highest position/;

describe("r2-truth-TRAJ-01: the tier trajectory prints the three ranks and the shift, and no relation between the tiers", () => {
  it("no page keeps a closing relation sentence for the moderate tier", () => {
    let seen = 0;
    const v = collect((p) => {
      const t = trajectorySentence(p.ctx) ?? "";
      if (CLIMB.test(t) || SLIDE.test(t)) seen++;
      return RELATION.test(t) ? [t] : [];
    });
    expect(seen).toBeGreaterThan(40);
    expect(v).toEqual([]);
  });

  it("every climb and slide page prints the strict ranks of its three tiers and the shift between the simple and complex ranks", () => {
    const counts = { climb: 0, slide: 0 };
    const v = collect((p) => {
      const t = trajectorySentence(p.ctx) ?? "";
      const [s, m, c] = tierRanks(p);
      const climb = t.match(CLIMB);
      const slide = t.match(SLIDE);
      if (s - c >= 4 && s - c < 10) {
        counts.climb++;
        if (!climb) return [`ranks ${s}/${m}/${c}: no climb form in "${t}"`];
        return [climb[1], climb[2], climb[3]].join() === [s, m, c].join() && Number(climb[4]) === s - c ? [] : [`says ${climb.slice(1, 5)} for ranks ${s}/${m}/${c}`];
      }
      if (c - s >= 4 && c - s < 10) {
        counts.slide++;
        if (!slide) return [`ranks ${s}/${m}/${c}: no slide form in "${t}"`];
        return [slide[2], slide[3], slide[4]].join() === [s, m, c].join() && Number(slide[1]) === c - s ? [] : [`says ${slide.slice(1, 5)} for ranks ${s}/${m}/${c}`];
      }
      return climb || slide ? [`a climb or slide form for ranks ${s}/${m}/${c}`] : [];
    });
    expect(counts.climb).toBeGreaterThan(10);
    expect(counts.slide).toBeGreaterThan(10);
    expect(v).toEqual([]);
  });

  it("constructed ranks, ties included, print the ranks and the shift and nothing about how the moderate tier relates to the others", () => {
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
      expect(text, `${s}/${m}/${c}`).toMatch(s < c ? SLIDE : CLIMB);
    }
  });
});
