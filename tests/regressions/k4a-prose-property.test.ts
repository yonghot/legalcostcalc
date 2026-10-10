import { describe, expect, it } from "vitest";
import { STATES } from "@/lib/constants/states";
import { CATEGORIES } from "@/lib/constants/categories";
import {
  INDEXABLE_PAGES,
  getCategoryTierFigures,
  getModerateMedianCost,
  getNationalAverage,
  getNationalAverageStateCount,
  hasUniqueData,
} from "@/lib/page-index";
import { buildAnswerBlock, buildBenchmarkSynthesis } from "@/lib/seo/geo";
import { getCostForPage } from "@/lib/services/cost-service";
import {
  buildStateCostContext,
  categoryMixSentence,
  clusterSentence,
  consistencySentence,
  datasetSentences,
  hourlyPositionSentence,
  hoursRankSentence,
  movementSentences,
  neighborSentence,
  rankSentence,
  rateGroupSentences,
  sensitivitySentence,
  stateShapeSentences,
  tierAnalysisSentences,
  tierClusterSentence,
  tierNeighborSentences,
  trajectorySentence,
  type StateCostContext,
} from "@/lib/seo/state-context";
import { buildStateFaq } from "@/lib/seo/state-faq";
import { formatCurrency } from "@/lib/utils/format";

type Tier = "simple" | "moderate" | "complex";
type Row = { code: string; value: number };

const NAMES = STATES.map((s) => s.name).sort((a, b) => b.length - a.length);
const NAME_RE = `(?<![A-Za-z])(${NAMES.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`;
const nameToCode = new Map(STATES.map((s) => [s.name, s.code]));
const usd = (n: number) => formatCurrency(Math.round(n));
const money = (s: string) => Number(s.replace(/[$,]/g, ""));
const MONEY = "(\\$[\\d,]+)";

const ord = (n: number) => {
  const r = n % 100;
  if (r >= 11 && r <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10 > 3 ? 0 : n % 10]}`;
};

function rows(category: string, tier: Tier, key: "median" | "hourly" = "median"): Row[] {
  return getCategoryTierFigures(category, tier)
    .filter((r) => hasUniqueData(r.stateCode, category) && r.median > 0)
    .map((r) => ({ code: r.stateCode, value: key === "median" ? r.median : (r.hourlyMedian ?? 0) }))
    .filter((r) => r.value > 0);
}

function standing(list: Row[], code: string) {
  const own = list.find((r) => r.code === code);
  if (!own) return null;
  const higher = list.filter((r) => r.value > own.value).length;
  const lower = list.filter((r) => r.value < own.value).length;
  return { value: own.value, higher, lower, rank: higher + 1, of: list.length };
}

function middle(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
}

const valueOf = (list: Row[], name: string) => list.find((r) => r.code === nameToCode.get(name))?.value;

interface Page {
  code: string;
  state: string;
  category: string;
  label: string;
  ctx: StateCostContext;
}

const PAGES: Page[] = STATES.flatMap((s) =>
  CATEGORIES.flatMap((c) => {
    const ctx = buildStateCostContext(s.code, c.slug);
    return ctx ? [{ code: s.code, state: s.name, category: c.slug, label: c.displayName.toLowerCase(), ctx }] : [];
  }),
);

const key = (p: Page) => `${p.state}/${p.category}`;

function collect(check: (p: Page) => string[]): string[] {
  return PAGES.flatMap((p) => check(p).map((v) => `${key(p)}: ${v}`));
}

const tierKey: Record<string, Tier> = { simple: "simple", complex: "complex", moderate: "moderate" };

function adjacency(list: Row[], own: number, name: string, role: "above" | "below"): string[] {
  const v = valueOf(list, name);
  if (v === undefined) return [`${name} is not in the peer table`];
  if (role === "above") {
    if (v < own) return [`${name} named as above but records less`];
    if (list.some((r) => r.value > own && r.value < v)) return [`${name} is not the nearest state above`];
  } else {
    if (v > own) return [`${name} named as below but records more`];
    if (list.some((r) => r.value < own && r.value > v)) return [`${name} is not the nearest state below`];
  }
  return [];
}

function figures(list: Row[], text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(new RegExp(`${NAME_RE}(?: at | \\()${MONEY}`, "g"))) {
    const v = valueOf(list, m[1]!);
    if (v !== money(m[2]!)) out.push(`${m[1]} stated at ${m[2]} but records ${v === undefined ? "nothing" : usd(v)}`);
  }
  return out;
}

function checkRank(p: Page, text: string): string[] {
  const list = rows(p.category, "moderate");
  const s = standing(list, p.code)!;
  const peerMedian = middle(list.map((r) => r.value));
  const v: string[] = [];
  const stated = text.match(/(\d+)(?:st|nd|rd|th) of (\d+)/);
  if (!stated || Number(stated[1]) !== s.rank || Number(stated[2]) !== s.of) {
    v.push(`rank phrase ${stated?.[0] ?? "missing"} but strict rank is ${s.rank} of ${s.of}`);
  }
  const lower = text.match(/with (no state|(\d+) states?) recording a lower median still/);
  if (lower && (lower[2] ? Number(lower[2]) : 0) !== s.lower) v.push(`says ${lower[1]} lower but ${s.lower} record a lower median`);
  const higher =
    text.match(/with (no state|(\d+) states?) recording a higher median/) ??
    text.match(/(?:only (\d+) states? records?|no state records) a higher median/);
  if (higher) {
    const n = higher[2] !== undefined ? Number(higher[2]) : higher[1] && /^\d+$/.test(higher[1]) ? Number(higher[1]) : 0;
    if (n !== s.higher) v.push(`says ${higher[0]} but ${s.higher} record a higher median`);
  }
  const lowQuarter = /lowest-cost quarter/.test(text);
  const highQuarter = /highest-cost quarter/.test(text);
  if (lowQuarter !== (s.lower * 4 < s.of && !/within a percent/.test(text))) v.push(`lowest-cost quarter claim is ${lowQuarter}`);
  if (highQuarter !== (s.lower * 4 >= 3 * s.of && !/within a percent/.test(text))) v.push(`highest-cost quarter claim is ${highQuarter}`);
  const at = /lands within a percent/.test(text);
  const quartile = Math.min(3, Math.floor((s.lower * 4) / s.of)) + 1;
  if (/trails the/.test(text) !== (quartile === 2 && !at)) v.push("trails-the-midpoint claim does not follow the strict quartile");
  if (/sits above the midpoint/.test(text) !== (quartile === 3 && !at)) v.push("above-the-midpoint claim does not follow the strict quartile");
  if (/trails the/.test(text) && !(s.value < peerMedian)) v.push("claims to trail the midpoint but does not");
  if (/sits above the midpoint/.test(text) && !(s.value > peerMedian)) v.push("claims to sit above the midpoint but does not");
  if (/lands within a percent/.test(text) && !(Math.abs(s.value - peerMedian) / peerMedian < 0.01)) v.push("claims to be within a percent");
  if (!text.includes(usd(peerMedian))) v.push(`midpoint ${usd(peerMedian)} missing`);
  if (!/lands within a percent/.test(text) && !text.includes(usd(Math.abs(s.value - peerMedian)))) v.push("gap in dollars missing");
  return v;
}

function checkNeighbor(p: Page, text: string | null): string[] {
  const list = rows(p.category, "moderate");
  const own = standing(list, p.code)!.value;
  if (text === null) return list.length === 1 ? [] : ["no neighbor sentence on a table with several states"];
  const v = figures(list, text);
  let m: RegExpMatchArray | null;
  if ((m = text.match(new RegExp(`^${NAME_RE} and ${NAME_RE} both record ${MONEY}, the same figure as`)))) {
    for (const n of [m[1]!, m[2]!]) if (valueOf(list, n) !== own) v.push(`${n} does not record the same figure`);
    if (money(m[3]!) !== own) v.push("stated common figure differs");
    if (!/tie-break/.test(text)) v.push("a three-way tie is not described as a tie-break");
  } else if ((m = text.match(new RegExp(`^${NAME_RE} \\(${MONEY}\\) and ${NAME_RE} \\(${MONEY}\\) bracket .+? inside a ${MONEY} window`)))) {
    v.push(...adjacency(list, own, m[1]!, "above"), ...adjacency(list, own, m[3]!, "below"));
    if (money(m[5]!) !== money(m[2]!) - money(m[4]!)) v.push("window width is not above minus below");
  } else if ((m = text.match(new RegExp(`^${NAME_RE} is the nearest state below at ${MONEY} — (the same figure|${MONEY} away) — while the next state up, ${NAME_RE}, is a wider ${MONEY} step at ${MONEY}\\.`)))) {
    v.push(...adjacency(list, own, m[1]!, "below"), ...adjacency(list, own, m[5]!, "above"));
    if (m[3] === "the same figure" ? money(m[2]!) !== own : own - money(m[2]!) !== money(m[4]!)) v.push("distance below is wrong");
    if (money(m[7]!) - own !== money(m[6]!)) v.push("step above is wrong");
  } else if ((m = text.match(new RegExp(`^${NAME_RE}, at ${MONEY}, is (level with|only ${MONEY} above) .+?, but the drop to ${NAME_RE} at ${MONEY} is ${MONEY}`)))) {
    v.push(...adjacency(list, own, m[1]!, "above"), ...adjacency(list, own, m[5]!, "below"));
    const gapUp = money(m[2]!) - own;
    if (valueOf(list, m[1]!) !== money(m[2]!)) v.push("stated figure of the state above is wrong");
    if (m[3] === "level with" ? gapUp !== 0 : gapUp !== money(m[4]!)) v.push("distance above is wrong");
    if (own - money(m[6]!) !== money(m[7]!)) v.push("drop below is wrong");
  } else if ((m = text.match(new RegExp(`^In the .+? table .+? falls between ${NAME_RE} at ${MONEY} and ${NAME_RE} at ${MONEY}, (level with|${MONEY} above) the first and (level with|${MONEY} below) the second\\.`)))) {
    v.push(...adjacency(list, own, m[1]!, "below"), ...adjacency(list, own, m[3]!, "above"));
    const firstGap = own - money(m[2]!);
    const secondGap = money(m[4]!) - own;
    if (m[5] === "level with" ? firstGap !== 0 : firstGap !== money(m[6]!)) v.push("gap to the lower neighbor is wrong");
    if (m[7] === "level with" ? secondGap !== 0 : secondGap !== money(m[8]!)) v.push("gap to the upper neighbor is wrong");
  } else if ((m = text.match(new RegExp(`^No tracked state records a higher median .+? than .+?; the next state down is ${NAME_RE} at ${MONEY}, (the same figure|${MONEY} lower)\\.`)))) {
    if (list.some((r) => r.value > own)) v.push("says no state records a higher median but one does");
    v.push(...adjacency(list, own, m[1]!, "below"));
    if (m[3] === "the same figure" ? money(m[2]!) !== own : own - money(m[2]!) !== money(m[4]!)) v.push("gap down is wrong");
  } else if ((m = text.match(new RegExp(`^No tracked state records a lower median .+? than .+?; the state immediately above is ${NAME_RE} at ${MONEY}, (the same figure|${MONEY} higher)\\.`)))) {
    if (list.some((r) => r.value < own)) v.push("says no state records a lower median but one does");
    v.push(...adjacency(list, own, m[1]!, "above"));
    if (m[3] === "the same figure" ? money(m[2]!) !== own : money(m[2]!) - own !== money(m[4]!)) v.push("gap up is wrong");
  } else {
    v.push(`unrecognised neighbor sentence: ${text.slice(0, 80)}`);
  }
  return v;
}

describe("K4-a: tie handling in the rank statements (every state x matter page)", () => {
  it("covers every page the analysis renders, with ties present in the data", () => {
    expect(PAGES.length).toBe(369);
    const tied = PAGES.filter((p) => {
      const list = rows(p.category, "moderate");
      const s = standing(list, p.code)!;
      return list.filter((r) => r.value === s.value).length > 1;
    });
    expect(tied.length).toBeGreaterThan(50);
  });

  it("the stated rank, higher count and lower count equal the strict relation", () => {
    const v = collect((p) => {
      const list = rows(p.category, "moderate");
      const s = standing(list, p.code)!;
      const out: string[] = [];
      if (p.ctx.rank !== s.rank) out.push(`ctx.rank ${p.ctx.rank} but strict rank ${s.rank}`);
      if (p.ctx.rankedOutOf !== s.of) out.push(`rankedOutOf ${p.ctx.rankedOutOf} but ${s.of} states are ranked`);
      const ctx = p.ctx as StateCostContext & { statesHigher?: number; statesLower?: number };
      if (ctx.statesHigher !== s.higher) out.push(`statesHigher ${ctx.statesHigher} but ${s.higher} record a higher median`);
      if (ctx.statesLower !== s.lower) out.push(`statesLower ${ctx.statesLower} but ${s.lower} record a lower median`);
      return out;
    });
    expect(v).toEqual([]);
  });

  it("rankSentence states the strict higher/lower counts, rank, quartile and midpoint relation", () => {
    expect(collect((p) => checkRank(p, rankSentence(p.ctx, p.label)))).toEqual([]);
  });

  it("neighborSentence names the nearest states with their true figures and gaps", () => {
    expect(collect((p) => checkNeighbor(p, neighborSentence(p.ctx, p.label)))).toEqual([]);
  });

  it("the quartile in the dataset sentence follows the strict count of lower states", () => {
    const v = collect((p) => {
      const list = rows(p.category, "moderate");
      const s = standing(list, p.code)!;
      const peerMedian = middle(list.map((r) => r.value));
      const text = datasetSentences(p.ctx).join(" ");
      const out: string[] = [];
      const lowerQuarter = /in the lower quarter of the table/.test(text);
      const topQuarter = /in the top quarter of the table/.test(text);
      const belowMid = /at or below the midpoint of the table without reaching the bottom quarter/.test(text);
      const aboveMid = /at or above the midpoint, short of the top quarter/.test(text);
      const q = Math.min(3, Math.floor((s.lower * 4) / s.of)) + 1;
      if (lowerQuarter !== (q === 1)) out.push(`lower-quarter claim ${lowerQuarter} but quartile ${q}`);
      if (belowMid !== (q === 2)) out.push(`below-midpoint claim ${belowMid} but quartile ${q}`);
      if (aboveMid !== (q === 3)) out.push(`above-midpoint claim ${aboveMid} but quartile ${q}`);
      if (topQuarter !== (q === 4)) out.push(`top-quarter claim ${topQuarter} but quartile ${q}`);
      if (belowMid && !(s.value <= peerMedian)) out.push("at-or-below claim is false");
      if (aboveMid && !(s.value >= peerMedian)) out.push("at-or-above claim is false");
      const denominators = [...text.matchAll(/out of (\d+)/g)].map((m) => Number(m[1]));
      if (denominators.some((n) => n !== s.of)) out.push(`rank denominator ${denominators} differs from ${s.of}`);
      return out;
    });
    expect(v).toEqual([]);
  });

  it("the FAQ headline answer states the strict count of states recording more or less", () => {
    const v = collect((p) => {
      const list = rows(p.category, "moderate");
      const s = standing(list, p.code)!;
      const answer = buildStateFaq(p.ctx, p.label)[0]!.answer;
      const out: string[] = [];
      const more = answer.match(/with (no state|(\d+) states?) recording more/);
      const less = answer.match(/with (no state|(\d+) states?) recording less/);
      if (more && (more[2] ? Number(more[2]) : 0) !== s.higher) out.push(`says ${more[1]} record more, strict ${s.higher}`);
      if (less && (less[2] ? Number(less[2]) : 0) !== s.lower) out.push(`says ${less[1]} record less, strict ${s.lower}`);
      if (more || less) {
        const rank = answer.match(/(\d+)(?:st|nd|rd|th),? with|ranks .+? (\d+)(?:st|nd|rd|th)/);
        if (!rank) out.push("rank missing from the tallied answer");
      }
      return out;
    });
    expect(v).toEqual([]);
  });

  it("every sentence shape the checkers parse occurs on at least one page, so none of the checks is vacuous", () => {
    const seen = new Map<string, number>();
    const hit = (name: string, text: string | null | undefined, re: RegExp) => {
      if (text && re.test(text)) seen.set(name, (seen.get(name) ?? 0) + 1);
    };
    for (const p of PAGES) {
      const rankText = rankSentence(p.ctx, p.label);
      hit("lower count", rankText, /recording a lower median still/);
      hit("higher count (quartile 3)", rankText, /recording a higher median/);
      hit("higher count (quartile 4)", rankText, /records? a higher median/);
      hit("within a percent", rankText, /within a percent/);
      hit("trails", rankText, /trails the/);
      const nb = neighborSentence(p.ctx, p.label);
      hit("neighbor tie", nb, /both record/);
      hit("neighbor bracket", nb, /bracket/);
      hit("neighbor top edge", nb, /nearest state below/);
      hit("neighbor bottom edge", nb, /drop to/);
      hit("neighbor between", nb, /falls between/);
      hit("neighbor no higher", nb, /^No tracked state records a higher/);
      hit("neighbor no lower", nb, /^No tracked state records a lower/);
      const faq = buildStateFaq(p.ctx, p.label)[0]!.answer;
      hit("faq more", faq, /recording more/);
      hit("faq less", faq, /recording less/);
      hit("sensitivity tie", sensitivitySentence(p.ctx, p.label), /tie-break/);
      hit("movement same figure", movementSentences(p.ctx, p.label).join(" "), /which all record the same/);
      hit("movement nothing above", movementSentences(p.ctx, p.label).join(" "), /There is nothing above/);
      hit("category largest", categoryMixSentence(p.ctx, p.label), /carries the largest median/);
      hit("category smallest", categoryMixSentence(p.ctx, p.label), /records the smallest median/);
      hit("category between", categoryMixSentence(p.ctx, p.label), /between /);
      hit("consistency with denominators", consistencySentence(p.ctx, p.label), /\d(?:st|nd|rd|th) of \d+ for /);
      hit("tier under/over", tierNeighborSentences(p.ctx, p.label).join(" "), /\b(?:under|level with) .+ and (?:over|level with)/);
      hit("tier up", tierAnalysisSentences(p.ctx, p.label, "simple").join(" "), /up on its moderate position/);
      hit("tier down", tierAnalysisSentences(p.ctx, p.label, "complex").join(" "), /below its moderate position/);
      hit("thirds tally", stateShapeSentences(p.ctx, p.label).join(" "), /in the upper third, \d+ in the lower/);
      hit("hourly position", hourlyPositionSentence(p.ctx, p.label), /places/);
      hit("hours rank", hoursRankSentence(p.ctx, p.label), /of \d+ at/);
      hit("rate group", rateGroupSentences(p.ctx, p.label).join(" "), /record the same|record exactly/);
      hit("cluster", clusterSentence(p.ctx, p.label), /within three percent/);
      hit("tier cluster", tierClusterSentence(p.ctx, "simple"), /within three percent/);
      hit("trajectory", trajectorySentence(p.ctx, p.label), /place/);
      hit("dataset quartile", datasetSentences(p.ctx).join(" "), /quarter/);
    }
    const missing = [...new Set([
      "lower count", "higher count (quartile 3)", "higher count (quartile 4)", "within a percent", "trails", "neighbor tie",
      "neighbor bracket", "neighbor top edge", "neighbor bottom edge", "neighbor between", "neighbor no higher", "neighbor no lower",
      "faq more", "faq less", "sensitivity tie", "movement same figure", "movement nothing above", "category largest",
      "category smallest", "category between", "consistency with denominators", "tier under/over", "tier up", "tier down",
      "thirds tally", "hourly position", "hours rank", "rate group", "cluster", "tier cluster", "trajectory", "dataset quartile",
    ])].filter((name) => !seen.get(name));
    expect(missing).toEqual([]);
  });

  it("positive control: the checkers flag the earlier positional counts on a page whose median is tied", () => {
    const candidate = PAGES.find((p) => {
      const list = rows(p.category, "moderate");
      const ordered = [...list].sort((a, b) => b.value - a.value);
      const positional = ordered.findIndex((r) => r.code === p.code) + 1;
      const s = standing(list, p.code)!;
      return positional !== s.rank && s.lower * 4 >= 3 * s.of;
    });
    expect(candidate, "a tied page in the top quarter exists").toBeDefined();
    const p = candidate!;
    const list = rows(p.category, "moderate");
    const ordered = [...list].sort((a, b) => b.value - a.value);
    const positional = ordered.findIndex((r) => r.code === p.code) + 1;
    const stale = { ...p.ctx, rank: positional, statesHigher: positional - 1, statesLower: p.ctx.rankedOutOf - positional };
    const violations = checkRank(p, rankSentence(stale, p.label));
    expect(violations.length).toBeGreaterThan(0);
    expect(violations.join(" ")).toMatch(/rank phrase|record a higher median/);
    const q1 = PAGES.find((x) => {
      const l = rows(x.category, "moderate");
      const o = [...l].sort((a, b) => b.value - a.value);
      const pos = o.findIndex((r) => r.code === x.code) + 1;
      const s = standing(l, x.code)!;
      return pos !== s.rank && s.lower * 4 < s.of;
    });
    expect(q1, "a tied page in the lowest quarter exists").toBeDefined();
    const l1 = rows(q1!.category, "moderate");
    const o1 = [...l1].sort((a, b) => b.value - a.value);
    const pos1 = o1.findIndex((r) => r.code === q1!.code) + 1;
    const staleLow = { ...q1!.ctx, rank: pos1, statesHigher: pos1 - 1, statesLower: q1!.ctx.rankedOutOf - pos1 };
    expect(checkRank(q1!, rankSentence(staleLow, q1!.label)).join(" ")).toMatch(/lower median|rank phrase/);
  });
});

describe("K4-a: every other rank, tier and matter-type claim equals the computed relation", () => {
  it("tier ranks, tier window ranks, hourly and hours ranks use the strict rank over the right table", () => {
    const v = collect((p) => {
      const out: string[] = [];
      for (const tier of ["simple", "moderate", "complex"] as Tier[]) {
        const facts = p.ctx.tiers[tier];
        if (!facts) continue;
        const list = rows(p.category, tier);
        const s = standing(list, p.code);
        if (!s) {
          out.push(`${tier}: state absent from the oracle table`);
          continue;
        }
        if (facts.rank !== s.rank) out.push(`${tier}: rank ${facts.rank} but strict ${s.rank}`);
        if (s.of !== p.ctx.rankedOutOf) out.push(`${tier}: ${s.of} ranked states differ from ${p.ctx.rankedOutOf}`);
        for (const w of facts.window) {
          const ws = standing(list, nameToCode.get(w.name)!);
          if (!ws || ws.rank !== w.rank) out.push(`${tier}: window row ${w.name} ranked ${w.rank}, strict ${ws?.rank}`);
        }
      }
      const rated = rows(p.category, "moderate", "hourly");
      const hs = standing(rated, p.code);
      if ((hs?.rank ?? null) !== p.ctx.hourlyRank) out.push(`hourlyRank ${p.ctx.hourlyRank} but strict ${hs?.rank ?? null}`);
      if (hs && hs.of !== p.ctx.rankedOutOf) out.push(`${hs.of} states have an hourly rate but ${p.ctx.rankedOutOf} are ranked`);
      for (const w of p.ctx.rateWindow) {
        const ws = standing(rated, nameToCode.get(w.name)!);
        if (!ws || ws.rank !== w.rank) out.push(`rate window row ${w.name} ranked ${w.rank}, strict ${ws?.rank}`);
      }
      for (const w of p.ctx.peerWindow) {
        const ws = standing(rows(p.category, "moderate"), nameToCode.get(w.name)!);
        if (!ws || ws.rank !== w.rank) out.push(`peer window row ${w.name} ranked ${w.rank}, strict ${ws?.rank}`);
      }
      const hoursRows: Row[] = getCategoryTierFigures(p.category, "moderate")
        .filter((r) => hasUniqueData(r.stateCode, p.category) && r.median > 0 && (r.hourlyMedian ?? 0) > 0)
        .map((r) => ({ code: r.stateCode, value: r.median / r.hourlyMedian! }));
      const hrs = standing(hoursRows, p.code);
      if ((hrs?.rank ?? null) !== p.ctx.hoursRank) out.push(`hoursRank ${p.ctx.hoursRank} but strict ${hrs?.rank ?? null}`);
      return out;
    });
    expect(v).toEqual([]);
  });

  it("percentile is the share of the other states strictly below", () => {
    const v = collect((p) => {
      const s = standing(rows(p.category, "moderate"), p.code)!;
      const expected = s.of > 1 ? Math.round((s.lower / (s.of - 1)) * 100) : 100;
      const out: string[] = [];
      if (p.ctx.percentile !== expected) out.push(`percentile ${p.ctx.percentile} but strict ${expected}`);
      if (!stateShapeSentences(p.ctx, p.label).join(" ").includes(`${ord(expected)} percentile`)) out.push("percentile sentence differs");
      return out;
    });
    expect(v).toEqual([]);
  });

  it("the upper and lower third counts use each matter's own table size", () => {
    const v = collect((p) => {
      let top = 0;
      let bottom = 0;
      let total = 0;
      for (const c of CATEGORIES) {
        const s = standing(rows(c.slug, "moderate"), p.code);
        if (!s) continue;
        total++;
        if (s.higher * 3 < s.of) top++;
        else if (s.lower * 3 < s.of) bottom++;
      }
      const got = p.ctx.matterRankCounts;
      const out: string[] = [];
      if (got.top !== top || got.bottom !== bottom || got.total !== total) {
        out.push(`counts ${got.top}/${got.bottom}/${got.total} but strict ${top}/${bottom}/${total}`);
      }
      const text = stateShapeSentences(p.ctx, p.label).join(" ");
      const tally = text.match(/(\d+) of (\d+) matter types rank .+? in the upper third, (\d+) in the lower, (\d+) between/);
      if (tally && [top, total, bottom, total - top - bottom].join() !== [tally[1], tally[2], tally[3], tally[4]].join()) {
        out.push(`sentence says ${tally[0]}`);
      }
      if (/Every one of the (\d+) matter types/.test(text) !== (top === total && total > 0)) out.push("upper-third claim for every matter is wrong");
      if (/^All \d+ tracked matter types|\. All \d+ tracked matter types/.test(text) !== (bottom === total && total > 0 && top !== total)) {
        out.push("lower-third claim for every matter is wrong");
      }
      return out;
    });
    expect(v).toEqual([]);
  });

  it("the matter-type ranking states each matter's own rank and table size, and ties are not 'under'/'over'", () => {
    const v = collect((p) => {
      const out: string[] = [];
      const cats = CATEGORIES.map((c) => ({ c, median: getModerateMedianCost(p.code, c.slug) ?? 0 })).filter((x) => x.median > 0);
      const own = getModerateMedianCost(p.code, p.category)!;
      const higher = cats.filter((x) => x.median > own).length;
      const lower = cats.filter((x) => x.median < own).length;
      if (p.ctx.categoryRankInState !== higher + 1) out.push(`categoryRankInState ${p.ctx.categoryRankInState} but strict ${higher + 1}`);
      const medianOf = (name: string) => cats.find((x) => x.c.displayName === name)?.median;
      const text = categoryMixSentence(p.ctx, p.label);
      if (text === null) return cats.length < 2 ? out : [...out, "no matter-type sentence"];
      if (/carries the largest median of the (\d+)/.test(text) !== (higher === 0 && !!p.ctx.categoryBelow)) out.push("largest-median claim wrong");
      if (/records the smallest median/.test(text) !== (higher !== 0 && lower === 0 && !!p.ctx.categoryAbove)) out.push("smallest-median claim wrong");
      const stated = text.match(/(\d+)(?:st|nd|rd|th) of (\d+)(?: in| at)/);
      if (stated && (Number(stated[1]) !== higher + 1 || Number(stated[2]) !== cats.length)) out.push(`rank phrase ${stated[0]} but strict ${higher + 1} of ${cats.length}`);
      const rel = (word: string, name: string, want: (m: number) => boolean) => {
        const m = text.match(new RegExp(`\\b${word} ([A-Z][A-Za-z /]+?)(?:,|\\.| \\(| on| and|$)`));
        if (m && !want(medianOf(m[1]!) ?? NaN)) out.push(`"${word} ${m[1]}" is not true of ${name}`);
      };
      rel("under", p.category, (m) => m > own);
      rel("over", p.category, (m) => m < own);
      rel("ahead of", p.category, (m) => m < own);
      rel("level with", p.category, (m) => m === own);
      const lowerBelow = text.match(/, below ([A-Z][A-Za-z /]+?) on the line above/);
      if (lowerBelow && !((medianOf(lowerBelow[1]!) ?? NaN) > own)) out.push(`"below ${lowerBelow[1]}" is not true`);
      const between = text.match(/between ([A-Z][A-Za-z /]+?) and ([A-Z][A-Za-z /]+?)\./);
      if (between) {
        if (!((medianOf(between[1]!) ?? NaN) >= own)) out.push(`"between ${between[1]}" is not at or above`);
        if (!((medianOf(between[2]!) ?? NaN) <= own)) out.push(`"and ${between[2]}" is not at or below`);
      }
      return out;
    });
    expect(v).toEqual([]);
  });

  it("the consistency sentence ranks every matter against that matter's own table size", () => {
    const v = collect((p) => {
      const text = consistencySentence(p.ctx, p.label);
      if (!text) return [];
      const out: string[] = [];
      const fractions = CATEGORIES.flatMap((c) => {
        const s = standing(rows(c.slug, "moderate"), p.code);
        return s ? [s.rank / s.of] : [];
      });
      const mentions = [...text.matchAll(/(\d+)(?:st|nd|rd|th) of (\d+) (?:\(|for )/g)].map((m) => Number(m[1]) / Number(m[2]));
      if (mentions[0] !== Math.min(...fractions) || mentions[1] !== Math.max(...fractions)) {
        out.push(`strongest/weakest ${mentions} but the lowest and highest position in their own tables are ${Math.min(...fractions)}/${Math.max(...fractions)}`);
      }
      for (const m of text.matchAll(/(\d+)(?:st|nd|rd|th)(?: of (\d+))? (?:\(|for )([A-Za-z /]+?)(?:\)| but| to|,| —|\s*$)/g)) {
        const c = CATEGORIES.find((x) => x.displayName === m[3]!.trim());
        if (!c) continue;
        const s = standing(rows(c.slug, "moderate"), p.code);
        if (!s) {
          out.push(`${m[3]} is not tracked for this state`);
          continue;
        }
        if (Number(m[1]) !== s.rank) out.push(`${m[0]} but strict rank is ${s.rank}`);
        if (m[2] !== undefined && Number(m[2]) !== s.of) out.push(`${m[0]} but that table has ${s.of} states`);
      }
      return out;
    });
    expect(v).toEqual([]);
  });

  it("the tier neighbor lines say under/over/level truthfully and rank over the tier table", () => {
    const v = collect((p) => {
      const out: string[] = [];
      for (const line of tierNeighborSentences(p.ctx, p.label)) {
        const tier: Tier = /straightforward/.test(line) ? "simple" : /once contested|complex tier/.test(line) ? "complex" : "simple";
        const list = rows(p.category, tier);
        const s = standing(list, p.code)!;
        out.push(...figures(list, line));
        const stated = line.match(/(\d+)(?:st|nd|rd|th) of (\d+)/);
        if (stated && (Number(stated[1]) !== s.rank || Number(stated[2]) !== s.of)) out.push(`${stated[0]} but strict ${s.rank} of ${s.of}`);
        const rel = line.match(new RegExp(`(under|level with) ${NAME_RE} \\(${MONEY}\\) and (over|level with) ${NAME_RE} \\(${MONEY}\\)`));
        if (rel) {
          const a = valueOf(list, rel[2]!)!;
          const b = valueOf(list, rel[5]!)!;
          if ((rel[1] === "under") !== (a > s.value) || (rel[1] === "level with") !== (a === s.value)) out.push(`"${rel[1]} ${rel[2]}" is wrong`);
          if ((rel[4] === "over") !== (b < s.value) || (rel[4] === "level with") !== (b === s.value)) out.push(`"${rel[4]} ${rel[5]}" is wrong`);
        }
        if (/\b(?:under|over) [A-Z]/.test(line) && !rel) out.push(`unrecognised under/over wording: ${line.slice(0, 80)}`);
      }
      return out;
    });
    expect(v).toEqual([]);
  });

  it("tier analysis and trajectory sentences state the strict rank moves", () => {
    const v = collect((p) => {
      const out: string[] = [];
      for (const key2 of ["simple", "complex"] as const) {
        for (const line of tierAnalysisSentences(p.ctx, p.label, key2)) {
          const tier = tierKey[key2]!;
          const list = rows(p.category, tier);
          const s = standing(list, p.code)!;
          const mod = standing(rows(p.category, "moderate"), p.code)!;
          const up = line.match(/(\d+) up on its moderate position/);
          const down = line.match(/(\d+) below its moderate position/);
          const same = /the same place it holds on the headline figure/.test(line);
          if (up && !(s.rank < mod.rank && mod.rank - s.rank === Number(up[1]))) out.push(`"${up[0]}" but ${tier} rank ${s.rank}, moderate ${mod.rank}`);
          if (down && !(s.rank > mod.rank && s.rank - mod.rank === Number(down[1]))) out.push(`"${down[0]}" but ${tier} rank ${s.rank}, moderate ${mod.rank}`);
          if (same && s.rank !== mod.rank) out.push(`"same place" but ${tier} rank ${s.rank}, moderate ${mod.rank}`);
          const stated = line.match(/(\d+)(?:st|nd|rd|th)(?: of (\d+))?/);
          if (stated && (Number(stated[1]) !== s.rank || (stated[2] !== undefined && Number(stated[2]) !== s.of))) out.push(`${stated[0]} but strict ${s.rank} of ${s.of}`);
          const mid = middle(list.map((r) => r.value));
          const over = line.match(new RegExp(`${MONEY} \\(\\d+%\\) over the`));
          const under = line.match(new RegExp(`${MONEY} \\(\\d+%\\) under the`));
          if (over && !(s.value > mid && money(over[1]!) === s.value - mid)) out.push("over-midpoint claim is wrong");
          if (under && !(s.value < mid && money(under[1]!) === mid - s.value)) out.push("under-midpoint claim is wrong");
          out.push(...figures(list, line));
          const both = line.match(new RegExp(`^${NAME_RE} and ${NAME_RE} both record ${MONEY}`));
          if (both && !(valueOf(list, both[1]!) === s.value && valueOf(list, both[2]!) === s.value)) out.push("both-record claim is wrong");
        }
      }
      const t = trajectorySentence(p.ctx, p.label);
      if (t) {
        const ranks = [...t.matchAll(/(\d+)(?:st|nd|rd|th) at the (simple|moderate|complex) tier|(\d+)(?:st|nd|rd|th) at (moderate|complex)/g)];
        for (const r of ranks) {
          const tier = (r[2] ?? r[4]) as Tier;
          const s = standing(rows(p.category, tier), p.code)!;
          if (Number(r[1] ?? r[3]) !== s.rank) out.push(`trajectory ${r[0]} but strict ${s.rank}`);
        }
        const shift = t.match(/(climbs|a fall of|slides|a) (\d+)[- ]place/);
        if (shift) {
          const sS = standing(rows(p.category, "simple"), p.code)!.rank;
          const cS = standing(rows(p.category, "complex"), p.code)!.rank;
          if (Number(shift[2]) !== Math.abs(sS - cS)) out.push(`trajectory shift ${shift[0]} but strict ${Math.abs(sS - cS)}`);
        }
      }
      return out;
    });
    expect(v).toEqual([]);
  });

  it("hourly, hours and rate-table sentences rank over the rated table with the right size", () => {
    const v = collect((p) => {
      const out: string[] = [];
      const rated = rows(p.category, "moderate", "hourly");
      const hs = standing(rated, p.code);
      const cost = standing(rows(p.category, "moderate"), p.code)!;
      const hp = hourlyPositionSentence(p.ctx, p.label);
      if (hp && hs) {
        const ofs = [...hp.matchAll(/\d+(?:st|nd|rd|th) of (\d+)/g)].map((m) => Number(m[1]));
        if (ofs.some((n) => n !== hs.of)) out.push(`hourly sentence denominators ${ofs} but ${hs.of} states have a rate`);
        const nums = [...hp.matchAll(/(\d+)(?:st|nd|rd|th)/g)].map((m) => Number(m[1]));
        if (nums.some((n) => n !== hs.rank && n !== cost.rank)) out.push(`hourly sentence ranks ${nums} not in {${hs.rank}, ${cost.rank}}`);
        const gap = Math.abs(cost.rank - hs.rank);
        const places = [...hp.matchAll(/(\d+) places?/g)].map((m) => Number(m[1]));
        if (places.some((n) => n !== gap)) out.push(`hourly sentence gap ${places} but strict gap ${gap}`);
      }
      const hr = hoursRankSentence(p.ctx, p.label);
      if (hr) {
        const ofs = [...hr.matchAll(/\d+(?:st|nd|rd|th) of (\d+)/g)].map((m) => Number(m[1]));
        if (ofs.some((n) => n !== rated.length)) out.push(`hours sentence denominators ${ofs} but ${rated.length} states have a rate`);
      }
      const lines = rateGroupSentences(p.ctx, p.label).join(" ");
      const own = hs?.value;
      if (/No tracked state records a lower median rate/.test(lines) && rated.some((r) => r.value < own!)) out.push("says no state has a lower rate");
      if (/is the highest of the tracked states/.test(lines) && rated.some((r) => r.value > own!)) out.push("says the rate is the highest");
      const sameGroups = [
        ...lines.matchAll(new RegExp(`((?:${NAME_RE}(?:, )?)+) (?:records|record) the same`, "g")),
        ...lines.matchAll(/record exactly \$[\d,]+ — (.+?) among them/g),
      ];
      for (const g of sameGroups) {
        for (const n of g[1]!.matchAll(new RegExp(NAME_RE, "g"))) {
          if (valueOf(rated, n[1]!) !== own) out.push(`${n[1]} does not record the same rate`);
        }
      }
      return out;
    });
    expect(v).toEqual([]);
  });

  it("sensitivity, movement and cluster sentences describe ties and counts as the data has them", () => {
    const v = collect((p) => {
      const out: string[] = [];
      const list = rows(p.category, "moderate");
      const s = standing(list, p.code)!;
      const equalOthers = list.filter((r) => r.value === s.value && r.code !== p.code).length;
      const text = sensitivitySentence(p.ctx, p.label);
      if (text) {
        if (/tie-break/.test(text) !== (equalOthers > 0)) out.push(`tie-break claim is ${/tie-break/.test(text)} with ${equalOthers} equal states`);
        const up = list.filter((r) => r.value > s.value && r.value <= s.value * 1.1).length;
        const down = list.filter((r) => r.value < s.value && r.value >= s.value * 0.9).length;
        for (const m of text.matchAll(/(?<![\d,$])(\d+) (?:states? )?above|(?<![\d,$])(\d+) up\b/g)) {
          const n = Number(m[1] ?? m[2]);
          if (n !== up) out.push(`"${m[0]}" but ${up} states are within ten percent above`);
        }
        for (const m of text.matchAll(/(?<![\d,$])(\d+) (?:states? )?below|(?<![\d,$])(\d+) down\b/g)) {
          const n = Number(m[1] ?? m[2]);
          if (n !== down) out.push(`"${m[0]}" but ${down} states are within ten percent below`);
        }
      }
      const move = movementSentences(p.ctx, p.label).join(" ");
      const climbing = move.match(/Climbing \w+ places? would mean passing (.+?)(?: and adding (\$[\d,]+) to the|, which (?:all record|records) the same)/);
      if (climbing) {
        const values = [...climbing[1]!.matchAll(new RegExp(NAME_RE, "g"))].map((n) => valueOf(list, n[1]!)!);
        if (values.some((x) => x < s.value)) out.push("a state named as passed from below records less");
        if (climbing[2] !== undefined && money(climbing[2]) !== Math.max(...values) - s.value) out.push("climb distance is wrong");
        if (climbing[2] === undefined && values.some((x) => x !== s.value)) out.push("'all record the same' is false above");
      }
      const falling = move.match(/[A-Z][a-z]+ places? down means passing (?:under )?(.+?)(?:: (\$[\d,]+)|, which (?:all record|records) the same)/);
      if (falling) {
        const values = [...falling[1]!.matchAll(new RegExp(NAME_RE, "g"))].map((n) => valueOf(list, n[1]!)!);
        if (values.some((x) => x > s.value)) out.push("a state named as passed under records more");
        if (falling[2] !== undefined && money(falling[2]) !== s.value - Math.min(...values)) out.push("drop distance is wrong");
        if (falling[2] === undefined && values.some((x) => x !== s.value)) out.push("'all record the same' is false below");
      }
      if (/There is nothing above/.test(move) !== (s.higher === 0 && !climbing)) out.push("nothing-above claim does not follow the strict count");
      if (/There is nothing below/.test(move) !== (s.lower === 0 && !falling)) out.push("nothing-below claim does not follow the strict count");
      const topEnds = move.match(new RegExp(`(?:short of|Level with) ${NAME_RE} \\(${MONEY}\\), (?:level with|${MONEY} clear of) ${NAME_RE} \\(${MONEY}\\)`));
      if (topEnds) {
        if (valueOf(list, topEnds[1]!) !== Math.max(...list.map((r) => r.value))) out.push("top of the table is not the highest");
        if (valueOf(list, topEnds[4]!) !== Math.min(...list.map((r) => r.value))) out.push("bottom of the table is not the lowest");
      }
      const members = clusterSentence(p.ctx, p.label) ?? "";
      const near = list.filter((r) => r.code !== p.code && Math.abs(r.value - s.value) / s.value <= 0.03).length;
      const listed = members.match(/^(.+?) record medians within/);
      const claimed = /^(\d+) tracked states/.test(members)
        ? Number(members.match(/^(\d+)/)![1])
        : /Only one other/.test(members)
          ? 1
          : /there is no other/.test(members)
            ? 0
            : listed
              ? [...listed[1]!.matchAll(new RegExp(NAME_RE, "g"))].length
              : null;
      if (claimed === null || claimed !== near) out.push(`cluster claims ${claimed} but ${near} states are within three percent`);
      for (const n of members.slice(0, Math.max(0, members.indexOf("record"))).matchAll(new RegExp(NAME_RE, "g"))) {
        const v2 = valueOf(list, n[1]!);
        if (n[1] !== p.state && v2 !== undefined && Math.abs(v2 - s.value) / s.value > 0.03) out.push(`${n[1]} is named in the cluster but is not within three percent`);
      }
      for (const key2 of ["simple", "complex"] as const) {
        const tl = tierClusterSentence(p.ctx, key2);
        const tierList = rows(p.category, tierKey[key2]!);
        const ts = standing(tierList, p.code)!;
        const tnear = tierList.filter((r) => r.code !== p.code && Math.abs(r.value - ts.value) / ts.value <= 0.03).length;
        const claimed = tl?.match(/^(\d+) states? (?:records?|sits?|sit)/)?.[1];
        if (claimed !== undefined && Number(claimed) !== tnear) out.push(`${key2} cluster claims ${claimed} but ${tnear}`);
        if (tl && /Nothing else sits within three percent/.test(tl) && tnear !== 0) out.push(`${key2} cluster claims none but ${tnear}`);
      }
      return out;
    });
    expect(v).toEqual([]);
  });

  it("the tier tables have as many states as the moderate table and the rate table has the same states", () => {
    const v = collect((p) => {
      const out: string[] = [];
      for (const tier of ["simple", "complex"] as Tier[]) {
        const n = rows(p.category, tier).length;
        if (p.ctx.tiers[tier] && n !== p.ctx.rankedOutOf) out.push(`${tier} table has ${n} states, moderate ${p.ctx.rankedOutOf}`);
      }
      return out;
    });
    expect(v).toEqual([]);
  });
});

describe("K4-a: the answer paragraph and the benchmark sentence describe the figure they print", () => {
  it("the opening of the answer paragraph calls the headline figure a median, never an average", async () => {
    const out: string[] = [];
    for (const page of INDEXABLE_PAGES) {
      const costs = await getCostForPage(page.category.slug, page.state.code);
      const moderate = costs.find((c) => c.complexity === "moderate");
      const block = buildAnswerBlock({ category: page.category, state: page.state, costs, dateRecord: null });
      if (!moderate) continue;
      const figure = usd(moderate.costRange.median);
      if (!block.answer.includes(figure)) out.push(`${page.path}: ${figure} missing from the answer paragraph`);
      if (/\baverage\b/i.test(block.answer)) out.push(`${page.path}: answer paragraph says average for a median`);
      if (moderate.hourlyRate.median > 0 && !new RegExp(`median cost of ${figure.replace("$", "\\$")}`).test(block.answer)) {
        out.push(`${page.path}: opening does not call ${figure} the median cost`);
      }
    }
    expect(out).toEqual([]);
  });

  it("the benchmark sentence states the strict direction, percentage and population against the average of the state medians", () => {
    const out: string[] = [];
    for (const page of INDEXABLE_PAGES) {
      const list = rows(page.category.slug, "moderate");
      const own = standing(list, page.state.code)!.value;
      const mean = list.reduce((sum, r) => sum + r.value, 0) / list.length;
      const text = buildBenchmarkSynthesis({
        categoryDisplayName: page.category.displayName,
        stateName: page.state.name,
        localMedian: getModerateMedianCost(page.state.code, page.category.slug),
        nationalAverage: getNationalAverage(page.category.slug),
        stateCount: getNationalAverageStateCount(page.category.slug),
      });
      if (!text) {
        out.push(`${page.path}: no benchmark sentence`);
        continue;
      }
      const ratio = (own - mean) / mean;
      const pct = Math.round(Math.abs(ratio) * 100);
      const want = pct < 3 ? "in line with" : ratio > 0 ? `${pct}% above` : `${pct}% below`;
      if (!text.includes(want)) out.push(`${page.path}: expected "${want}" in "${text}"`);
      if (!text.includes(usd(mean))) out.push(`${page.path}: average ${usd(mean)} missing`);
      if (!text.includes(`across ${list.length} states with estimates`)) out.push(`${page.path}: population ${list.length} missing`);
    }
    expect(out).toEqual([]);
  });
});
