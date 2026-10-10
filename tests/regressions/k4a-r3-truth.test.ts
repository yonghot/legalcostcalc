import { describe, expect, it } from "vitest";
import { CATEGORIES } from "@/lib/constants/categories";
import { getModerateMedianCost } from "@/lib/page-index";
import {
  assumptionItems,
  bandSentence,
  categoryMixSentence,
  clusterSentence,
  consistencySentence,
  hourlyPositionSentence,
  hoursRankSentence,
  movementSentences,
  neighborSentence,
  premiumSentence,
  sensitivitySentence,
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

describe("r3-truth-R3-TXT-01: the hours-rank sentence states the two ranks and makes no workload claim", () => {
  const ordinalRe = "(\\d+)(?:st|nd|rd|th)";
  const PARSE = new RegExp(
    `^By implied hours .+? is ${ordinalRe} of (\\d+) at (\\d+) hours, (?:(\\d+) places? above its cost rank of ${ordinalRe}|(\\d+) places? below its ${ordinalRe} on cost|the same place it holds on cost)\\.$`,
  );

  it("no page claims more work, fewer hours or an agreement the hours sentence could contradict", () => {
    let seen = 0;
    const v = collect((p) => {
      const text = hoursRankSentence(p.ctx);
      if (!text) return [];
      seen++;
      return /more work|fewer implied hours|same money|third ordering|where cost and rate also put it|agree/.test(text) ? [text] : [];
    });
    expect(seen).toBeGreaterThan(300);
    expect(v).toEqual([]);
  });

  it("the hours rank, its denominator, the hours and the cost-rank relation equal the seed's strict ranks", () => {
    const seen = { above: 0, below: 0, same: 0 };
    const v = collect((p) => {
      const text = hoursRankSentence(p.ctx);
      if (!text) return [];
      const m = text.match(PARSE);
      if (!m) return [`unrecognised: ${text}`];
      const rated = seedTable(p.category, "moderate").filter((r) => r.rate > 0);
      const own = rated.find((r) => r.code === p.code)!;
      const hoursRank = 1 + rated.filter((r) => r.median / r.rate > own.median / own.rate).length;
      const costRank = strictRank(seedTable(p.category, "moderate"), own.median);
      const out: string[] = [];
      if (Number(m[1]) !== hoursRank || Number(m[2]) !== rated.length || Number(m[3]) !== hoursOf(own)) out.push(`says ${m[1]}/${m[2]}/${m[3]} hours, seed ${hoursRank}/${rated.length}/${hoursOf(own)}`);
      if (m[4] !== undefined) {
        seen.above++;
        if (!(hoursRank < costRank && costRank - hoursRank === Number(m[4]) && costRank === Number(m[5]))) out.push(`"above": hours ${hoursRank}, cost ${costRank}, says ${m[4]} places over ${m[5]}`);
      } else if (m[6] !== undefined) {
        seen.below++;
        if (!(hoursRank > costRank && hoursRank - costRank === Number(m[6]) && costRank === Number(m[7]))) out.push(`"below": hours ${hoursRank}, cost ${costRank}, says ${m[6]} places under ${m[7]}`);
      } else {
        seen.same++;
        if (hoursRank !== costRank) out.push(`"same place": hours ${hoursRank}, cost ${costRank}`);
      }
      return out;
    });
    expect(seen.above).toBeGreaterThan(20);
    expect(seen.below).toBeGreaterThan(20);
    expect(seen.same).toBeGreaterThan(5);
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
      return text && /\b(?:because|reflect|a sign|explain|rather than|disagree|different directions|same story|nearly agree|optimistic|same signal|far above)\b/.test(text) ? [text] : [];
    });
    expect(v).toEqual([]);
  });
});

describe("r3-truth-R3-TXT-03 / R3C-01: the tier trajectory sentence prices each tier against its own midpoint", () => {
  const midpointOf = (p: Page, tier: Tier) => middle(seedTable(p.category, tier).map((r) => r.median));
  const CLIMB_BIG = /it climbs \d+ places as the matter gets harder/;
  const FALL_BIG = /a fall of \d+ places as the matter becomes harder/;

  it("no page calls a tier ordinary or expensive: the claim is printed as dollar gaps to the midpoints", () => {
    let seen = 0;
    const v = collect((p) => {
      const text = trajectorySentence(p.ctx) ?? "";
      if (CLIMB_BIG.test(text) || FALL_BIG.test(text)) seen++;
      return /ordinary|expensive|contested work is not|already sits at or below|rank is not stable|very differently/.test(text) ? [text] : [];
    });
    expect(seen).toBeGreaterThan(30);
    expect(v).toEqual([]);
  });

  it("every large-shift page states each tier's gap to its midpoint as the seed rows give it", () => {
    const clause = (text: string, tier: "simple" | "complex") =>
      text.match(new RegExp(String.raw`the ${tier} tier is (?:exactly on|(\$[\d,]+) \((\d+)%\) (over|under)) its (\$[\d,]+) tier midpoint`));
    let seen = 0;
    const v = collect((p) => {
      const text = trajectorySentence(p.ctx) ?? "";
      if (!CLIMB_BIG.test(text) && !FALL_BIG.test(text)) return [];
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
    expect(seen).toBeGreaterThan(40);
    expect(v).toEqual([]);
  });

  it("a page without a large shift states only the three ranks and their spread", () => {
    let seen = 0;
    const v = collect((p) => {
      const text = trajectorySentence(p.ctx) ?? "";
      const m = text.match(/^Rank by tier: .+ of \d+, (?:a spread of (\d+) places? between the highest and lowest of the three|the same rank at all three tiers)\.$/);
      if (!m) return [];
      seen++;
      const ranks = (["simple", "moderate", "complex"] as const).map((tier) => {
        const table = seedTable(p.category, tier);
        return strictRank(table, table.find((r) => r.code === p.code)!.median);
      });
      return Number(m[1] ?? 0) === Math.max(...ranks) - Math.min(...ranks) ? [] : [`says ${m[1] ?? "the same rank"} for ranks ${ranks.join("/")}`];
    });
    expect(seen).toBeGreaterThan(100);
    expect(v).toEqual([]);
  });
});

describe("r3-truth-R3-TXT-04/05 and R3C-02: the complexity FAQ states the three prices and the tier ranks and concludes nothing from them", () => {
  const complexityAnswer = (p: Page) => buildStateFaq(p.ctx, p.label).find((e) => /vary by complexity/.test(e.question))?.answer ?? "";
  const O = "(\\d+)(?:st|nd|rd|th)";
  const CLIMB = new RegExp(`^.+? records (\\$[\\d,]+) at the simple tier, (\\$[\\d,]+) at moderate and (\\$[\\d,]+) at complex, and its rank moves from ${O} of (\\d+) up to ${O}\\.$`);
  const FALL = new RegExp(`^The three tiers record (\\$[\\d,]+), (\\$[\\d,]+) and (\\$[\\d,]+), and the state's position falls from ${O} of (\\d+) at the simple tier to ${O} at the complex tier\\.$`);
  const FLAT = new RegExp(`^Yes: (\\$[\\d,]+) at the simple tier, (\\$[\\d,]+) at moderate and (\\$[\\d,]+) at complex, a span of ([\\d.]+)x\\. The state's rank across the tiers is ${O}, ${O} and ${O} of (\\d+), (?:a spread of (\\d+) places?|the same rank at all three tiers)\\.$`);

  it("no page draws a conclusion from the ranks or prices: distinctive, concentrated, substantially, similar position", () => {
    let seen = 0;
    const v = collect((p) => {
      const text = complexityAnswer(p);
      if (text) seen++;
      return /distinctive|concentrated|Substantially|similar position|standing|does not stand for every tier|moves the price/.test(text) ? [text] : [];
    });
    expect(seen).toBeGreaterThan(300);
    expect(v).toEqual([]);
  });

  it("the prices, ranks, table size, span and spread equal the seed, and the variant follows the strict rank shift", () => {
    const seen = { climb: 0, fall: 0, flat: 0 };
    const v = collect((p) => {
      const text = complexityAnswer(p);
      const s = tierRow(p, "simple")!;
      const m = tierRow(p, "moderate")!;
      const c = tierRow(p, "complex")!;
      const strict = (["simple", "moderate", "complex"] as const).map((tier) => {
        const table = seedTable(p.category, tier);
        return { rank: strictRank(table, table.find((r) => r.code === p.code)!.median), of: table.length };
      });
      const shift = strict[0]!.rank - strict[2]!.rank;
      const out: string[] = [];
      const prices = (a: string, b: string, c3: string) => {
        if (money(a) !== s.median || money(b) !== m.median || money(c3) !== c.median) out.push(`prices ${a}/${b}/${c3}, seed ${s.median}/${m.median}/${c.median}`);
      };
      const climb = text.match(CLIMB);
      const fall = text.match(FALL);
      const flat = text.match(FLAT);
      if (shift >= 4) {
        seen.climb++;
        if (!climb) return [`expected the climb form: ${text}`];
        prices(climb[1]!, climb[2]!, climb[3]!);
        if (Number(climb[4]) !== strict[0]!.rank || Number(climb[5]) !== strict[0]!.of || Number(climb[6]) !== strict[2]!.rank) out.push(`ranks ${climb[4]} of ${climb[5]} up to ${climb[6]}, seed ${strict[0]!.rank} of ${strict[0]!.of} to ${strict[2]!.rank}`);
      } else if (shift <= -4) {
        seen.fall++;
        if (!fall) return [`expected the fall form: ${text}`];
        prices(fall[1]!, fall[2]!, fall[3]!);
        if (Number(fall[4]) !== strict[0]!.rank || Number(fall[5]) !== strict[0]!.of || Number(fall[6]) !== strict[2]!.rank) out.push(`ranks ${fall[4]} of ${fall[5]} to ${fall[6]}, seed ${strict[0]!.rank} of ${strict[0]!.of} to ${strict[2]!.rank}`);
      } else {
        seen.flat++;
        if (!flat) return [`expected the flat form: ${text}`];
        prices(flat[1]!, flat[2]!, flat[3]!);
        const ranks = strict.map((x) => x.rank);
        if (!(c.median > s.median)) out.push("answers Yes although the complex tier does not cost more");
        if (Number(flat[4]) !== Math.round((c.median / s.median) * 10) / 10) out.push(`span ${flat[4]}x, seed ${Math.round((c.median / s.median) * 10) / 10}x`);
        if ([flat[5], flat[6], flat[7]].join() !== ranks.join() || Number(flat[8]) !== strict[0]!.of) out.push(`ranks ${flat[5]}/${flat[6]}/${flat[7]} of ${flat[8]}, seed ${ranks.join("/")} of ${strict[0]!.of}`);
        if (Number(flat[9] ?? 0) !== Math.max(...ranks) - Math.min(...ranks)) out.push(`spread ${flat[9] ?? 0}, seed ${Math.max(...ranks) - Math.min(...ranks)}`);
      }
      return out;
    });
    expect(seen.climb).toBeGreaterThan(20);
    expect(seen.fall).toBeGreaterThan(20);
    expect(seen.flat).toBeGreaterThan(100);
    expect(v).toEqual([]);
  });
});

describe("r3-truth-R3-TXT-06: the tier-rank spread is the largest minus the smallest of the three ranks printed on the same line", () => {
  it("N is the largest minus the smallest of the simple, moderate and complex ranks it lists", () => {
    let seen = 0;
    const v = collect((p) => {
      const item = assumptionItems(p.ctx, p.label).find((i) => /a spread of \d+ places\.$/.test(i));
      if (!item) return [];
      seen++;
      const m = item.match(/ at the simple tier, (\d+)(?:st|nd|rd|th) at moderate and (\d+)(?:st|nd|rd|th) at complex, a spread of (\d+) places\.$/);
      const first = item.match(/^The .+? rank is (\d+)(?:st|nd|rd|th)/);
      if (!m || !first) return [`unrecognised: ${item}`];
      const ranks = [Number(first[1]), Number(m[1]), Number(m[2])];
      const spread = Math.max(...ranks) - Math.min(...ranks);
      const strict = (["simple", "moderate", "complex"] as const).map((tier) => {
        const table = seedTable(p.category, tier);
        return strictRank(table, table.find((r) => r.code === p.code)!.median);
      });
      const out: string[] = [];
      if (Number(m[3]) !== spread) out.push(`says ${m[3]} but ${ranks.join("/")} span ${spread}`);
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

describe("r3-truth-R3-W6: the consistency sentence does not place one table's ordinal 'inside' another table's range", () => {
  it("'inside it' needs the page's own ordinal between the two printed ordinals", () => {
    let seen = 0;
    const v = collect((p) => {
      const text = consistencySentence(p.ctx, p.label);
      if (!text) return [];
      seen++;
      const out: string[] = [];
      const range = text.match(/ranges from (\d+)(?:st|nd|rd|th) of \d+ for .+? to (\d+)(?:st|nd|rd|th) of \d+ for /);
      const inside = text.match(/with its (\d+)(?:st|nd|rd|th)(?: of \d+)? on .+? inside it/);
      if (inside && range) {
        const [lo, hi] = [Math.min(Number(range[1]), Number(range[2])), Math.max(Number(range[1]), Number(range[2]))];
        if (!(Number(inside[1]) >= lo && Number(inside[1]) <= hi)) out.push(`own ${inside[1]} is not between ${range[1]} and ${range[2]}`);
        if (Number(range[1]) > Number(range[2])) out.push(`range printed larger first: ${range[1]} to ${range[2]}`);
      }
      return out;
    });
    expect(seen).toBeGreaterThan(300);
    expect(v).toEqual([]);
  });

  it("the page's own position is printed with its table size, in every branch", () => {
    const v = collect((p) => {
      const text = consistencySentence(p.ctx, p.label);
      if (!text) return [];
      if (/inside it|is consistent|does not rank uniformly|says little/.test(text)) return [`verdict: ${text}`];
      const own = text.match(/its (\d+)(?:st|nd|rd|th)(?: of (\d+))? on /);
      return own && Number(own[1]) === p.ctx.rank && Number(own[2]) === p.ctx.rankedOutOf ? [] : [`own position in "${text}"`];
    });
    expect(v).toEqual([]);
  });
});

describe("r3-truth-R3-W4: the cluster sentence prints the farthest peer's distance instead of a dollar verdict", () => {
  it("'The farthest of them sits $X' is the largest distance to a peer within three percent, and no 'few hundred' or 'densest' verdict remains", () => {
    let seen = 0;
    const v = collect((p) => {
      const text = clusterSentence(p.ctx) ?? "";
      const out: string[] = [];
      if (/few hundred|densest/.test(text)) out.push(`verdict remains: ${text}`);
      const m = text.match(/^(\d+) tracked states \u2014 .+ among them \u2014 record a median within three percent of .+?'s (\$[\d,]+)\. The farthest of them sits (\$[\d,]+) from that figure\.$/);
      if (!m) return text && Number(text.match(/^(\d+) tracked states/)?.[1] ?? 0) >= 4 ? [...out, `no farthest clause: ${text}`] : out;
      seen++;
      const own = tierRow(p, "moderate")!.median;
      const peers = seedTable(p.category, "moderate").filter((r) => r.code !== p.code && Math.abs(r.median - own) / own <= 0.03);
      const far = Math.max(...peers.map((r) => Math.abs(r.median - own)));
      if (Number(m[1]) !== peers.length) out.push(`says ${m[1]} states, seed has ${peers.length}`);
      if (money(m[2]!) !== own) out.push(`own ${m[2]} but ${own}`);
      if (money(m[3]!) !== far) out.push(`farthest ${m[3]} but ${far}`);
      if (far > Math.floor(own * 0.03)) out.push(`farthest ${far} exceeds the three percent window of ${own}`);
      return out;
    });
    expect(seen).toBeGreaterThan(150);
    expect(v).toEqual([]);
  });
});

describe("r3-truth-R3-W5: the ten percent counts are stated per direction and carry no reading of them", () => {
  it("'the field holds U above and D below' recomputes from the seed, and no revision-wide or interpretive wording remains", () => {
    let seen = 0;
    let none = 0;
    const v = collect((p) => {
      const text = sensitivitySentence(p.ctx, p.label) ?? "";
      const out: string[] = [];
      if (/revision|stable fact|propped up|lopsided|room to improve|well separated|in either direction/.test(text)) out.push(`interpretation: ${text}`);
      const own = tierRow(p, "moderate")!.median;
      const others = seedTable(p.category, "moderate").filter((r) => r.code !== p.code);
      const up = others.filter((r) => r.median > own && r.median <= own * 1.1).length;
      const down = others.filter((r) => r.median < own && r.median >= own * 0.9).length;
      const m = text.match(/the field holds (\d+) above and (\d+) below/);
      if (m) {
        seen++;
        if (Number(m[1]) !== up || Number(m[2]) !== down) out.push(`says ${m[1]}/${m[2]}, seed ${up}/${down}`);
      }
      if (/no other tracked state sits within ten percent/.test(text)) {
        none++;
        if (up + down !== 0) out.push(`says none within ten percent, seed ${up}/${down}`);
      } else if (text && !m) out.push(`no counts: ${text}`);
      return out;
    });
    expect(seen).toBeGreaterThan(300);
    expect(none).toBeGreaterThan(0);
    expect(v).toEqual([]);
  });
});

describe("r3-truth-R3-W11: the neighbour sentence states the two gaps and no reading of them", () => {
  it("no 'clear air', 'edge', 'arbitrary' or tie-break wording, while the bottom-gap branch still occurs", () => {
    let bottom = 0;
    let top = 0;
    const v = collect((p) => {
      const text = neighborSentence(p.ctx, p.label) ?? "";
      if (/and .+ at \$[\d,]+ is \$[\d,]+ below\.$/.test(text)) bottom++;
      if (/is \$[\d,]+ away at \$[\d,]+\.$/.test(text)) top++;
      return /clear air|edge of|arbitrary|tie-break|measured difference|wider/.test(text) ? [text] : [];
    });
    expect(bottom).toBeGreaterThan(10);
    expect(top).toBeGreaterThan(10);
    expect(v).toEqual([]);
  });
});

describe("r3-truth-R3-W2: the band sentence compares dollar widths and draws no clustering conclusion from them", () => {
  it("no page says the quoted figures 'cluster more tightly', and the narrow branch still occurs", () => {
    let narrow = 0;
    const v = collect((p) => {
      const text = bandSentence(p.ctx) ?? "";
      if (/narrower than the peer-median band/.test(text)) narrow++;
      return /cluster|more tightly/.test(text) ? [text] : [];
    });
    expect(narrow).toBeGreaterThan(50);
    expect(v).toEqual([]);
  });
});

describe("r3-truth-R3-W7: no practice-area sentence gives a verdict word that another sentence on the page can contradict", () => {
  const VERDICT = /spread across practice areas is wide|fan out more than most|unusually close together|is consistent|does not rank uniformly|set matter by matter|close to uniform|not equally priced|ordinary even|is not an outlier|says little about|Whatever drives|travels further/;
  const BY_MIDPOINT = /^Measured against each matter's own midpoint, /;

  it("the premium, shape and consistency sentences state numbers only, and the premium names its metric", () => {
    let premiums = 0;
    let shapes = 0;
    let consistencies = 0;
    const v = collect((p) => {
      const premium = premiumSentence(p.ctx) ?? "";
      const shape = stateShapeSentences(p.ctx, p.label).join(" ");
      const consistency = consistencySentence(p.ctx, p.label) ?? "";
      const out: string[] = [];
      if (premium) {
        premiums++;
        if (!BY_MIDPOINT.test(premium)) out.push(`premium without its metric: ${premium.slice(0, 90)}`);
      }
      if (/In median dollars the largest tracked median in .+ is \d+(?:\.\d+)?x the smallest, against \d+(?:\.\d+)?x for the typical state\./.test(shape)) shapes++;
      if (/^Across practice areas .+ ranges from /.test(consistency)) consistencies++;
      for (const [name, text] of [["premium", premium], ["shape", shape], ["consistency", consistency]] as const) {
        if (VERDICT.test(text)) out.push(`${name} keeps a verdict: ${text.match(VERDICT)![0]}`);
      }
      return out;
    });
    expect(premiums).toBeGreaterThan(300);
    expect(shapes).toBeGreaterThan(300);
    expect(consistencies).toBeGreaterThan(300);
    expect(v).toEqual([]);
  });
});
