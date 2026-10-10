import { describe, expect, it } from "vitest";
import { calculationBlocks, hoursSentence, type CalculationBlock } from "@/lib/seo/state-context";
import {
  NAME_RE,
  PAGES,
  collect,
  impliedHours,
  middle,
  money,
  monthsOf,
  seedTable,
  tierRow,
  usd,
  valueOfName,
  type Page,
} from "./helpers/k4a-oracle";

/*
 * K4-a EXTENSION: the ten state x matter prose generators that the first property file did not import.
 * Every relation a sentence states is recomputed here from the seed rows, never by calling the function under test.
 */

function peerStats(p: Page) {
  const table = seedTable(p.category, "moderate").filter((r) => r.rate > 0);
  return {
    hours: middle(table.map((r) => Math.round(r.median / r.rate))),
    rate: middle(table.map((r) => r.rate)),
  };
}

function checkHours(p: Page, text: string | null): string[] {
  const own = tierRow(p, "moderate")!;
  const h = impliedHours(own);
  if (!h) return text === null ? [] : ["a sentence exists although the page has no implied hours"];
  if (text === null) return ["no hours sentence although a rate and implied hours exist"];
  const v: string[] = [];
  const peer = peerStats(p);
  const first = text.match(/(?:about|roughly) (\d+)(?: billable)? hours?\b/);
  if (!first || Number(first[1]) !== h) v.push(`states ${first?.[1] ?? "no"} hours but median / rate rounds to ${h}`);
  if (!text.includes(usd(own.median)) || !text.includes(usd(own.rate))) v.push("median or rate missing");
  if (/\b1 hours\b/.test(text)) v.push("1 hours");
  if (/full working week|days of work, not weeks|indistinguishable/.test(text)) v.push(`keeps a duration or similarity verdict the data does not decide at ${h} hours`);
  if (/retainer|flat-fee|limited-scope|tend to|normally staged/.test(text)) v.push("states a billing practice the seed does not contain");
  const added = text.match(/a single added hour moves the total by (\d+)%/);
  if (!!added !== h < 12) v.push(`single-hour claim is ${!!added} at ${h} hours`);
  if (added && Number(added[1]) !== Math.round((100 * own.rate) / own.median)) v.push(`one hour is ${Math.round((100 * own.rate) / own.median)}% of the median, not ${added[1]}%`);

  const peerSaid = text.match(/peer median is (\d+) hours/);
  const more = text.match(/(\d+) more hours? of work sits? behind/);
  const fewer = text.match(/in (\d+) fewer implied hours?/);
  const same = text.match(/rounds to the same (\d+) hours as the peer median/);
  const stated = [more, fewer, same].filter(Boolean).length;
  if (stated !== 1) v.push(`${stated} comparison clauses`);
  if (more && !(h > peer.hours && Number(more[1]) === h - peer.hours)) v.push(`says ${more[1]} more but ${h} against peer ${peer.hours}`);
  if (fewer && !(h < peer.hours && Number(fewer[1]) === peer.hours - h)) v.push(`says ${fewer[1]} fewer but ${h} against peer ${peer.hours}`);
  if (same && !(h === peer.hours && Number(same[1]) === peer.hours)) v.push(`says the same ${same[1]} hours but ${h} against peer ${peer.hours}`);
  if (!more && !fewer && !same) v.push("no comparison with the peer median");
  if ((more || fewer) && Number(peerSaid?.[1]) !== peer.hours) v.push(`peer median stated ${peerSaid?.[1]} but is ${peer.hours}`);
  if (h > peer.hours && !more) v.push("above the peer median without saying so");
  if (h < peer.hours && !fewer) v.push("below the peer median without saying so");

  if (/because|carries more of it|rather than the workload/.test(text)) v.push("states a cause for the hours the data cannot decide");
  const rateClause = text.match(/in \d+ fewer implied hours?, at (\$[\d,]+) an hour against a (\$[\d,]+) peer median\./);
  if (fewer && (!rateClause || money(rateClause[1]!) !== own.rate || money(rateClause[2]!) !== peer.rate)) {
    v.push(`fewer hours without the two rates it rests on: ${usd(own.rate)} against peer ${usd(peer.rate)}`);
  }
  if (!fewer && /an hour against a/.test(text)) v.push("a rate comparison outside the fewer-hours branch");
  return v;
}

describe("K4-a extension: hoursSentence states the hours and the two rates and no cause", () => {
  it("covers every page, and every comparison branch occurs (non-vacuous)", () => {
    expect(PAGES.length).toBe(369);
    const seen = { more: 0, fewer: 0, same: 0, fewerRateAbove: 0, fewerRateNotAbove: 0 };
    for (const p of PAGES) {
      const h = impliedHours(tierRow(p, "moderate")!);
      if (!h) continue;
      const peer = peerStats(p);
      if (h > peer.hours) seen.more++;
      else if (h === peer.hours) seen.same++;
      else if (tierRow(p, "moderate")!.rate > peer.rate) seen.fewerRateAbove++;
      else seen.fewerRateNotAbove++;
      if (h < peer.hours) seen.fewer++;
    }
    for (const [name, n] of Object.entries(seen)) expect(n, name).toBeGreaterThan(0);
  });

  it("the stated hours, peer comparison and cause equal the recomputed relations on every page", () => {
    expect(collect((p) => checkHours(p, hoursSentence(p.ctx)))).toEqual([]);
  });

  it("positive control: the checker flags the earlier unconditional cause clause", () => {
    const candidate = PAGES.find((p) => {
      const own = tierRow(p, "moderate")!;
      const h = impliedHours(own);
      return !!h && h < peerStats(p).hours && own.rate <= peerStats(p).rate;
    })!;
    expect(candidate).toBeDefined();
    const clean = hoursSentence(candidate.ctx)!;
    expect(checkHours(candidate, clean)).toEqual([]);
    const old = clean.replace(/ peer median\.$/, " peer median, because the rate rather than the workload carries more of it.");
    expect(old).not.toBe(clean);
    expect(checkHours(candidate, old).join(" ")).toMatch(/states a cause for the hours/);
  });
});

/* ------------------------------------------------------------------ calculationBlocks */

function blockBody(blocks: CalculationBlock[], lead: RegExp): string | undefined {
  return blocks.find((b) => lead.test(b.lead))?.body;
}

function checkSimpleBlock(p: Page, body: string | undefined): string[] {
  const s = tierRow(p, "simple");
  const m = tierRow(p, "moderate")!;
  const sH = s ? impliedHours(s) : null;
  const mH = impliedHours(m);
  if (!s || !sH || !mH) return body === undefined ? [] : ["a simple-tier block exists without simple hours"];
  if (body === undefined) return ["no simple-tier block although simple hours exist"];
  const v: string[] = [];
  const hourGap = mH - sH;
  const moneyGap = m.median - s.median;
  const head = body.match(/^(\$[\d,]+) ÷ (\$[\d,]+) = about (\d+) hours/);
  if (!head || money(head[1]!) !== s.median || money(head[2]!) !== s.rate || Number(head[3]) !== sH) {
    v.push(`headline arithmetic is not ${usd(s.median)} ÷ ${usd(s.rate)} = about ${sH} hours`);
  }
  const months = monthsOf(s.duration);
  const perMonth = body.match(/at roughly (\$[\d,]+) a month/);
  if (!!perMonth !== (months !== null && months > 0)) v.push("per-month clause does not follow the parsable duration");
  if (perMonth && months && money(perMonth[1]!) !== Math.round(s.median / months)) v.push(`a month is ${usd(s.median / months)}, not ${perMonth[1]}`);
  if (hourGap <= 0 || moneyGap <= 0) v.push(`tiers do not rise: hour gap ${hourGap}, money gap ${moneyGap}`);
  for (const old of body.matchAll(/(\d+) more hours? at that rate/g)) {
    if (Number(old[1]) !== Math.round(moneyGap / s.rate)) {
      v.push(`says the ${usd(moneyGap)} step is ${old[1]} more hours at ${usd(s.rate)}, but that is ${Math.round(moneyGap / s.rate)}`);
    }
  }
  if (perMonth) {
    const step = body.match(/The (\$[\d,]+) step to the moderate tier takes the implied hours from (\d+) at (\$[\d,]+) to (\d+) at (\$[\d,]+)\./);
    if (!step) v.push("the step to the moderate tier is not stated with its own hours and rates");
    else if (money(step[1]!) !== moneyGap || Number(step[2]) !== sH || money(step[3]!) !== s.rate || Number(step[4]) !== mH || money(step[5]!) !== m.rate) {
      v.push(`step clause ${step[0]} differs from ${usd(moneyGap)}, ${sH} at ${usd(s.rate)} to ${mH} at ${usd(m.rate)}`);
    }
  } else {
    const step = body.match(/— (\d+) fewer than the moderate tier's (\d+), and (\$[\d,]+) less\./);
    if (!step || Number(step[1]) !== hourGap || Number(step[2]) !== mH || money(step[3]!) !== moneyGap) {
      v.push(`fewer-than clause differs from ${hourGap} fewer than ${mH} and ${usd(moneyGap)} less`);
    }
  }
  return v;
}

function checkWorkBlock(p: Page, body: string | undefined): string[] {
  const m = tierRow(p, "moderate")!;
  const c = tierRow(p, "complex");
  const mH = impliedHours(m);
  const cH = c ? impliedHours(c) : null;
  if (!c || !cH || !mH || !c.rate || !m.rate) return body === undefined ? [] : ["a work-against-price block exists without complex hours"];
  if (body === undefined) return ["no work-against-price block"];
  const v: string[] = [];
  const gap = c.median - m.median;
  const added = cH - mH;
  if (!body.startsWith(`${usd(m.median)} to ${usd(c.median)} is a ${usd(gap)} step`)) v.push(`opening is not ${usd(m.median)} to ${usd(c.median)} is a ${usd(gap)} step`);
  if (added <= 0) {
    if (!/carried by price, not work/.test(body)) v.push("hours do not rise but the step is not carried by price");
    if (!(c.rate > m.rate)) v.push("carried by price although the rate does not rise");
    const same = body.match(/implied hours stay at (\d+)/);
    const fall = body.match(/implied hours fall from (\d+) to (\d+)/);
    if (added === 0 ? !same || Number(same[1]) !== cH : !fall || Number(fall[1]) !== mH || Number(fall[2]) !== cH) v.push("stated hour movement is wrong");
    if (!body.includes(`from ${usd(m.rate)} to ${usd(c.rate)}`)) v.push("stated rate movement is wrong");
    return v;
  }
  const workPart = added * m.rate;
  const pricePart = cH * (c.rate - m.rate);
  const total = workPart + pricePart;
  const work = Math.round((workPart / total) * 100);
  const price = 100 - work;
  const w = body.match(/(\d+) more hours? at (\$[\d,]+) is (\$[\d,]+)/);
  const e = body.match(/(\$[\d,]+) across (\d+) hours adds (\$[\d,]+)/);
  if (!w || Number(w[1]) !== added || money(w[2]!) !== m.rate || money(w[3]!) !== workPart) v.push(`work part is not ${added} hours at ${usd(m.rate)} = ${usd(workPart)}`);
  if (!e || money(e[1]!) !== c.rate || Number(e[2]) !== cH || money(e[3]!) !== pricePart) v.push(`price part is not ${usd(c.rate)} across ${cH} hours = ${usd(pricePart)}`);
  const mostlyWork = /mostly work/.test(body);
  const toPrice = /weighted toward price/.test(body);
  const split = /split between work and price/.test(body);
  if (+mostlyWork + +toPrice + +split !== 1) v.push("not exactly one of mostly work / weighted toward price / split");
  if (mostlyWork !== work >= 60) v.push(`"mostly work" is ${mostlyWork} at a work share of ${work}%`);
  if (toPrice !== price >= 60) v.push(`"weighted toward price" is ${toPrice} at a price share of ${price}%`);
  if (split !== (work < 60 && price < 60)) v.push(`"split" is ${split} at ${work}% work and ${price}% price`);
  const shownWork = body.match(/Work carries (\d+)%/);
  if (work >= 60 && (!shownWork || Number(shownWork[1]) !== work)) v.push(`work share should read ${work}%`);
  if (price >= 60) {
    const pr = body.match(/Price carries (\d+)%/);
    if (!pr || Number(pr[1]) !== price) v.push(`price share should read ${price}%`);
  }
  if (work < 60 && price < 60) {
    const both = body.match(/Work carries (\d+)% and price (\d+)%/);
    if (!both || Number(both[1]) !== work || Number(both[2]) !== price) v.push(`split should read ${work}% work and ${price}% price`);
  }
  const note = body.match(/the two parts come to (\$[\d,]+) because the hours are rounded to whole numbers/);
  if (total === gap && note) v.push("a rounding note on parts that already equal the step");
  if (total !== gap) {
    if (!note || money(note[1]!) !== total) v.push(`parts come to ${usd(total)} against the ${usd(gap)} step without saying so`);
    if (Math.abs(total - gap) > 0.5 * (m.rate + c.rate)) v.push(`parts ${usd(total)} are further from ${usd(gap)} than whole-hour rounding allows`);
  }
  const stated = note ? money(note[1]!) : gap;
  if (w && e && money(w[3]!) + money(e[3]!) !== stated) v.push(`printed parts ${w[3]} + ${e[3]} do not add up to the stated ${usd(stated)}`);
  return v;
}

function checkNeighbourBlock(p: Page, blocks: CalculationBlock[]): string[] {
  const table = seedTable(p.category, "moderate");
  const own = table.find((r) => r.code === p.code)!.median;
  const mid = middle(table.map((r) => r.median));
  const ne = Math.abs(own - mid);
  const found = blocks.find((b) => /^Borrowing the wrong figure\.$|^What using the wrong reference figure costs\.$/.test(b.lead));
  if (!found) return ["no third block"];
  const body = found.body;
  const v: string[] = [];
  const fig = (name: string, shown: string) => {
    const real = valueOfName(table, name);
    if (real !== money(shown)) v.push(`${name} stated at ${shown} but records ${real === undefined ? "nothing" : usd(real)}`);
  };
  const adjacent = (name: string, role: "above" | "below") => {
    const x = valueOfName(table, name);
    if (x === undefined) return;
    if (role === "above" && (x < own || table.some((r) => r.median > own && r.median < x))) v.push(`${name} is not the nearest state above`);
    if (role === "below" && (x > own || table.some((r) => r.median < own && r.median > x))) v.push(`${name} is not the nearest state below`);
  };
  if (found.lead.startsWith("What using")) {
    const end = body.match(/^(.+?) ends the (.+?) table, so one side has no neighbouring figure to borrow\. The (\$[\d,]+) midpoint of all (\d+) tracked states (is the same figure as the (\$[\d,]+) estimate here|is out by (\$[\d,]+) against the (\$[\d,]+) estimate here)\.$/);
    if (!end) return [...v, `unrecognised end-of-table block: ${body.slice(0, 80)}`];
    if (own !== Math.max(...table.map((r) => r.median)) && own !== Math.min(...table.map((r) => r.median))) v.push("says the state ends the table but it is in the middle");
    if (money(end[3]!) !== mid || Number(end[4]) !== table.length) v.push("midpoint or table size wrong");
    if (end[5]!.startsWith("is the same") ? ne !== 0 : ne === 0 || money(end[7]!) !== ne) v.push("the midpoint distance is wrong");
    return v;
  }
  const branchOne = / — but the /.test(body);
  const branchTwo = /^Budgeting from /.test(body);
  const one = body.match(
    new RegExp(
      `^${NAME_RE} \\((\\$[\\d,]+)\\) (matches this state exactly|is (\\$[\\d,]+) light), ${NAME_RE} \\((\\$[\\d,]+)\\) (matches it exactly|is (\\$[\\d,]+) heavy) — but the (\\$[\\d,]+) table midpoint is out by (\\$[\\d,]+)(?:, (\\d+)x the (?:larger )?neighbour error|, against at most (\\$[\\d,]+) for the two neighbours)?\\.$`,
    ),
  );
  const two = body.match(
    new RegExp(
      `^Budgeting from ${NAME_RE} \\((\\$[\\d,]+)\\) (gives the same figure as .+?|lands (\\$[\\d,]+) under .+?); from ${NAME_RE} \\((\\$[\\d,]+)\\), (the same figure|(\\$[\\d,]+) over); from the (\\$[\\d,]+) table midpoint, (the same figure|(\\$[\\d,]+) out)\\.$`,
    ),
  );
  if (!branchOne && !branchTwo) return [...v, `unrecognised neighbour block: ${body.slice(0, 80)}`];
  if (branchOne && one) {
    fig(one[1]!, one[2]!);
    fig(one[5]!, one[6]!);
    adjacent(one[1]!, "below");
    adjacent(one[5]!, "above");
    const belowV = valueOfName(table, one[1]!)!;
    const aboveV = valueOfName(table, one[5]!)!;
    const light = own - belowV;
    const heavy = aboveV - own;
    if (one[3]!.startsWith("matches") !== (light === 0) || (light !== 0 && money(one[4]!) !== light)) v.push(`"${one[3]}" but the lower neighbour is ${usd(light)} away`);
    if (one[7]!.startsWith("matches") !== (heavy === 0) || (heavy !== 0 && money(one[8]!) !== heavy)) v.push(`"${one[7]}" but the upper neighbour is ${usd(heavy)} away`);
    if (money(one[9]!) !== mid || money(one[10]!) !== ne) v.push("midpoint or its error is wrong");
    const worst = Math.max(light, heavy);
    if (!(ne > worst * 4)) v.push(`first form used although the midpoint error ${usd(ne)} is not above four times ${usd(worst)}`);
    const floor = Math.max(50, own * 0.01);
    if (worst === 0) {
      if (one[11] || one[12]) v.push("a multiplier or comparison on a zero neighbour error");
    } else if (worst < floor) {
      if (one[11] || !one[12] || money(one[12]) !== worst) v.push(`a neighbour error of ${usd(worst)} (under the ${usd(floor)} floor) must be stated in dollars, not as a multiplier`);
    } else if (!one[11] || Number(one[11]) !== Math.round(ne / worst) || one[12]) {
      v.push(`multiplier should read ${Math.round(ne / worst)}x`);
    }
    if (one[11] && Number(one[11]) > 50) v.push(`${one[11]}x is an absurd multiplier`);
    if (one[11] && !/the larger neighbour error/.test(body)) v.push("the multiplier is against an unspecified neighbour error");
  } else if (branchOne) {
    v.push(`first-form block does not parse: ${body.slice(0, 100)}`);
  }
  if (branchTwo && two) {
    fig(two[1]!, two[2]!);
    fig(two[5]!, two[6]!);
    adjacent(two[1]!, "below");
    adjacent(two[5]!, "above");
    const belowV = valueOfName(table, two[1]!)!;
    const aboveV = valueOfName(table, two[5]!)!;
    const worst = Math.max(own - belowV, aboveV - own);
    if (ne > worst * 4) v.push("second form used although the midpoint error is above four times the neighbour error");
    if (two[3]!.startsWith("gives") !== (belowV === own) || (belowV !== own && money(two[4]!) !== own - belowV)) v.push("distance below is wrong");
    if (two[7]!.startsWith("the same") !== (aboveV === own) || (aboveV !== own && money(two[8]!) !== aboveV - own)) v.push("distance above is wrong");
    if (money(two[9]!) !== mid) v.push("midpoint is wrong");
    if (two[10]!.startsWith("the same") !== (ne === 0) || (ne !== 0 && money(two[11]!) !== ne)) v.push("midpoint distance is wrong");
  } else if (branchTwo) {
    v.push(`second-form block does not parse: ${body.slice(0, 100)}`);
  }
  return v;
}

describe("K4-a extension: calculationBlocks arithmetic, shares and sums equal the seed", () => {
  it("the simple-tier block states the true hour gap and rate (every page)", () => {
    expect(collect((p) => checkSimpleBlock(p, blockBody(calculationBlocks(p.ctx, p.label), /^Simple tier\.$/)))).toEqual([]);
  });

  it("the work-against-price block labels the step by its printed shares and its parts add up (every page)", () => {
    expect(collect((p) => checkWorkBlock(p, blockBody(calculationBlocks(p.ctx, p.label), /^Work against price\.$/)))).toEqual([]);
  });

  it("the borrowing block states true neighbour errors and no multiplier of a zero or tiny error (every page)", () => {
    expect(collect((p) => checkNeighbourBlock(p, calculationBlocks(p.ctx, p.label)))).toEqual([]);
  });

  it("every branch of the three blocks occurs, so none of the checks is vacuous", () => {
    const seen = new Map<string, number>();
    const hit = (name: string, text: string | undefined, re: RegExp) => {
      if (text && re.test(text)) seen.set(name, (seen.get(name) ?? 0) + 1);
    };
    for (const p of PAGES) {
      const blocks = calculationBlocks(p.ctx, p.label);
      const simple = blockBody(blocks, /^Simple tier\.$/);
      hit("simple with duration", simple, /a month/);
      hit("simple without duration", simple, /fewer than the moderate tier/);
      const work = blockBody(blocks, /^Work against price\.$/);
      hit("carried by price", work, /carried by price, not work/);
      hit("mostly work", work, /mostly work/);
      hit("weighted toward price", work, /weighted toward price/);
      hit("split", work, /split between work and price/);
      hit("parts equal the step", work && !/the two parts come to/.test(work) && /step, /.test(work) && !/carried by price/.test(work) ? work : undefined, /./);
      hit("parts rounded", work, /the two parts come to/);
      const third = blockBody(blocks, /^(Borrowing|What using)/);
      hit("neighbours exact", third, /matches this state exactly/);
      hit("neighbour error in dollars", third, /against at most/);
      hit("multiplier", third, /\dx the larger neighbour error/);
      hit("budgeting", third, /^Budgeting from/);
      hit("end of table", third, /ends the .+ table/);
    }
    const required = [
      "simple with duration", "simple without duration", "carried by price", "mostly work", "weighted toward price", "split",
      "parts equal the step", "parts rounded", "neighbours exact", "neighbour error in dollars", "multiplier", "budgeting", "end of table",
    ];
    expect(required.filter((name) => !seen.get(name))).toEqual([]);
  });

  it("positive control: the checkers flag the earlier labels, sums, rate claim and multipliers", () => {
    const find = (re: RegExp, lead: RegExp) => PAGES.find((p) => re.test(blockBody(calculationBlocks(p.ctx, p.label), lead) ?? ""))!;

    const splitPage = find(/split between work and price/, /^Work against price\.$/);
    expect(splitPage).toBeDefined();
    const splitBody = blockBody(calculationBlocks(splitPage.ctx, splitPage.label), /^Work against price\.$/)!;
    expect(checkWorkBlock(splitPage, splitBody)).toEqual([]);
    const relabelled = splitBody.replace("split between work and price", "weighted toward price");
    expect(checkWorkBlock(splitPage, relabelled).join(" ")).toMatch(/"weighted toward price" is true/);

    const roundedPage = find(/the two parts come to/, /^Work against price\.$/);
    const roundedBody = blockBody(calculationBlocks(roundedPage.ctx, roundedPage.label), /^Work against price\.$/)!;
    const silent = roundedBody.replace(/ \(the two parts come to [^)]+\)/, "");
    expect(silent).not.toBe(roundedBody);
    expect(checkWorkBlock(roundedPage, silent).join(" ")).toMatch(/without saying so|do not add up/);

    const simplePage = find(/step to the moderate tier/, /^Simple tier\.$/);
    const simpleBody = blockBody(calculationBlocks(simplePage.ctx, simplePage.label), /^Simple tier\.$/)!;
    const m = tierRow(simplePage, "moderate")!;
    const s = tierRow(simplePage, "simple")!;
    const hourGap = impliedHours(m)! - impliedHours(s)!;
    const wrongClaim = `${simpleBody} The ${usd(m.median - s.median)} step to the moderate tier is ${hourGap} more hours at that rate.`;
    expect(checkSimpleBlock(simplePage, wrongClaim).join(" ")).toMatch(/more hours at/);

    const tinyPage = find(/against at most/, /^Borrowing the wrong figure\.$/);
    const tinyBlocks = calculationBlocks(tinyPage.ctx, tinyPage.label);
    expect(checkNeighbourBlock(tinyPage, tinyBlocks)).toEqual([]);
    const swapped = tinyBlocks.map((b) => ({ ...b, body: b.body.replace(/against at most \$[\d,]+ for the two neighbours/, "1100x the larger neighbour error") }));
    expect(checkNeighbourBlock(tinyPage, swapped).join(" ")).toMatch(/absurd multiplier|multiplier|stated in dollars/);
  });
});
