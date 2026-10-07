import { describe, expect, it } from "vitest";
import { hoursSentence } from "@/lib/seo/state-context";
import {
  PAGES,
  collect,
  impliedHours,
  middle,
  seedTable,
  tierRow,
  usd,
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
  if (/full working week/.test(text) !== h >= 45) v.push(`working-week claim is ${/full working week/.test(text)} at ${h} hours`);
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

  const because = /because the rate rather than the workload carries more of it/.test(text);
  const rateAbove = own.rate > peer.rate;
  if (because && !(h < peer.hours && rateAbove)) {
    v.push(`attributes the fewer hours to the rate, but hours ${h} vs ${peer.hours} and rate ${usd(own.rate)} vs peer ${usd(peer.rate)}`);
  }
  if (!because && h < peer.hours && rateAbove) v.push("rate above the peer median and hours below, but the cause is not stated");
  if (because) {
    const rates = [...text.slice(text.indexOf("because")).matchAll(/\$[\d,]+/g)].map((m) => m[0]);
    if (!rates.includes(usd(own.rate)) || !rates.includes(usd(peer.rate))) v.push("the cause is stated without the two rates it rests on");
  }
  return v;
}

describe("K4-a extension: hoursSentence states a cause only when the data has it", () => {
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
    expect(collect((p) => checkHours(p, hoursSentence(p.ctx, p.label)))).toEqual([]);
  });

  it("positive control: the checker flags the earlier unconditional cause clause", () => {
    const candidate = PAGES.find((p) => {
      const own = tierRow(p, "moderate")!;
      const h = impliedHours(own);
      return !!h && h < peerStats(p).hours && own.rate <= peerStats(p).rate;
    })!;
    expect(candidate).toBeDefined();
    const clean = hoursSentence(candidate.ctx, candidate.label)!;
    expect(checkHours(candidate, clean)).toEqual([]);
    const old = clean.replace(/ fewer implied hours?\./, (m) => `${m.slice(0, -1)}, because the rate rather than the workload carries more of it.`);
    expect(old).not.toBe(clean);
    expect(checkHours(candidate, old).join(" ")).toMatch(/attributes the fewer hours to the rate/);
  });
});
