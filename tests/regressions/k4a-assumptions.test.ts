import { describe, expect, it } from "vitest";
import costs from "@/data/seed/costs.json";
import { STATES } from "@/lib/constants/states";
import { assumptionItems } from "@/lib/seo/state-context";
import {
  NAME_RE,
  PAGES,
  collect,
  impliedHours,
  money,
  ord,
  seedTable,
  strictRank,
  tierRow,
  usd,
  valueOfName,
  type Page,
  type SeedRow,
} from "./helpers/k4a-oracle";

/*
 * K4-a EXTENSION (continued): the assumption list. Every item is matched to one known template, its figures and
 * relations are recomputed from the seed rows, and the set of items must be the set this page's own figures call for.
 */

/* ------------------------------------------------------------------ assumptionItems */

const O = "(?:st|nd|rd|th)";
const ITEM_TEMPLATES: [string, RegExp][] = [
  ["cluster4", /^(\d+) tracked states record a median within three percent of (\$[\d,]+) — about (\$[\d,]+) either way — so a revision of that size could move (.+?) past as many as (\d+) places\.$/],
  ["cluster0", /^No other tracked state's median is within three percent of (\$[\d,]+), so the rank would hold under a revision of that size, but there is no state that close to cross-check the figure against\.$/],
  ["cluster13", /^(.+?) (?:records a median|record medians) within three percent of (\$[\d,]+); no other state is close enough to corroborate it\.$/],
  ["gap6", new RegExp(`^Rate and total disagree by (\\d+) places \\((\\d+)${O} on rate against (\\d+)${O} on total\\), so the (\\$[\\d,]+) rate alone is a poor guide to the (\\$[\\d,]+) total\\.$`)],
  ["gap0", new RegExp(`^Rate and total both rank (.+?) (\\d+)${O}, which makes (\\$[\\d,]+) a workable shorthand here — it is not one everywhere in our cost figures\\.$`)],
  ["gapSmall", new RegExp(`^Rate and total sit (\\d+) places? apart \\((\\d+)${O} against (\\d+)${O}\\); close, but not the same measurement\\.$`)],
  ["ov1", /^(\$[\d,]+)(?:–(\$[\d,]+))? belongs to both bands; the tier, not the figure, separates them\.$/],
  ["noov1", /^A quote between (\$[\d,]+) and (\$[\d,]+) falls in the gap between two estimated bands, and this page does not describe it\.$/],
  ["ov2", /^The moderate band reaches (\$[\d,]+) while the complex band starts at (\$[\d,]+): the same money buys different work at the two tiers\.$/],
  ["noov2", /^(\$[\d,]+) of clear space separates the moderate ceiling from the complex floor, so escalation is a jump rather than a drift\.$/],
  ["shift", new RegExp(`^"The (.+?) rank" is ambiguous by (\\d+) places unless a tier is named: (\\d+)${O} simple, (\\d+)${O} moderate, (\\d+)${O} complex\\.$`)],
  ["hours35", /^The (\d+) implied hours are arithmetic, not a timesheet: they treat all of (\$[\d,]+) as attorney time at (\$[\d,]+), although a total can include costs other than attorney time\.$/],
  ["hoursSmall", /^(\$[\d,]+) ÷ (\$[\d,]+) comes to about (\d+) hours — an arithmetic implication of the estimate for an? .+?, not a timesheet\.$/],
  ["countyHigh", /^The (\$[\d,]+)–(\$[\d,]+) band is a single statewide estimate for (.+?), with no county-level figures behind it, so a quote above (\$[\d,]+) is a comparison with a model rather than a finding about any county\.$/],
  ["countyLow", /^The (\$[\d,]+)–(\$[\d,]+) band is one statewide estimate with no county breakdown behind it, so a quote outside it is not by itself evidence of anything\.$/],
  ["rankUp", new RegExp(`^A rise of (\\$[\\d,]+) in the (.+?) median, to the (\\$[\\d,]+) that (.+?) records, would move it up from (\\d+)${O}\\.$`)],
  ["rankTopTie", new RegExp(`^(.+?) holds (\\d+)${O} with no state above it, but (?:another state records|(\\d+) other states record) the same (\\$[\\d,]+), so any fall in its figure would lower its rank\\.$`)],
  ["rankTop", new RegExp(`^(.+?) holds (\\d+)${O} with no state above it; a fall of more than (\\$[\\d,]+), below the (\\$[\\d,]+) that (.+?) records, would be needed to lower its rank\\.$`)],
  ["legal", /^Legal fees change over time, and any change since these estimates were modeled is absent from the (\$[\d,]+) median\.$/],
];

interface AssumptionFacts {
  own: number;
  table: SeedRow[];
  rank: number;
  higher: number;
  lower: number;
  ties: number;
  near: SeedRow[];
  hourlyRank: number | null;
  quartile: number;
}

function assumptionFacts(p: Page): AssumptionFacts {
  const table = seedTable(p.category, "moderate");
  const own = table.find((r) => r.code === p.code)!.median;
  const higher = table.filter((r) => r.median > own).length;
  const lower = table.filter((r) => r.median < own).length;
  const rated = table.filter((r) => r.rate > 0);
  const ownRate = table.find((r) => r.code === p.code)!.rate;
  return {
    own,
    table,
    rank: higher + 1,
    higher,
    lower,
    ties: table.filter((r) => r.code !== p.code && r.median === own).length,
    near: table.filter((r) => r.code !== p.code && Math.abs(r.median - own) / own <= 0.03),
    hourlyRank: ownRate > 0 ? 1 + rated.filter((r) => r.rate > ownRate).length : null,
    quartile: Math.min(3, Math.floor((lower * 4) / table.length)) + 1,
  };
}

const rankAt = (f: AssumptionFacts, p: Page, value: number) => 1 + f.table.filter((r) => r.code !== p.code && r.median > value).length;

function expectedTemplates(p: Page, f: AssumptionFacts): string[] {
  const s = tierRow(p, "simple");
  const m = tierRow(p, "moderate")!;
  const c = tierRow(p, "complex");
  const out: string[] = [];
  out.push(f.near.length >= 4 ? "cluster4" : f.near.length === 0 ? "cluster0" : "cluster13");
  if (f.hourlyRank !== null) {
    const gap = Math.abs(f.rank - f.hourlyRank);
    out.push(gap >= 6 ? "gap6" : gap === 0 ? "gap0" : "gapSmall");
  }
  if (s) out.push(s.high >= m.low ? "ov1" : "noov1");
  if (c) out.push(m.high >= c.low ? "ov2" : "noov2");
  if (s && c) {
    const sr = strictRank(seedTable(p.category, "simple"), s.median);
    const cr = strictRank(seedTable(p.category, "complex"), c.median);
    if (Math.abs(sr - cr) >= 8) out.push("shift");
  }
  const h = impliedHours(m);
  if (h) out.push(h >= 35 ? "hours35" : "hoursSmall");
  out.push(f.quartile >= 3 ? "countyHigh" : "countyLow");
  if (f.rank <= Math.round(f.table.length / 2)) out.push(f.higher > 0 ? "rankUp" : f.ties > 0 ? "rankTopTie" : "rankTop");
  else out.push("legal");
  return out.sort();
}

function checkAssumptionItem(p: Page, f: AssumptionFacts, name: string, mt: RegExpMatchArray): string[] {
  const s = tierRow(p, "simple");
  const m = tierRow(p, "moderate")!;
  const c = tierRow(p, "complex");
  const v: string[] = [];
  const num = (i: number) => Number(mt[i]);
  const amt = (i: number) => money(mt[i]!);
  const nameIn = (i: number) => mt[i] !== p.state && v.push(`names ${mt[i]} instead of ${p.state}`);
  const sameValue = (n: string, want: number) => {
    const real = valueOfName(f.table, n);
    if (real !== want) v.push(`${n} stated at ${usd(want)} but records ${real === undefined ? "nothing" : usd(real)}`);
  };
  switch (name) {
    case "cluster4":
      const reach = Math.max(f.near.filter((r) => r.median > f.own).length, f.near.filter((r) => r.median <= f.own).length);
      if (num(1) !== f.near.length) v.push(`says ${num(1)} states are within three percent, ${f.near.length} are`);
      if (num(5) !== reach) v.push(`says a revision could pass ${num(5)} places, one direction reaches ${reach}`);
      if (amt(2) !== f.own) v.push("median differs from the page's");
      if (amt(3) !== Math.round(f.own * 0.03)) v.push(`three percent of ${usd(f.own)} is ${usd(f.own * 0.03)}, not ${mt[3]}`);
      nameIn(4);
      break;
    case "cluster0":
      if (amt(1) !== f.own) v.push("median differs from the page's");
      break;
    case "cluster13": {
      const said = [...mt[1]!.matchAll(new RegExp(NAME_RE, "g"))].map((x) => x[1]!).sort();
      const real = f.near.map((r) => STATES.find((st) => st.code === r.code)!.name).sort();
      if (said.join() !== real.join()) v.push(`names ${said.join(", ")} but ${real.join(", ")} are within three percent`);
      if (mt[0]!.includes("records a median") !== (real.length === 1)) v.push("verb does not agree with the number of states");
      if (amt(2) !== f.own) v.push("median differs from the page's");
      break;
    }
    case "gap6":
    case "gapSmall": {
      const g = Math.abs(f.rank - f.hourlyRank!);
      if (num(1) !== g || num(2) !== f.hourlyRank || num(3) !== f.rank) v.push(`says ${mt[0]!.slice(0, 70)} but the strict ranks are ${f.hourlyRank} and ${f.rank}`);
      if (name === "gap6" && (amt(4) !== m.rate || amt(5) !== f.own)) v.push("rate or total differs from the page's");
      if (name === "gapSmall" && (g < 1 || g > 5)) v.push(`close-ranks wording at a gap of ${g}`);
      break;
    }
    case "gap0":
      nameIn(1);
      if (num(2) !== f.rank || f.rank !== f.hourlyRank || amt(3) !== m.rate) v.push(`says both rank ${ord(num(2))} but cost rank ${f.rank}, rate rank ${f.hourlyRank}`);
      break;
    case "ov1":
      if (amt(1) !== m.low || (mt[2] ? amt(2) !== s!.high : m.low !== s!.high)) v.push("shared range differs from the moderate floor and simple ceiling");
      if (!(m.low >= s!.low && s!.high <= m.high && m.low <= s!.high)) v.push("claims a range in both bands that is not in both");
      break;
    case "noov1":
      if (amt(1) !== s!.high || amt(2) !== m.low || !(s!.high < m.low)) v.push("gap between the simple ceiling and moderate floor is wrong");
      break;
    case "ov2":
      if (amt(1) !== m.high || amt(2) !== c!.low || !(m.high >= c!.low)) v.push("moderate ceiling and complex floor are wrong");
      break;
    case "noov2":
      if (amt(1) !== c!.low - m.high || !(c!.low > m.high)) v.push("clear space between the moderate ceiling and complex floor is wrong");
      break;
    case "shift": {
      const sr = strictRank(seedTable(p.category, "simple"), s!.median);
      const cr = strictRank(seedTable(p.category, "complex"), c!.median);
      nameIn(1);
      if (num(2) !== Math.max(sr, f.rank, cr) - Math.min(sr, f.rank, cr) || num(3) !== sr || num(4) !== f.rank || num(5) !== cr) v.push(`says ${mt[0]!.slice(0, 90)} but the strict tier ranks are ${sr}, ${f.rank}, ${cr}`);
      break;
    }
    case "hours35":
      if (num(1) !== impliedHours(m) || amt(2) !== f.own || amt(3) !== m.rate) v.push("hours, median or rate differ from the page's");
      break;
    case "hoursSmall":
      if (amt(1) !== f.own || amt(2) !== m.rate || num(3) !== impliedHours(m)) v.push("median, rate or hours differ from the page's");
      break;
    case "countyHigh":
    case "countyLow":
      if (amt(1) !== m.low || amt(2) !== m.high) v.push("band differs from the page's moderate band");
      if (name === "countyHigh") {
        nameIn(3);
        if (amt(4) !== m.high) v.push("ceiling differs from the page's");
      }
      break;
    case "rankUp": {
      const g = amt(1);
      const v1 = amt(3);
      nameIn(2);
      sameValue(mt[4]!, v1);
      const nearest = Math.min(...f.table.filter((r) => r.median > f.own).map((r) => r.median));
      if (v1 !== nearest || g !== nearest - f.own) v.push(`nearest higher median is ${usd(nearest)}, ${usd(nearest - f.own)} away`);
      if (num(5) !== f.rank) v.push(`stated rank ${num(5)} but strict rank is ${f.rank}`);
      if (!(rankAt(f, p, f.own + g) < f.rank)) v.push(`a rise of ${usd(g)} does not change the rank`);
      if (rankAt(f, p, f.own + g - 1) !== f.rank) v.push(`a rise of ${usd(g - 1)} already changes the rank`);
      break;
    }
    case "rankTopTie":
      nameIn(1);
      if (num(2) !== f.rank || f.higher !== 0) v.push("claims first place with a state above");
      if (amt(4) !== f.own) v.push("median differs from the page's");
      if (mt[3] ? Number(mt[3]) !== f.ties : f.ties !== 1) v.push(`says ${mt[3] ?? "another"} state(s) record the same figure, ${f.ties} do`);
      if (!(rankAt(f, p, f.own - 1) > f.rank)) v.push("a fall of one dollar does not lower the rank");
      break;
    case "rankTop": {
      nameIn(1);
      const g = amt(3);
      const v1 = amt(4);
      sameValue(mt[5]!, v1);
      const nearest = Math.max(...f.table.filter((r) => r.median < f.own).map((r) => r.median));
      if (f.higher !== 0 || f.ties !== 0 || num(2) !== f.rank) v.push("claims an untied first place that the table does not give");
      if (v1 !== nearest || g !== f.own - nearest) v.push(`nearest lower median is ${usd(nearest)}, ${usd(f.own - nearest)} away`);
      if (rankAt(f, p, f.own - g) !== f.rank) v.push(`a fall of exactly ${usd(g)} already lowers the rank`);
      if (!(rankAt(f, p, f.own - g - 1) > f.rank)) v.push(`a fall of ${usd(g + 1)} does not lower the rank`);
      break;
    }
    case "legal":
      if (amt(1) !== f.own) v.push("median differs from the page's");
      break;
  }
  return v;
}

function checkAssumptions(p: Page, items: string[]): string[] {
  const f = assumptionFacts(p);
  const v: string[] = [];
  const found: string[] = [];
  for (const item of items) {
    const matches = ITEM_TEMPLATES.flatMap(([name, re]) => {
      const mt = item.match(re);
      return mt ? [{ name, mt }] : [];
    });
    if (matches.length !== 1) {
      v.push(`${matches.length} templates for: ${item.slice(0, 110)}`);
      continue;
    }
    found.push(matches[0]!.name);
    v.push(...checkAssumptionItem(p, f, matches[0]!.name, matches[0]!.mt));
  }
  const want = expectedTemplates(p, f);
  if (found.sort().join() !== want.join()) v.push(`items ${found.join(",")} but the page's relations call for ${want.join(",")}`);
  return v;
}

describe("K4-a extension: assumptionItems state only relations the table has", () => {
  it("every item is a known template with the page's own figures, and the set of items follows the page (every page)", () => {
    expect(collect((p) => checkAssumptions(p, assumptionItems(p.ctx, p.label)))).toEqual([]);
  });

  it("no county-level data exists anywhere in the seed, so no sentence may describe counties", () => {
    const rows = costs as Record<string, unknown>[];
    const keys = new Set(rows.flatMap((r) => Object.keys(r)));
    expect([...keys].filter((k) => /count(y|ies)/i.test(k))).toEqual([]);
    const perCell = new Map<string, number>();
    for (const r of rows) {
      const cell = `${r.category}/${r.state_code}/${r.complexity}`;
      perCell.set(cell, (perCell.get(cell) ?? 0) + 1);
    }
    expect([...perCell.values()].filter((n) => n > 1)).toEqual([]);
    const text = PAGES.flatMap((p) => assumptionItems(p.ctx, p.label)).join(" ");
    expect(text).not.toMatch(/County rates|metropolitan quote/);
  });

  it("every template occurs, so none of the checks is vacuous", () => {
    const seen = new Map<string, number>();
    for (const p of PAGES) for (const name of expectedTemplates(p, assumptionFacts(p))) seen.set(name, (seen.get(name) ?? 0) + 1);
    expect(ITEM_TEMPLATES.map(([name]) => name).filter((name) => !seen.get(name))).toEqual([]);
  });

  it("positive control: the checkers flag the earlier universal rank sentence and a one-dollar threshold", () => {
    const top = PAGES.find((p) => assumptionFacts(p).higher === 0)!;
    expect(top).toBeDefined();
    const ok = assumptionItems(top.ctx, top.label);
    expect(checkAssumptions(top, ok)).toEqual([]);
    const old = ok.map((i) => (/holds .+ with no state above it/.test(i) ? `A move of $1 anywhere in the table re-ranks ${top.state}.` : i));
    expect(old).not.toEqual(ok);
    expect(checkAssumptions(top, old).join(" ")).toMatch(/0 templates for: A move of \$1 anywhere/);

    const up = PAGES.find((p) => assumptionFacts(p).higher > 0 && assumptionFacts(p).rank <= Math.round(assumptionFacts(p).table.length / 2))!;
    const items = assumptionItems(up.ctx, up.label);
    expect(checkAssumptions(up, items)).toEqual([]);
    const one = items.map((i) => i.replace(/^A rise of \$[\d,]+/, "A rise of $1"));
    expect(one).not.toEqual(items);
    expect(checkAssumptions(up, one).join(" ")).toMatch(/does not change the rank|nearest higher median/);

    const county = items.map((i) => (/statewide/.test(i) ? `County rates sit on both sides of the statewide ${usd(1)}–${usd(2)} band, so a quote outside it is not by itself evidence of anything.` : i));
    expect(checkAssumptions(up, county).join(" ")).toMatch(/0 templates for: County rates/);
  });
});
