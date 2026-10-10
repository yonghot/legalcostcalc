import { describe, expect, it } from "vitest";
import { assumptionItems, hourlyPositionSentence, hoursRankSentence, hoursSentence, trajectorySentence } from "@/lib/seo/state-context";
import { buildStateFaq } from "@/lib/seo/state-faq";
import { collect, middle, money, seedTable, strictRank, tierRow, type Page, type Tier } from "./helpers/k4a-oracle";

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

describe("r3-truth-R3-TXT-03 / R3C-01: the tier trajectory sentence prices each tier against its own midpoint", () => {
  const midpointOf = (p: Page, tier: Tier) => middle(seedTable(p.category, tier).map((r) => r.median));
  const offBy = (p: Page, tier: Tier) => Math.abs(tierRow(p, tier)!.median - midpointOf(p, tier)) / midpointOf(p, tier);
  const CLIMB_BIG = /Rank is not stable across the tiers/;
  const FALL_BIG = /The tiers rank .+ very differently/;

  it("'ordinary' and 'is not' claims about a tier need that tier within ten percent of its midpoint (or not)", () => {
    let seen = 0;
    const v = collect((p) => {
      const text = trajectorySentence(p.ctx, p.label) ?? "";
      const out: string[] = [];
      if (CLIMB_BIG.test(text)) seen++;
      if (/estimated at ordinary prices here; contested work is not/.test(text)) {
        if (!(offBy(p, "simple") <= 0.1)) out.push(`simple tier is ${Math.round(offBy(p, "simple") * 100)}% off its midpoint`);
        if (!(offBy(p, "complex") > 0.1)) out.push(`complex tier is ${Math.round(offBy(p, "complex") * 100)}% off its midpoint`);
      }
      if (/comparatively ordinary to finish/.test(text) && !(offBy(p, "complex") <= 0.1)) {
        out.push(`complex tier is ${Math.round(offBy(p, "complex") * 100)}% off its midpoint`);
      }
      return out;
    });
    expect(seen).toBeGreaterThan(20);
    expect(v).toEqual([]);
  });

  it("every large-shift page states each tier's gap to its midpoint as the seed rows give it", () => {
    const clause = (text: string, tier: "simple" | "complex") =>
      text.match(new RegExp(String.raw`the ${tier} tier is (?:exactly on|(\$[\d,]+) \((\d+)%\) (over|under)) its (\$[\d,]+) tier midpoint`));
    let seen = 0;
    const v = collect((p) => {
      const text = trajectorySentence(p.ctx, p.label) ?? "";
      if (!CLIMB_BIG.test(text) && !(FALL_BIG.test(text) && !/comparatively ordinary to finish|already sits at or below/.test(text))) return [];
      seen++;
      const out: string[] = [];
      for (const tier of ["simple", "complex"] as const) {
        const m = clause(text, tier);
        if (!m) {
          out.push(`no ${tier} midpoint clause: ${text}`);
          continue;
        }
        const own = tierRow(p, tier)!.median;
        const mid = midpointOf(p, tier);
        const gap = Math.round(Math.abs(own - mid));
        if (money(m[4]!) !== mid) out.push(`${tier}: midpoint ${m[4]} but ${mid}`);
        if (m[1] === undefined ? gap !== 0 : money(m[1]) !== gap || Number(m[2]) !== Math.round((Math.abs(own - mid) / mid) * 100) || m[3] !== (own > mid ? "over" : "under")) {
          out.push(`${tier}: ${m[0]} but own ${own} midpoint ${mid}`);
        }
      }
      return out;
    });
    expect(seen).toBeGreaterThan(30);
    expect(v).toEqual([]);
  });
});

describe("r3-truth-R3-TXT-04/05 and R3C-02: the complexity FAQ's 'so' conclusions follow from the tier ranks and prices it quotes", () => {
  const complexityAnswer = (p: Page) => buildStateFaq(p.ctx, p.label).find((e) => /vary by complexity/.test(e.question))?.answer ?? "";
  const tierFacts = (p: Page, tier: Tier) => {
    const table = seedTable(p.category, tier);
    const own = table.find((r) => r.code === p.code)!;
    const mid = middle(table.map((r) => r.median));
    return { rank: strictRank(table, own.median), of: table.length, premium: own.median / mid - 1 };
  };

  it("'more distinctive on contested matters' needs the contested rank and price farther from the middle than the simple ones", () => {
    let seen = 0;
    const v = collect((p) => {
      const text = complexityAnswer(p);
      if (!/so it is more distinctive on contested matters than on straightforward ones/.test(text)) return [];
      seen++;
      const s = tierFacts(p, "simple");
      const c = tierFacts(p, "complex");
      const out: string[] = [];
      if (!(Math.abs(c.rank - (c.of + 1) / 2) > Math.abs(s.rank - (s.of + 1) / 2))) out.push(`ranks ${s.rank}/${s.of} -> ${c.rank}/${c.of}: the contested rank is not farther from the middle`);
      if (!(Math.abs(c.premium) > Math.abs(s.premium))) out.push(`prices ${(s.premium * 100).toFixed(1)}% -> ${(c.premium * 100).toFixed(1)}% off the midpoint: the contested price is not farther`);
      return out;
    });
    expect(seen).toBeGreaterThan(20);
    expect(v).toEqual([]);
  });

  it("the climb branch keeps stating the two ranks when it does not conclude anything", () => {
    let withClaim = 0;
    let withoutClaim = 0;
    const v = collect((p) => {
      const text = complexityAnswer(p);
      if (!/its rank moves from/.test(text)) return [];
      if (/more distinctive/.test(text)) withClaim++;
      else withoutClaim++;
      return /its rank moves from \d+(?:st|nd|rd|th) of \d+ up to \d+(?:st|nd|rd|th)[,.]/.test(text) ? [] : [text];
    });
    expect(withClaim).toBeGreaterThan(10);
    expect(withoutClaim).toBeGreaterThan(10);
    expect(v).toEqual([]);
  });

  it("'the premium carries is concentrated in straightforward matters' needs the contested premium at most half the simple one", () => {
    let seen = 0;
    const v = collect((p) => {
      if (!/premium .+ carries is concentrated in straightforward matters/.test(complexityAnswer(p))) return [];
      seen++;
      const s = tierFacts(p, "simple").premium;
      const c = tierFacts(p, "complex").premium;
      return s > 0 && c <= s / 2 ? [] : [`simple ${(s * 100).toFixed(1)}% over its midpoint, complex ${(c * 100).toFixed(1)}%`];
    });
    expect(seen).toBeGreaterThan(20);
    expect(v).toEqual([]);
  });
});

describe("r3-truth-R3-TXT-06: 'ambiguous by N places' is the spread of the three ranks printed on the same line", () => {
  it("N is the largest minus the smallest of the simple, moderate and complex ranks it lists", () => {
    let seen = 0;
    const v = collect((p) => {
      const item = assumptionItems(p.ctx, p.label).find((i) => /is ambiguous by \d+ places/.test(i));
      if (!item) return [];
      seen++;
      const m = item.match(/ambiguous by (\d+) places unless a tier is named: (\d+)(?:st|nd|rd|th) simple, (\d+)(?:st|nd|rd|th) moderate, (\d+)(?:st|nd|rd|th) complex/)!;
      const ranks = [Number(m[2]), Number(m[3]), Number(m[4])];
      const spread = Math.max(...ranks) - Math.min(...ranks);
      const strict = (["simple", "moderate", "complex"] as const).map((tier) => {
        const table = seedTable(p.category, tier);
        return strictRank(table, table.find((r) => r.code === p.code)!.median);
      });
      const out: string[] = [];
      if (Number(m[1]) !== spread) out.push(`says ${m[1]} but ${ranks.join("/")} span ${spread}`);
      if (ranks.join() !== strict.join()) out.push(`ranks ${ranks.join("/")} but strict ${strict.join("/")}`);
      return out;
    });
    expect(seen).toBeGreaterThan(80);
    expect(v).toEqual([]);
  });
});
