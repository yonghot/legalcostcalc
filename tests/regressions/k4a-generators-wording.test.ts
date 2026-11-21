import { describe, expect, it } from "vitest";
import {
  bandSentence,
  calibrationSentence,
  escalationSentence,
  extraCalculations,
  overlapSentence,
  premiumSentence,
  type CalculationBlock,
} from "@/lib/seo/state-context";
import { CATEGORIES } from "@/lib/constants/categories";
import {
  PAGES,
  amounts,
  collect,
  impliedHours,
  middle,
  money,
  monthsOf,
  seedRow,
  seedTable,
  tierRow,
  usd,
  type Page,
} from "./helpers/k4a-oracle";

/*
 * K4-a EXTENSION (continued): escalation, overlap, band, calibration, extra calculations and premium sentences.
 * Every relation a sentence states is recomputed from the seed rows, never by calling the function under test.
 */

/* ------------------------------------------------------------------ escalationSentence */

function checkEscalation(p: Page, text: string | null): string[] {
  const s = tierRow(p, "simple");
  const c = tierRow(p, "complex");
  const sH = s ? impliedHours(s) : null;
  const cH = c ? impliedHours(c) : null;
  if (!s || !c || !sH || !cH || s.median <= 0) return text === null ? [] : ["a sentence exists without both tiers' hours"];
  if (text === null) return ["no escalation sentence although both tiers have hours"];
  const v: string[] = [];
  const hm = Math.round((cH / sH) * 10) / 10;
  const rm = Math.round((c.rate / s.rate) * 100) / 100;
  const cm = Math.round((c.median / s.median) * 10) / 10;
  if (!text.includes(`${sH} hours at ${usd(s.rate)} becomes ${cH} hours at ${usd(c.rate)}`)) v.push("the hours-and-rate arithmetic is not the seed's");
  for (const [name, n] of [["cost multiple", cm], ["hours multiple", hm], ["rate multiple", rm]] as const) {
    if (!new RegExp(`(?<![\\d.])${String(n).replace(".", "\\.")}x`).test(text)) v.push(`${name} ${n}x missing`);
  }
  const branch = /multiplies the .+ total by .+x: /.test(text)
    ? "a"
    : /comes with .+x the implied hours and /.test(text)
      ? "b"
      : /The implied hours are .+x and the rate is /.test(text)
        ? "c"
        : /the implied workload rises under 3\.9x/.test(text)
          ? "d"
          : "?";
  const want = hm >= 5 ? "a" : hm >= 4.4 ? "b" : hm >= 3.9 ? "c" : "d";
  if (branch !== want) v.push(`branch ${branch} but ${hm}x hours selects ${want}`);
  if (/breaks down as|Decomposed|so the workload grows/.test(text)) v.push("claims the cost multiple is the product of the rounded hours and rate multiples");
  if (/most of that is hours|Hours (?:still )?carry the larger part/.test(text)) v.push(`keeps a share claim the data does not decide: ${hm}x hours against ${rm}x rate`);
  if (/almost all|not a premium hourly rate|unusually large share|senior-rate|comparatively shallow|more billed time|a higher rate:/.test(text)) {
    v.push("keeps a comparative or ratio claim the data does not support");
  }
  return v;
}

/* ------------------------------------------------------------------ overlapSentence */

function checkOverlap(p: Page, text: string | null): string[] {
  const s = tierRow(p, "simple");
  const m = tierRow(p, "moderate")!;
  const c = tierRow(p, "complex");
  if (!s || !c) return text === null ? [] : ["a sentence exists without both outer tiers"];
  if (text === null) return ["no overlap sentence"];
  const v: string[] = [];
  const ov1 = s.high >= m.low;
  const ov2 = m.high >= c.low;
  const got = amounts(text);
  const same = (want: number[]) => want.length === got.length && want.every((n, i) => n === got[i]);
  if (ov1 && ov2) {
    if (!/The three bands are continuous/.test(text)) v.push("both pairs touch but the bands are not called continuous");
    if (!same([s.high, m.low, m.high, c.low])) v.push(`figures ${got.map(usd)} differ from the simple ceiling, moderate floor, moderate ceiling and complex floor`);
  } else if (ov1) {
    if (!/The lower two bands run into each other/.test(text)) v.push("simple and moderate touch but the sentence does not say so");
    if (!same([s.high, m.low, c.low - m.high, m.high, c.low])) v.push(`figures ${got.map(usd)} differ from the expected gap and bounds`);
    if (!(c.low - m.high > 0)) v.push("a clear gap is claimed above the moderate ceiling but there is none");
  } else if (ov2) {
    if (!/separates the simple ceiling/.test(text)) v.push("moderate and complex touch but the first break is not described");
    if (!same([m.low - s.high, s.high, m.low, c.low])) v.push(`figures ${got.map(usd)} differ from the expected gap and bounds`);
    if (!(m.low - s.high > 0)) v.push("a clean break is claimed but the bands touch");
  } else {
    if (!/Neither pair of adjacent bands touches/.test(text)) v.push("no pair touches but the sentence does not say so");
    if (!same([m.low - s.high, c.low - m.high])) v.push(`figures ${got.map(usd)} differ from the two gaps`);
    if (!(s.high < c.low)) v.push("claims one tier per estimate although the outer tiers overlap");
  }
  if (/maps to exactly one tier|clean break|a step, not a slope|the same money|can therefore belong|unusually informative/.test(text)) v.push("keeps a consequence the band figures do not decide");
  return v;
}

/* ------------------------------------------------------------------ bandSentence */

function checkBand(p: Page, text: string | null): string[] {
  const m = tierRow(p, "moderate")!;
  const width = m.high - m.low;
  if (width <= 0) return text === null ? [] : ["a sentence exists for a band with no width"];
  if (text === null) return ["no band sentence"];
  const v: string[] = [];
  const table = seedTable(p.category, "moderate");
  const widths = table.map((r) => Math.max(0, r.high - r.low));
  const peer = middle(widths);
  const delta = width - peer;
  const got = amounts(text);
  const said = /, the same as the peer-median band of/.test(text)
    ? "same"
    : /which is \$[\d,]+ wider than the peer-median band of/.test(text)
      ? "wider"
      : /which is \$[\d,]+ narrower than the peer-median band of/.test(text)
        ? "narrower"
        : "none";
  const want = peer <= 0 ? "none" : delta === 0 ? "same" : delta > 0 ? "wider" : "narrower";
  if (said !== want) v.push(`says ${said} but the band is ${usd(width)} against a peer median of ${usd(peer)}`);
  if (/ is wide:|close to the|cluster|tightly/.test(text)) v.push("keeps a verdict on the width");
  const expected = want === "none" ? [m.low, m.high, width] : want === "same" ? [m.low, m.high, width, peer] : [m.low, m.high, width, Math.abs(delta), peer];
  if (!expected.every((n, i) => got[i] === n)) v.push(`figures ${got.slice(0, expected.length).map(usd)} differ from ${expected.map(usd)}`);
  const extra = m.rate > 0 ? Math.round(width / m.rate) : 0;
  const end = text.match(/End to end that is (\d+) hours? at (\$[\d,]+)\./);
  if (!!end !== extra > 0) v.push(`hours clause is ${!!end} with ${extra} end-to-end hours`);
  if (end && (Number(end[1]) !== extra || money(end[2]!) !== m.rate)) v.push(`end to end is ${extra} hours at ${usd(m.rate)}, not ${end[0]}`);
  if (/\b1 hours\b/.test(text)) v.push("1 hours");
  if (/than in most tracked states/.test(text)) {
    const wider = table.filter((r) => r.code !== p.code && r.high - r.low > width).length;
    if (!(wider > (table.length - 1) / 2)) v.push(`says most tracked states are looser but only ${wider} of ${table.length - 1} have a wider band`);
  }
  return v;
}

/* ------------------------------------------------------------------ calibrationSentence */

function checkCalibration(p: Page, text: string | null): string[] {
  const m = tierRow(p, "moderate")!;
  if (!m.rate || m.high <= m.low) return text === null ? [] : ["a sentence exists without a rate or a band"];
  if (text === null) return ["no calibration sentence"];
  const v: string[] = [];
  const peer = middle(seedTable(p.category, "moderate").map((r) => r.median));
  const position = Math.round(((peer - m.low) / (m.high - m.low)) * 100);
  const hoursAtPeer = Math.round(peer / m.rate);
  const hoursGap = Math.abs((impliedHours(m) ?? 0) - hoursAtPeer);
  const below = /falls below the .+ floor of the .+ band entirely/.test(text);
  const above = /sits above the .+ ceiling estimated for/.test(text);
  if (below !== position < 0) v.push(`"below the floor" is ${below} at position ${position}%`);
  if (above !== position > 100) v.push(`"above the ceiling" is ${above} at position ${position}%`);
  if (below && !(peer < m.low)) v.push("midpoint is called below the floor but is not");
  if (above && !(peer > m.high)) v.push("midpoint is called above the ceiling but is not");
  if (!below && !above) {
    const main = text.match(/^(\d+)% up the (\$[\d,]+)–(\$[\d,]+) band sits the (\$[\d,]+) table midpoint, buying (\d+) hours at (\$[\d,]+) against the (\d+) the local .+ median implies — (the same number of hours|(\d+) hours? apart)\.$/);
    if (!main) return [...v, `unrecognised calibration sentence: ${text.slice(0, 90)}`];
    if (Number(main[1]) !== position || money(main[2]!) !== m.low || money(main[3]!) !== m.high || money(main[4]!) !== peer) v.push("position or band figures wrong");
    if (Number(main[5]) !== hoursAtPeer || money(main[6]!) !== m.rate || Number(main[7]) !== impliedHours(m)) v.push("hours or rate wrong");
    if (main[8]!.startsWith("the same") ? hoursGap !== 0 : Number(main[9]) !== hoursGap || hoursGap === 0) v.push("hours apart is wrong");
  }
  return v;
}

/* ------------------------------------------------------------------ extraCalculations */

function checkExtra(p: Page, blocks: CalculationBlock[]): string[] {
  const s = tierRow(p, "simple");
  const m = tierRow(p, "moderate")!;
  const c = tierRow(p, "complex");
  const v: string[] = [];
  const months = monthsOf(m.duration);
  const both = blocks.find((b) => b.lead === "Both ends, in time.");
  if (!!both !== (m.rate > 0 && months !== null && months > 0)) v.push("the both-ends block does not follow the rate and the parsable duration");
  if (both && months) {
    const lowH = Math.round(m.low / m.rate);
    const highH = Math.round(m.high / m.rate);
    const want = `${usd(m.low)} is ${lowH} hours at ${usd(m.rate)}; ${usd(m.high)} is ${highH}. Over the ${m.duration} assumed for a moderate ${p.label}, that is ${Math.round(lowH / months)} to ${Math.round(highH / months)} hours a month.`;
    if (both.body !== want) v.push(`both-ends block differs from: ${want}`);
    if (/continuous work|occasional file review/.test(both.body)) v.push("keeps an evaluative claim the hours do not support");
  }
  const sH = s ? impliedHours(s) : null;
  const cH = c ? impliedHours(c) : null;
  const versus = blocks.find((b) => b.lead === "Complex tier against simple tier.");
  if (!!versus !== !!(s && c && s.median > 0 && sH && cH)) v.push("the complex-against-simple block does not follow the tiers' hours");
  if (versus && s && c && sH && cH) {
    const count = Math.round((c.median / s.median) * 10) / 10;
    const factor = Math.round((cH / sH) * 10) / 10;
    if (!versus.body.includes(`${usd(c.median)} buys ${count} matters at the ${usd(s.median)} simple median`)) v.push("matters count differs from complex / simple");
    if (!versus.body.includes(`${cH} implied hours against ${sH}, a factor of ${factor}`)) v.push("hours factor differs from complex / simple hours");
    if (/the two ratios differing|because the rate rises/.test(versus.body)) v.push(`keeps a causal tail at ${count} against ${factor}`);
  }
  return v;
}

/* ------------------------------------------------------------------ premiumSentence */

function premiumOracle(p: Page) {
  return CATEGORIES.flatMap((c) => {
    const own = seedRow(c.slug, "moderate", p.code)?.median ?? 0;
    if (own <= 0) return [];
    const mid = middle(seedTable(c.slug, "moderate").map((r) => r.median));
    if (!mid) return [];
    return [{ name: c.displayName, percent: Math.round(((own - mid) / mid) * 100), exact: (own - mid) / mid }];
  });
}

function checkPremium(p: Page, text: string | null): string[] {
  const entries = premiumOracle(p);
  if (entries.length < 2) return text === null ? [] : ["a sentence exists with fewer than two matter types"];
  if (text === null) return ["no premium sentence"];
  const v: string[] = [];
  const hi = Math.max(...entries.map((e) => e.percent));
  const lo = Math.min(...entries.map((e) => e.percent));
  const spread = hi - lo;
  const described = [...text.matchAll(/([A-Z][A-Za-z /]+?) (runs (\d+)% (above|below) its own midpoint|sits within a percent of its own midpoint)/g)];
  if (described.length !== 2) return [...v, `${described.length} described matter types`];
  const percentOf = (m: RegExpMatchArray) => (m[3] === undefined ? 0 : m[4] === "above" ? Number(m[3]) : -Number(m[3]));
  for (const [i, want] of [hi, lo].entries()) {
    const m = described[i]!;
    const entry = entries.find((e) => e.name === m[1]);
    if (!entry) v.push(`${m[1]} is not a tracked matter type`);
    else {
      if (entry.percent !== percentOf(m)) v.push(`${m[1]} stated at ${percentOf(m)}% but is ${entry.percent}%`);
      if (m[3] === undefined && !(Math.abs(entry.exact) < 0.005)) v.push(`${m[1]} is called within a percent of its midpoint but is ${(entry.exact * 100).toFixed(2)}% away`);
    }
    if (percentOf(m) !== want) v.push(`${i === 0 ? "highest" : "lowest"} premium stated ${percentOf(m)}% but the ${i === 0 ? "maximum" : "minimum"} is ${want}%`);
  }
  if (!text.startsWith("Measured against each matter's own midpoint, ")) v.push("does not name the metric the premiums are measured in");
  if (/close to uniform|not equally priced|spread across practice areas is wide|Whatever drives/.test(text)) v.push(`keeps a verdict on a ${spread}-point spread`);
  const stated = text.match(/only (\d+) percentage points apart|a (\d+)-point spread|(\d+) percentage points apart/);
  if (!stated || Number(stated[1] ?? stated[2] ?? stated[3]) !== spread) v.push(`spread stated ${stated?.[0]} but is ${spread}`);
  const wrongForOne = /Some tracked matter types run above their own midpoint here and others run below\./.test(text);
  if (/would be wrong for at least one|is expensive|is inexpensive/.test(text)) v.push("keeps a verdict on whether the state is expensive");
  const allAbove = /Every tracked matter type runs above its own midpoint/.test(text);
  const allBelow = /Every tracked matter type runs below its own midpoint/.test(text);
  if (wrongForOne !== (hi > 0 && lo < 0)) v.push(`"some above, some below" is ${wrongForOne} with premiums from ${lo}% to ${hi}%`);
  if (allAbove !== (!(hi > 0 && lo < 0) && lo > 0)) v.push(`"every matter type above its midpoint" is ${allAbove} with a lowest premium of ${lo}%`);
  if (allBelow !== (!(hi > 0 && lo < 0) && !(lo > 0) && hi < 0)) v.push(`"every matter type below its midpoint" is ${allBelow} with a highest premium of ${hi}%`);
  return v;
}

describe("K4-a extension: escalation, overlap, band, calibration and extra calculations equal the seed", () => {
  it("escalationSentence states the multiples it computes and no ranking the data does not give (every page)", () => {
    expect(collect((p) => checkEscalation(p, escalationSentence(p.ctx, p.label)))).toEqual([]);
  });

  it("overlapSentence names the band relation that the figures have (every page)", () => {
    expect(collect((p) => checkOverlap(p, overlapSentence(p.ctx)))).toEqual([]);
  });

  it("bandSentence states the width, the peer comparison and the hours it implies (every page)", () => {
    expect(collect((p) => checkBand(p, bandSentence(p.ctx)))).toEqual([]);
  });

  it("calibrationSentence positions the midpoint inside, below or above the band as the figures do (every page)", () => {
    expect(collect((p) => checkCalibration(p, calibrationSentence(p.ctx, p.label)))).toEqual([]);
  });

  it("extraCalculations states the hours, per-month hours and ratios it computes (every page)", () => {
    expect(collect((p) => checkExtra(p, extraCalculations(p.ctx, p.label)))).toEqual([]);
  });

  it("every branch of these generators occurs, so none of the checks is vacuous", () => {
    const seen = new Map<string, number>();
    const hit = (name: string, text: string | null | undefined, re: RegExp) => {
      if (text && re.test(text)) seen.set(name, (seen.get(name) ?? 0) + 1);
    };
    for (const p of PAGES) {
      const esc = escalationSentence(p.ctx, p.label);
      hit("escalation a", esc, /multiplies the .+ total by/);
      hit("escalation b", esc, /comes with .+x the implied hours and /);
      hit("escalation c", esc, /The implied hours are .+x and the rate is /);
      hit("escalation d", esc, /rises under 3\.9x/);
      const ov = overlapSentence(p.ctx);
      hit("overlap both", ov, /continuous/);
      hit("overlap lower", ov, /lower two bands/);
      hit("overlap upper", ov, /separates the simple ceiling/);
      hit("overlap neither", ov, /Neither pair/);
      const band = bandSentence(p.ctx);
      hit("band wider", band, /wider than the peer-median/);
      hit("band narrower", band, /narrower than the peer-median/);
      hit("band hours", band, /End to end/);
      hit("calibration inside", calibrationSentence(p.ctx, p.label), /% up the/);
      const extra = extraCalculations(p.ctx, p.label).map((b) => b.body).join(" ");
      hit("extra both ends", extra, /hours a month/);
      hit("extra versus", extra, /a factor of/);
    }
    const required = [
      "escalation a", "escalation b", "escalation c", "escalation d", "overlap both", "overlap lower", "overlap upper", "overlap neither",
      "band wider", "band narrower", "band hours", "calibration inside", "extra both ends", "extra versus",
    ];
    expect(required.filter((name) => !seen.get(name))).toEqual([]);
  });

  it("positive control: the checkers flag the earlier escalation, extra-calculation and ratio wording", () => {
    const find = (check: (p: Page) => boolean) => PAGES.find(check)!;

    const shallow = find((p) => escalationSentence(p.ctx, p.label)?.includes("under 3.9x") ?? false);
    expect(shallow).toBeDefined();
    const escText = escalationSentence(shallow.ctx, shallow.label)!;
    expect(checkEscalation(shallow, escText)).toEqual([]);
    expect(checkEscalation(shallow, `${escText} The senior-rate premium carries an unusually large share of the increase.`).join(" ")).toMatch(/comparative or ratio claim/);

    const extraPage = find((p) => extraCalculations(p.ctx, p.label).some((b) => b.lead === "Both ends, in time."));
    const swapped = extraCalculations(extraPage.ctx, extraPage.label).map((b) => ({
      ...b,
      body: b.body.replace(/hours a month\./, "hours a month — the difference between an occasional file review and continuous work."),
    }));
    expect(checkExtra(extraPage, swapped).join(" ")).toMatch(/both-ends block differs/);
  });
});

describe("K4-a extension: premiumSentence states spreads and claims the premiums have", () => {
  it("highest, lowest, spread and the closing claim equal the recomputed premiums (every page)", () => {
    expect(collect((p) => checkPremium(p, premiumSentence(p.ctx)))).toEqual([]);
  });

  it("every closing relation occurs, including one for a spread that stays on one side of the midpoint", () => {
    const seen = new Map<string, number>();
    for (const p of PAGES) {
      const text = premiumSentence(p.ctx);
      const hit = (name: string, re: RegExp) => text && re.test(text) && seen.set(name, (seen.get(name) ?? 0) + 1);
      hit("straddles", /Some tracked matter types run above their own midpoint here and others run below/);
      hit("all above", /Every tracked matter type runs above/);
      hit("all below", /Every tracked matter type runs below/);
      hit("within a percent", /sits within a percent of its own midpoint/);
    }
    expect(["straddles", "all above", "all below", "within a percent"].filter((n) => !seen.get(n))).toEqual([]);
  });

  it("positive control: the checker flags the earlier closing claim on a spread that stays above the midpoint", () => {
    const p = PAGES.find((x) => {
      const e = premiumOracle(x);
      return e.length > 1 && Math.min(...e.map((y) => y.percent)) > 0 && Math.max(...e.map((y) => y.percent)) - Math.min(...e.map((y) => y.percent)) > 20;
    })!;
    expect(p).toBeDefined();
    const ok = premiumSentence(p.ctx)!;
    expect(checkPremium(p, ok)).toEqual([]);
    const old = `${ok.replace(/ Every tracked matter type runs above its own midpoint.*$/, "")} Some tracked matter types run above their own midpoint here and others run below.`;
    expect(old).not.toBe(ok);
    expect(checkPremium(p, old).join(" ")).toMatch(/"some above, some below" is true/);
  });
});
