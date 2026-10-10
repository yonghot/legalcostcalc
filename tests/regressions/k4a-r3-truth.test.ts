import { describe, expect, it } from "vitest";
import { hourlyPositionSentence, hoursRankSentence, hoursSentence } from "@/lib/seo/state-context";
import { collect, middle, tierRow, seedTable, type Page } from "./helpers/k4a-oracle";

/*
 * Adversarial review round 3 (r3-truth-*): sentences whose claim the page's own numbers contradict.
 */

const hoursOf = (row: { median: number; rate: number } | undefined) => (row && row.rate > 0 ? Math.round(row.median / row.rate) : null);
const peerHours = (p: Page) =>
  middle(
    seedTable(p.category, "moderate")
      .filter((r) => r.rate > 0)
      .map((r) => Math.round(r.median / r.rate)),
  );

describe("r3-truth-R3-TXT-01: the hours-rank sentence makes no workload claim the hours sentence contradicts", () => {
  it("'more work behind' needs hours above the peer median and 'fewer implied hours' needs hours below it", () => {
    let seen = 0;
    const v = collect((p) => {
      const text = hoursRankSentence(p.ctx, p.label);
      if (!text) return [];
      seen++;
      const own = hoursOf(tierRow(p, "moderate"))!;
      const peer = peerHours(p);
      const out: string[] = [];
      if (/more work behind/.test(text) && !(own > peer)) out.push(`says more work, hours ${own} vs peer median ${peer}`);
      if (/fewer implied hours/.test(text) && !(own < peer)) out.push(`says fewer hours, hours ${own} vs peer median ${peer}`);
      return out;
    });
    expect(seen).toBeGreaterThan(300);
    expect(v).toEqual([]);
  });

  it("both sentences stay on one side of the peer median wherever both are printed", () => {
    const v = collect((p) => {
      const rank = hoursRankSentence(p.ctx, p.label);
      const hours = hoursSentence(p.ctx, p.label);
      if (!rank || !hours) return [];
      const own = hoursOf(tierRow(p, "moderate"))!;
      const peer = peerHours(p);
      const rankSaysMore = /more work/.test(rank);
      const rankSaysFewer = /fewer implied hours/.test(rank);
      const hoursSaysMore = /more hours? of work/.test(hours);
      const hoursSaysFewer = /fewer implied hours?/.test(hours);
      return (rankSaysMore && hoursSaysFewer) || (rankSaysFewer && hoursSaysMore) || (rankSaysFewer && own >= peer) || (rankSaysMore && own <= peer)
        ? [`rank: ${rank} | hours: ${hours}`]
        : [];
    });
    expect(v).toEqual([]);
  });
});

describe("r3-truth-R3-TXT-02: the rate-versus-total sentence states no cause the page's rate and hours figures contradict", () => {
  const peerRate = (p: Page) => middle(seedTable(p.category, "moderate").filter((r) => r.rate > 0).map((r) => r.rate));
  const rateRank = (p: Page) => {
    const rated = seedTable(p.category, "moderate").filter((r) => r.rate > 0);
    const own = rated.find((r) => r.code === p.code)!;
    return { rank: 1 + rated.filter((r) => r.rate > own.rate).length, of: rated.length };
  };

  it("each causal tail needs the rate and hours relation it asserts", () => {
    let seen = 0;
    const v = collect((p) => {
      const text = hourlyPositionSentence(p.ctx, p.label);
      if (!text) return [];
      seen++;
      const row = tierRow(p, "moderate")!;
      const hours = hoursOf(row)!;
      const out: string[] = [];
      const rateAtOrBelowPeers = row.rate <= peerRate(p);
      const hoursAbovePeers = hours > peerHours(p);
      if (/not an unusually high rate/.test(text) && !rateAtOrBelowPeers) out.push(`'not an unusually high rate' but $${row.rate} > peer median $${peerRate(p)}`);
      if (/rather than higher prices/.test(text) && !(rateAtOrBelowPeers && hoursAbovePeers)) out.push(`'rather than higher prices' with rate $${row.rate} (peer $${peerRate(p)}) and ${hours} hours (peer ${peerHours(p)})`);
      if (/billed hours accumulating|assume longer matters/.test(text) && !hoursAbovePeers) out.push(`says hours accumulate but ${hours} <= peer ${peerHours(p)}`);
      if (/fewer billed hours than the rate alone/.test(text) && !(hours < peerHours(p))) out.push(`says fewer hours but ${hours} >= peer ${peerHours(p)}`);
      if (/high rates are not accompanied by high totals/.test(text)) {
        const r = rateRank(p);
        if (!(r.rank * 3 <= r.of)) out.push(`'high rates' but rate rank ${r.rank} of ${r.of} is not in the upper third`);
      }
      return out;
    });
    expect(seen).toBeGreaterThan(300);
    expect(v).toEqual([]);
  });

  it("no branch offers an explanation of the gap at all: only the two rankings and the place count", () => {
    const v = collect((p) => {
      const text = hourlyPositionSentence(p.ctx, p.label);
      return text && /\b(?:because|reflect|a sign|explain|rather than)\b/.test(text) ? [text] : [];
    });
    expect(v).toEqual([]);
  });
});
