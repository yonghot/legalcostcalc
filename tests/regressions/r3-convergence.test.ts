import { describe, expect, it } from "vitest";
import * as G from "@/lib/seo/state-context";
import { buildStateFaq } from "@/lib/seo/state-faq";
import { PAGES } from "./helpers/k4a-oracle";

/*
 * Convergence order 2026-10-11 02:40: every conditional prose generator states data values and relations a test
 * recomputes from the seed. The interpretive clauses below were deleted; none may come back. Each pattern is paired with
 * the earlier sentence it removed, so a pattern that stopped matching its own origin fails the positive control.
 */

const REMOVED: [string, RegExp, string][] = [
  ["rank", /the rank is meaningful|close enough that a single firm|\bonly \d+ states? records?\b/, "its figure lands within a percent of the midpoint of that table — the rank is meaningful, the distance is not."],
  ["neighbor", /tie-break|measured difference|close to arbitrary|edge of (?:a|its) (?:band|group)|clear air|is a wider \$/, "inside a $50 window — narrow enough that 7th is close to arbitrary."],
  ["cluster", /a pairing rather than a cluster|same market|not part of a cluster|densest part|few hundred dollars/, "records a median within three percent of Texas's $9,000 — a pairing rather than a cluster."],
  ["hourly position", /different directions|disagree|slightly optimistic|nearly agree|far above hourly|same signal|same story|accompanied by high totals|fewer billed hours|billed hours accumulating|unusually high rate|assume longer matters/, "the rate is a slightly optimistic guide to the total."],
  ["hours", /full working week|days of work, not weeks|indistinguishable|because the rate rather than the workload/, "more than a full working week of attorney time on a divorce."],
  ["escalation", /most of that is hours|carry the larger part/, "Hours carry the larger part of the step, and the rate rises with them."],
  ["trajectory", /Rank is not stable|very differently|expensive to start|comparatively ordinary|barely moves|understates|does not understate|rather than between|summarising|already shows/, "The state is expensive to start a divorce in and comparatively ordinary to finish one in."],
  ["overlap", /can therefore belong|a step, not a slope|the same money in|unusually informative|clean break/, "so the first escalation is a clean break"],
  ["band", / is wide:|close to the \$[\d,]+ peer median|cluster more tightly/, "In dollars the Texas moderate band is wide:"],
  ["tempo", /runs hotter|less per month|longer timeline|are close|not simply the extra calendar time/, "so the extra cost is not simply the extra calendar time."],
  ["consistency", /is consistent|does not rank uniformly|says little about|reflects a general price level|inside it/, "reflects a general price level rather than something specific to this matter."],
  ["sensitivity", /lopsided|propped up|room to improve|stable fact|better as a band|well separated|tie-break|ten percent revision/, "so the rank reads better as a band than as a precise place."],
  ["assumptions", /cross-check|corroborate|poor guide|workable shorthand|close, but not the same measurement|the tier, not the figure|same money buys|jump rather than a drift|ambiguous by|comparison with a model|evidence of anything/, "so the rate alone is a poor guide to the total."],
  ["premium", /close to uniform|not equally priced|spread across practice areas is wide|Whatever drives|wrong for at least one|one of degree/, "Whatever drives the state's price level applies to every matter type here."],
  ["rate group", /identifies .+ on its own|coarse instrument/, "so rate is a coarse instrument in this divorce table."],
  ["state shape", /fan out more than most|unusually close together|ordinary even where|set matter by matter|not an outlier|travels further/, "which is why the 5th on divorce is not an outlier."],
  ["calibration", /outside anything estimated|typical tracked state's figure is higher/, "would be outside anything estimated for this state."],
  ["hours rank", /third ordering|more work behind|fewer implied hours|agree even though/, "the total arriving on fewer implied hours."],
  ["extra calculations", /ratios differing|because the rate rises/, "the two ratios differing because the rate rises with the tier"],
  // Round 4 (2026-10-28): the seed has simple, moderate and complex tiers; nothing in it says contested or straightforward, and
  // the bankruptcy, real-estate and estate-planning rows contradict those labels.
  ["tier neighbors", /straightforward|once contested|contested/, "$3,400 is 43rd of 46 once contested, between Alaska ($3,300) and Utah ($3,450)"],
  ["tier neighbors", /straightforward/, "$800 is 12th of 46 on a straightforward bankruptcy, under Texas ($900)"],
  ["tier analysis", /straightforward|contested/, "$3,400 puts Alabama 43rd of 46 on contested matters, 3 up on its moderate position"],
  ["extra calculations", /Contested against simple/, "Contested against simple. At Alabama's own estimates, $3,400 buys 4.3 matters"],
  ["movement", /Climbing|places? down means|places? would mean/, "Climbing five places would mean passing A, B, C, D, E and adding $200 to the $5,000 estimate here."],
  ["movement", /\w+ places? down means/i, "Five places down means passing under A, B, C, D, E: a fall of more than $300."],
  ["trajectory", /climbs \d+ places|moves up the table|slides \d+ places|a fall of \d+ places|as complexity rises|gets harder|becomes harder/, "it climbs 6 places as the matter gets harder"],
  ["trajectory", /slides \d+ places downward|a climb of \d+ places/, "Ranked tier by tier, Texas slides 4 places downward: 11th at the simple tier"],
  ["escalation", /breaks down as|Decomposed|so the workload grows/, "The 5.7x step from the simple to the complex tier breaks down as 3.9x the hours against 1.55x the rate"],
  ["hours", /of work sits? behind|sit behind/, "so 3 more hours of work sit behind the California figure than behind the typical state's."],
  ["faq", /once it is contested/, "$235 for a moderate one and $400 once it is contested."],
  ["category mix", /\. At \d+% of/, "level with Divorce, over DUI / DWI. At 36% of Criminal Defense ($12,050)."],
  ["faq", /poor predictor|Substantially|more distinctive|concentrated in straightforward|similar position|rather than at either end|does not stand for every tier|moves the price/, "so it is more distinctive on contested matters than on straightforward ones"],
];

const sentencesOf = (p: (typeof PAGES)[number]) => {
  const c = p.ctx;
  const l = p.label;
  const blocks = (list: G.CalculationBlock[]) => list.map((b) => `${b.lead} ${b.body}`);
  return {
    rank: [G.rankSentence(c, l)],
    neighbor: [G.neighborSentence(c, l)],
    cluster: [G.clusterSentence(c)],
    "hourly position": [G.hourlyPositionSentence(c, l)],
    hours: [G.hoursSentence(c)],
    escalation: [G.escalationSentence(c, l)],
    trajectory: [G.trajectorySentence(c)],
    overlap: [G.overlapSentence(c)],
    band: [G.bandSentence(c)],
    tempo: [G.tempoSentence(c, l)],
    consistency: [G.consistencySentence(c, l)],
    sensitivity: [G.sensitivitySentence(c, l)],
    assumptions: G.assumptionItems(c, l),
    premium: [G.premiumSentence(c)],
    "rate group": G.rateGroupSentences(c, l),
    "state shape": G.stateShapeSentences(c, l),
    calibration: [G.calibrationSentence(c, l)],
    "hours rank": [G.hoursRankSentence(c)],
    "extra calculations": blocks(G.extraCalculations(c, l)),
    faq: buildStateFaq(c, l).map((f) => f.answer),
    dataset: G.datasetSentences(c),
    "tier neighbors": G.tierNeighborSentences(c),
    "tier analysis": [...G.tierAnalysisSentences(c, l, "simple"), ...G.tierAnalysisSentences(c, l, "complex")],
    "tier cluster": [G.tierClusterSentence(c, "simple"), G.tierClusterSentence(c, "complex")],
    movement: G.movementSentences(c, l),
    "category mix": [G.categoryMixSentence(c, l)],
    calculations: blocks(G.calculationBlocks(c, l)),
  } as Record<string, (string | null)[]>;
};

describe("convergence: the interpretive clauses removed from the generators stay removed", () => {
  it("positive control: every pattern matches the earlier sentence it was written for", () => {
    for (const [name, pattern, earlier] of REMOVED) expect(earlier, name).toMatch(pattern);
  });

  // Split by matter so no single test body walks all 369 pages: the one-body version ran 4.5 s idle and timed out at 5 s under gate load.
  const printed = new Map<string, number>();
  const MATTERS = [...new Set(PAGES.map((p) => p.category))];

  it("covers the 369 pages", () => {
    expect(PAGES.length).toBe(369);
    expect(MATTERS.length).toBe(8);
  });

  it.each(MATTERS)("no generator prints any removed clause on the %s pages", (matter) => {
    const bad: string[] = [];
    for (const p of PAGES.filter((x) => x.category === matter)) {
      const all = sentencesOf(p);
      for (const [name, texts] of Object.entries(all)) {
        for (const text of texts) {
          if (!text) continue;
          printed.set(name, (printed.get(name) ?? 0) + 1);
          for (const [group, pattern] of REMOVED) {
            if (group !== name) continue;
            const hit = text.match(pattern);
            if (hit) bad.push(`${p.state}/${p.category} ${name}: "${hit[0]}"`);
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it("every generator group printed sentences across the pages", () => {
    expect([...printed.keys()].length).toBeGreaterThanOrEqual(26);
    for (const [name, n] of printed) expect(n, name).toBeGreaterThan(20);
  });
});
