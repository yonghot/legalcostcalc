import { describe, expect, it } from "vitest";
import { CATEGORIES } from "@/lib/constants/categories";
import { getModerateMedianCost } from "@/lib/page-index";
import {
  assumptionItems,
  categoryMixSentence,
  consistencySentence,
  hourlyPositionSentence,
  hoursRankSentence,
  hoursSentence,
  movementSentences,
  stateShapeSentences,
  trajectorySentence,
} from "@/lib/seo/state-context";
import { buildStateFaq } from "@/lib/seo/state-faq";
import { NAME_RE, collect, middle, money, nameToCode, seedTable, strictRank, tierRow, usd, type Page, type Tier } from "./helpers/k4a-oracle";

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

describe("r3-truth-R3-TXT-07: one section never gives two counts of the same set of matter types", () => {
  const counts = (p: Page) => {
    const tracked = CATEGORIES.filter((c) => (getModerateMedianCost(p.code, c.slug) ?? 0) > 0).length;
    const ranked = CATEGORIES.filter((c) => seedTable(c.slug, "moderate").some((r) => r.code === p.code)).length;
    return { tracked, ranked };
  };
  const sectionText = (p: Page) =>
    [stateShapeSentences(p.ctx, p.label).join(" "), categoryMixSentence(p.ctx, p.label) ?? "", consistencySentence(p.ctx, p.label) ?? ""].join(" ");

  it("a number before 'matter types' is the tracked count, or the ranked count when it says ranked", () => {
    let fewerRanked = 0;
    const v = collect((p) => {
      const { tracked, ranked } = counts(p);
      if (ranked < tracked) fewerRanked++;
      const out: string[] = [];
      for (const m of sectionText(p).matchAll(/(\d+) (ranked |tracked )?matter types?( tracked)?/g)) {
        const n = Number(m[1]);
        const kind = m[2]?.trim() ?? (m[3] ? "tracked" : "unqualified");
        const ok = kind === "ranked" ? n === ranked : kind === "tracked" ? n === tracked : n === tracked && ranked === tracked;
        if (!ok) out.push(`"${m[0]}" with ${tracked} tracked and ${ranked} ranked`);
      }
      return out;
    });
    expect(fewerRanked).toBeGreaterThan(100);
    expect(v).toEqual([]);
  });

  it("a state with an unranked matter type says how many, against the tracked count", () => {
    const v = collect((p) => {
      const { tracked, ranked } = counts(p);
      const text = stateShapeSentences(p.ctx, p.label).join(" ");
      const note = text.match(/Of the (\d+) matter types tracked for .+?, (\d+) (?:is|are) not ranked against other states/);
      if (ranked === tracked) return note ? [`note on a fully ranked state: ${note[0]}`] : [];
      return note && Number(note[1]) === tracked && Number(note[2]) === tracked - ranked ? [] : [`no accurate note for ${tracked} tracked, ${ranked} ranked: ${text}`];
    });
    expect(v).toEqual([]);
  });
});

describe("r3-truth-R3-W1: movement counts follow the strict rank the page prints", () => {
  const NUMBER_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5 };
  const nameRe = () => new RegExp(NAME_RE, "g");
  const table = (p: Page) => seedTable(p.category, "moderate");
  const rankWith = (p: Page, value: number) => 1 + table(p).filter((r) => r.code !== p.code && r.median > value).length;
  const medianOf = (p: Page, name: string) => table(p).find((r) => r.code === nameToCode.get(name))!.median;

  it("'Climbing N places' names N states that all record more than this state, and adding the stated sum climbs at least N", () => {
    let seen = 0;
    const v = collect((p) => {
      const text = movementSentences(p.ctx, p.label).join(" ");
      const m = text.match(/Climbing (\w+) places? would mean passing (.+?)(?: and adding (\$[\d,]+) to the|, which (?:all record|records) the same)/);
      if (!m) return [];
      seen++;
      const own = tierRow(p, "moderate")!.median;
      const names = [...m[2]!.matchAll(nameRe())].map((x) => x[1]!);
      const out: string[] = [];
      const n = NUMBER_WORDS[m[1]!]!;
      if (names.length !== n) out.push(`names ${names.length} for ${n}`);
      const tied = names.filter((name) => medianOf(p, name) <= own);
      if (tied.length) out.push(`${tied.join(", ")} record no more than ${usd(own)}, so passing them climbs nothing`);
      if (m[3] === undefined) out.push(`tie wording on a climb: ${m[0]}`);
      else {
        const target = own + money(m[3]);
        const climbed = rankWith(p, own) - rankWith(p, target);
        if (climbed < n) out.push(`adding ${m[3]} climbs ${climbed}, sentence says ${n}`);
      }
      return out;
    });
    expect(seen).toBeGreaterThan(300);
    expect(v).toEqual([]);
  });

  it("'N places down' names N states that record no more than this state, and a fall beyond the stated sum drops at least N", () => {
    let seen = 0;
    const v = collect((p) => {
      const text = movementSentences(p.ctx, p.label).join(" ");
      const m = text.match(/(\w+) places? down means passing under (.+?)(?:: (a fall of more than )?(\$[\d,]+)|, which (?:all record|records) the same)/i);
      if (!m) return [];
      seen++;
      const own = tierRow(p, "moderate")!.median;
      const names = [...m[2]!.matchAll(nameRe())].map((x) => x[1]!);
      const out: string[] = [];
      const n = NUMBER_WORDS[m[1]!.toLowerCase()]!;
      if (names.length !== n) out.push(`names ${names.length} for ${n}`);
      const higher = names.filter((name) => medianOf(p, name) > own);
      if (higher.length) out.push(`${higher.join(", ")} record more than ${usd(own)}`);
      const drop = m[4] === undefined ? 1 : money(m[4]) + (m[3] ? 1 : 0);
      if (m[4] === undefined && names.some((name) => medianOf(p, name) !== own)) out.push(`'same figure' wording but ${m[2]} differ`);
      const fell = rankWith(p, own - drop) - rankWith(p, own);
      if (fell < n) out.push(`falling ${usd(drop)} drops ${fell}, sentence says ${n}`);
      return out;
    });
    expect(seen).toBeGreaterThan(300);
    expect(v).toEqual([]);
  });

  it("'past as many as N places' is the larger of the rises a three percent revision can cause under the strict rank", () => {
    let seen = 0;
    const v = collect((p) => {
      const item = assumptionItems(p.ctx, p.label).find((i) => /past as many as \d+ places/.test(i));
      if (!item) return [];
      seen++;
      const stated = Number(item.match(/past as many as (\d+) places/)![1]);
      const own = tierRow(p, "moderate")!.median;
      const near = table(p).filter((r) => r.code !== p.code && Math.abs(r.median - own) / own <= 0.03);
      const climb = rankWith(p, own) - rankWith(p, own * 1.03);
      const slip = rankWith(p, own * 0.97 - 1e-9) - rankWith(p, own);
      const reach = Math.max(near.filter((r) => r.median > own).length, near.filter((r) => r.median <= own).length);
      return stated === reach && reach >= Math.max(climb, slip) ? [] : [`says ${stated}; up ${climb}, down ${slip}, near-based ${reach}`];
    });
    expect(seen).toBeGreaterThan(50);
    expect(v).toEqual([]);
  });
});
