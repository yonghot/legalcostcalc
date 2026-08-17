/**
 * lib/seo/state-context.ts — CODE-05 (부속W): per-entity analysis facts.
 *
 * WHY THIS EXISTS
 * A live measurement found this domain's sibling pages 85.2% identical by
 * 5-gram overlap (e.g. /california/divorce-cost vs /texas/divorce-cost) at
 * ~830 body words — the worst of the ten sites on both axes. AdSense rejected
 * every folder-1 domain as "low value content", citing minimum-content and
 * unique-content guidelines. Word count was never the real problem: the prose
 * was a template whose only变 part was the state name and a few figures.
 *
 * The fix is not more words — it is per-entity ANALYSIS whose sentences differ
 * structurally because the underlying numbers put each state in a different
 * bucket. Every value below is arithmetic over fields that already carry
 * `sources[]` in the seed dataset (cost_low/median/high, hourly_rate_*,
 * typical_duration). No new data is entered here.
 *
 * DELIBERATELY NOT USED: `median_household_income` exists in states.json but
 * carries no source citation, and CODE-05 acceptance requires every displayed
 * figure to be sourced. An affordability ratio would have been the strongest
 * differentiator available; it is omitted rather than shipped unsourced.
 *
 * UPL guard (CLAUDE.md, 부속G): these are descriptive statistics about
 * published fee ranges. Nothing here recommends an action, predicts an
 * outcome, or applies law to a situation.
 */

import { STATES } from "@/lib/constants/states";
import { getCostByComplexity, getModerateMedianCost, hasUniqueData } from "@/lib/page-index";

/** How this state's cost sits relative to every other indexable state. */
export interface StateCostContext {
  /** 1 = most expensive. Rank among indexable states for this category. */
  rank: number;
  /** How many indexable states back the ranking (the honest denominator). */
  rankedOutOf: number;
  /** Median of the moderate-complexity medians across indexable states. */
  peerMedian: number;
  /** Signed percent difference vs peerMedian, rounded. */
  vsPeerPercent: number;
  direction: "above" | "below" | "at";
  /** cost_median / hourly_rate_median, rounded — implied billable hours. */
  impliedHours: number | null;
  /** complex_median / simple_median for this state, 1 decimal. */
  complexityMultiple: number | null;
  /** (high - low) / median as a percent, rounded — how wide the quoted band is. */
  spreadPercent: number | null;
  /** Quartile of the peer distribution this state falls in (1 = cheapest 25%). */
  quartile: 1 | 2 | 3 | 4;
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
}

/**
 * Peer set: the moderate-complexity median for every state that passes the
 * CODE-06 information-gain gate for this category. Gated states only, so the
 * ranking never cites a page we ourselves treat as too thin to index.
 */
function peerMedians(categorySlug: string): { code: string; median: number }[] {
  return STATES.flatMap((state) => {
    if (!hasUniqueData(state.code, categorySlug)) return [];
    const value = getModerateMedianCost(state.code, categorySlug);
    return value === null ? [] : [{ code: state.code, median: value }];
  });
}

/**
 * Builds the per-entity context for a (state, category) pair, or null when the
 * pair has no moderate-complexity row (in which case callers render nothing
 * rather than a sentence with holes in it).
 */
export function buildStateCostContext(
  stateCode: string,
  categorySlug: string,
  opts: { hourlyRateMedian?: number | null; costLow?: number | null; costHigh?: number | null } = {},
): StateCostContext | null {
  const own = getModerateMedianCost(stateCode, categorySlug);
  if (own === null) return null;

  const peers = peerMedians(categorySlug);
  if (peers.length === 0) return null;

  const descending = [...peers].sort((a, b) => b.median - a.median);
  const rank = descending.findIndex((p) => p.code === stateCode) + 1;
  const peerMed = median(peers.map((p) => p.median));

  const vsPeerRaw = peerMed > 0 ? ((own - peerMed) / peerMed) * 100 : 0;
  const vsPeerPercent = Math.round(Math.abs(vsPeerRaw));
  const direction: StateCostContext["direction"] =
    vsPeerPercent < 1 ? "at" : vsPeerRaw > 0 ? "above" : "below";

  const hourly = opts.hourlyRateMedian ?? null;
  const impliedHours = hourly && hourly > 0 ? Math.round(own / hourly) : null;

  const simple = getCostByComplexity(stateCode, categorySlug, "simple");
  const complex = getCostByComplexity(stateCode, categorySlug, "complex");
  const complexityMultiple =
    simple && complex && simple > 0 ? Math.round((complex / simple) * 10) / 10 : null;

  const low = opts.costLow ?? null;
  const high = opts.costHigh ?? null;
  const spreadPercent = low !== null && high !== null && own > 0
    ? Math.round(((high - low) / own) * 100)
    : null;

  // Quartile by ascending cost: 1 = cheapest quarter of peers.
  const ascending = [...peers].sort((a, b) => a.median - b.median);
  const position = ascending.findIndex((p) => p.code === stateCode);
  const quartileIndex = Math.min(3, Math.floor((position / ascending.length) * 4));
  const quartile = (quartileIndex + 1) as 1 | 2 | 3 | 4;

  return {
    rank: rank > 0 ? rank : peers.length,
    rankedOutOf: peers.length,
    peerMedian: peerMed,
    vsPeerPercent,
    direction,
    impliedHours,
    complexityMultiple,
    spreadPercent,
    quartile,
  };
}

/**
 * Conditional phrasing helper (부속P CODE-06 "vary visible phrasing by the
 * data"): returns a DIFFERENT sentence shape per quartile, so two sibling
 * pages don't merely swap a number inside one fixed sentence. The claim is
 * always literally true of the quartile it is chosen for.
 */
export function positionSentence(ctx: StateCostContext, stateName: string, matterLabel: string): string {
  const cmp =
    ctx.direction === "at"
      ? `sits within a percent of the ${ctx.rankedOutOf}-state median`
      : `runs ${ctx.vsPeerPercent}% ${ctx.direction} the ${ctx.rankedOutOf}-state median of $${ctx.peerMedian.toLocaleString()}`;

  switch (ctx.quartile) {
    case 1:
      return `${stateName} sits in the lowest-cost quartile of the states this tool tracks for a ${matterLabel}: it ranks ${ctx.rank} of ${ctx.rankedOutOf} by median cost and ${cmp}.`;
    case 2:
      return `${stateName} lands in the lower-middle of the range for a ${matterLabel} — ranked ${ctx.rank} of ${ctx.rankedOutOf}, it ${cmp}.`;
    case 3:
      return `A ${matterLabel} in ${stateName} is recorded above the midpoint of tracked states. At rank ${ctx.rank} of ${ctx.rankedOutOf}, the median ${cmp}.`;
    case 4:
    default:
      return `${stateName} sits in the highest-cost quartile of the states tracked here for a ${matterLabel}, ranking ${ctx.rank} of ${ctx.rankedOutOf}; its median ${cmp}.`;
  }
}

/** Conditional phrasing for how wide the quoted band is. */
export function spreadSentence(ctx: StateCostContext, matterLabel: string): string | null {
  if (ctx.spreadPercent === null) return null;
  if (ctx.spreadPercent >= 150) {
    return `The quoted band is unusually wide — the high end is ${ctx.spreadPercent}% of the median away from the low end — which means the matter type, not the state, drives most of what a ${matterLabel} ends up costing here.`;
  }
  if (ctx.spreadPercent >= 80) {
    return `Low-to-high spans about ${ctx.spreadPercent}% of the median, a normal band for this matter: two ${matterLabel} files in the same state can differ by roughly that much on facts alone.`;
  }
  return `The low-to-high band is comparatively tight at about ${ctx.spreadPercent}% of the median, so quotes in this state cluster more predictably than in states with wider ranges.`;
}

/** Conditional phrasing for the simple → complex escalation in this state. */
export function complexitySentence(ctx: StateCostContext, matterLabel: string): string | null {
  if (ctx.complexityMultiple === null) return null;
  if (ctx.complexityMultiple >= 4) {
    return `The complexity gap is wide in this state: a complex ${matterLabel} is recorded at about ${ctx.complexityMultiple}x a simple one, so whether the matter stays uncontested moves the total more than any other recorded factor.`;
  }
  if (ctx.complexityMultiple >= 2.5) {
    return `A complex ${matterLabel} costs roughly ${ctx.complexityMultiple}x a simple one in this state — the usual pattern, and the reason a quote given before the facts are known is close to meaningless.`;
  }
  return `The gap between a simple and a complex ${matterLabel} is comparatively modest here — about ${ctx.complexityMultiple}x — so the state's baseline rates, rather than case complexity, set most of the total.`;
}

/** Conditional phrasing for implied billable hours at the state's median rate. */
export function hoursSentence(ctx: StateCostContext, matterLabel: string): string | null {
  if (ctx.impliedHours === null) return null;
  if (ctx.impliedHours >= 40) {
    return `At the state's median hourly rate, the median total implies roughly ${ctx.impliedHours} billable hours — a week or more of full-time attorney work, which is why ${matterLabel} quotes in this state are usually staged rather than paid up front.`;
  }
  if (ctx.impliedHours >= 15) {
    return `Dividing the median total by the state's median hourly rate implies about ${ctx.impliedHours} billable hours of work.`;
  }
  return `The median total works out to only about ${ctx.impliedHours} hours at the state's median rate, which suggests flat-fee or limited-scope arrangements dominate this matter type locally.`;
}
