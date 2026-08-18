/**
 * lib/seo/state-faq.ts — CODE-05 (부속W): per-entity FAQ answers.
 *
 * WHY THIS EXISTS
 * The five programmatic FAQ answers on /[state]/[slug] used to restate figures
 * the page had already shown three times each — the cost band, the hourly band,
 * the duration and the fee list all appear in the answer block, the tier cards
 * and the cost-details section before the FAQ repeats them. Restating a point in
 * new words is the exact pattern AdSense's "low value content" verdict
 * describes, and a 5-gram measurement of the built HTML confirmed it: those five
 * answers were among the largest identical blocks shared between
 * /california/divorce-cost and /texas/divorce-cost.
 *
 * The questions stay — they are the phrasings people actually search — but each
 * answer now carries information that appears nowhere else on the page, and
 * picks its SHAPE from where this state's own numbers fall (its rank, its
 * position against the tier midpoint, how its rank moves across tiers, what
 * share of the median the itemised non-attorney fees represent). Two sibling
 * pages therefore give structurally different answers to the same question.
 *
 * Every figure is arithmetic over rows that already carry `sources[]`. Nothing
 * is entered here.
 *
 * UPL guard (CLAUDE.md): descriptive statistics about published fee ranges. No
 * recommendation, no outcome prediction, no application of law to a situation.
 */

import { formatCurrency } from "@/lib/utils/format";
import { ordinal, type StateCostContext } from "@/lib/seo/state-context";

const usd = (value: number) => formatCurrency(Math.round(value));

export interface FaqEntry {
  question: string;
  answer: string;
}

/**
 * Sums the dollar ranges embedded in the seed's `common_fees` strings, e.g.
 * "Court filing fee ($100-$400)". Returns null when a string carries no
 * parseable amount, so the caller falls back to naming the fees rather than
 * printing a total that was never in the data.
 */
export function sumFeeRanges(fees: readonly string[]): { low: number; high: number } | null {
  let low = 0;
  let high = 0;
  let matched = 0;
  for (const fee of fees) {
    const amounts = [...fee.matchAll(/\$([\d,]+)/g)].map((m) => Number(m[1]!.replace(/,/g, "")));
    if (amounts.length === 0) continue;
    matched += 1;
    low += amounts[0]!;
    high += amounts[amounts.length - 1]!;
  }
  if (matched === 0 || high <= 0) return null;
  return { low, high };
}

/**
 * Builds the per-state answers. `ctx` carries the ranked comparison and the
 * page's own rows; `matterLabel` is the human label for the matter type.
 */
export function buildStateFaq(ctx: StateCostContext, matterLabel: string): FaqEntry[] {
  const { stateName } = ctx;
  const simple = ctx.tiers.simple;
  const moderate = ctx.tiers.moderate;
  const complex = ctx.tiers.complex;
  if (!moderate) return [];

  const entries: FaqEntry[] = [];

  /* 1 — the headline number, placed in the table rather than merely repeated. */
  entries.push({
    question: `How much does a ${matterLabel} cost in ${stateName}?`,
    answer:
      ctx.direction === "at"
        ? `The recorded median is ${usd(moderate.median)} for a moderate-complexity matter, inside ${usd(
            moderate.low,
          )}–${usd(moderate.high)}. That is within a percent of the ${usd(
            ctx.peerMedian,
          )} midpoint of the ${ctx.rankedOutOf} states tracked here, which puts ${stateName} at ${ordinal(
            ctx.rank,
          )} — a position in the middle of the table rather than at either end of it.`
        : ctx.direction === "above"
          ? `The recorded median is ${usd(moderate.median)} for a moderate-complexity matter, inside ${usd(
              moderate.low,
            )}–${usd(moderate.high)}. That is ${usd(
              Math.abs(ctx.dollarsFromPeerMedian),
            )} above the ${usd(ctx.peerMedian)} midpoint of the ${
              ctx.rankedOutOf
            } tracked states, and ranks ${stateName} ${ordinal(ctx.rank)}, with ${
              ctx.rank - 1
            } ${ctx.rank === 2 ? "state" : "states"} recording more.`
          : `The recorded median is ${usd(moderate.median)} for a moderate-complexity matter, inside ${usd(
              moderate.low,
            )}–${usd(moderate.high)}. That is ${usd(
              Math.abs(ctx.dollarsFromPeerMedian),
            )} below the ${usd(ctx.peerMedian)} midpoint of the ${
              ctx.rankedOutOf
            } tracked states, ranking ${stateName} ${ordinal(ctx.rank)} with ${
              ctx.rankedOutOf - ctx.rank
            } ${ctx.rankedOutOf - ctx.rank === 1 ? "state" : "states"} recording less.`,
  });

  /* 2 — the rate, and what the rate does and does not explain. */
  if (moderate.hourlyMedian && ctx.hourlyRank !== null) {
    const rateSpread =
      simple?.hourlyMedian && complex?.hourlyMedian
        ? ` Across the tiers the median rate runs ${usd(simple.hourlyMedian)} for a simple matter, ${usd(
            moderate.hourlyMedian,
          )} for a moderate one and ${usd(complex.hourlyMedian)} once it is contested.`
        : "";
    entries.push({
      question: `How much does a ${matterLabel} lawyer charge per hour in ${stateName}?`,
      answer:
        ctx.rankGap !== null && Math.abs(ctx.rankGap) >= 6
          ? `The moderate-tier band is ${usd(moderate.hourlyLow ?? 0)}–${usd(
              moderate.hourlyHigh ?? 0,
            )} with a median of ${usd(moderate.hourlyMedian)}, which ranks ${stateName} ${ordinal(
              ctx.hourlyRank,
            )} of ${ctx.rankedOutOf} on rate against ${ordinal(
              ctx.rank,
            )} on total cost. The two rankings are ${Math.abs(
              ctx.rankGap,
            )} places apart, so the rate on its own is a poor predictor of the total here.${rateSpread}`
          : `The moderate-tier band is ${usd(moderate.hourlyLow ?? 0)}–${usd(
              moderate.hourlyHigh ?? 0,
            )}, median ${usd(moderate.hourlyMedian)} — ${ordinal(ctx.hourlyRank)} of ${
              ctx.rankedOutOf
            } tracked states. Dividing the ${usd(moderate.median)} median total by that rate implies about ${
              moderate.hours ?? 0
            } billable hours.${rateSpread}`,
    });
  }

  /* 3 — duration, expressed as money per month rather than repeated as a span. */
  if (moderate.duration) {
    const perMonth =
      moderate.durationMonths && moderate.durationMonths > 0
        ? Math.round(moderate.median / moderate.durationMonths)
        : null;
    const complexClause =
      complex?.duration && complex.durationMonths
        ? ` A complex matter is recorded at ${complex.duration}, and at ${usd(
            complex.median,
          )} that works out to about ${usd(
            complex.median / complex.durationMonths,
          )} a month.`
        : "";
    entries.push({
      question: `How long does a ${matterLabel} take in ${stateName}?`,
      answer: perMonth
        ? `The sources record ${moderate.duration} for a moderate-complexity matter${
            simple?.duration ? ` and ${simple.duration} for a simple one` : ""
          }. Spread across that timeline, the ${usd(moderate.median)} median is roughly ${usd(
            perMonth,
          )} a month of elapsed time.${complexClause}`
        : `The sources record ${moderate.duration} for a moderate-complexity matter${
            simple?.duration ? ` and ${simple.duration} for a simple one` : ""
          }.${complexClause}`,
    });
  }

  /* 4 — deliberately absent. The itemised fee lines are listed once, in the
     cost-details section, and sized against this state's median once, in the
     worked example. A fourth restatement here is what made the old FAQ the
     largest identical block two sibling pages shared. */

  /* 5 — complexity, answered with the state's rank at each tier. */
  if (simple && complex && simple.rank && complex.rank) {
    const shift = ctx.tierRankShift ?? 0;
    entries.push({
      question: `Does ${matterLabel} cost vary by complexity in ${stateName}?`,
      answer:
        shift >= 4
          ? `Substantially, and the state's standing changes with it. ${stateName} records ${usd(
              simple.median,
            )} at the simple tier, ${usd(moderate.median)} at moderate and ${usd(
              complex.median,
            )} at complex — and its rank moves from ${ordinal(simple.rank)} of ${
              ctx.rankedOutOf
            } up to ${ordinal(
              complex.rank,
            )}, so it is more distinctive on contested matters than on straightforward ones.`
          : shift <= -4
            ? `Substantially. The three tiers record ${usd(simple.median)}, ${usd(
                moderate.median,
              )} and ${usd(complex.median)}, but the state's position falls from ${ordinal(
                simple.rank,
              )} of ${ctx.rankedOutOf} at the simple tier to ${ordinal(
                complex.rank,
              )} at the complex tier — the premium ${stateName} carries is concentrated in straightforward matters.`
            : `Yes: ${usd(simple.median)} at the simple tier, ${usd(
                moderate.median,
              )} at moderate and ${usd(complex.median)} at complex, a ${
                ctx.costMultiple ?? 0
              }x span. ${stateName} holds a similar position at every tier — ${ordinal(
                simple.rank,
              )}, ${ordinal(moderate.rank ?? ctx.rank)} and ${ordinal(complex.rank)} of ${
                ctx.rankedOutOf
              } — so complexity moves the price without moving the state's standing.`,
    });
  }

  return entries;
}
