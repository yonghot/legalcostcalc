/**
 * lib/seo/state-context.ts — CODE-05 (부속W): per-entity analysis facts.
 *
 * WHY THIS EXISTS
 * A live measurement found this domain's sibling pages 85.2% identical by
 * 5-gram overlap (e.g. /california/divorce-cost vs /texas/divorce-cost) at
 * ~830 body words — the worst of the ten sites on both axes. AdSense rejected
 * every folder-1 domain as "low value content", citing minimum-content and
 * unique-content guidelines. Word count was never the real problem: the prose
 * was a template whose only varying part was the state name and a few figures.
 *
 * The first pass of this module took the measured overlap from 85.2% to 73.8%.
 * That was not enough, and re-measuring showed exactly why: the facts it
 * computed (quartile, spread, complexity multiple, implied hours) put most
 * sibling states in the SAME bucket, so both pages selected the same sentence
 * shape and differed only in the numbers inside it. Two specific dead ends are
 * worth recording so they are not re-attempted:
 *
 *   - Ratio facts are useless on this dataset. Within a category the low /
 *     median / high figures scale almost uniformly across states, so the
 *     low-to-high spread is 111-112% of the median in EVERY state. A sentence
 *     keyed on that ratio is a constant.
 *   - The complex-to-simple cost multiple is 6.4x-8.8x everywhere, so a
 *     three-bucket test on it also collapses to one bucket for nearly all
 *     states.
 *
 * What genuinely varies, verified against the seed before being written:
 *   - Rank among peers, and — separately — rank by hourly rate. These diverge
 *     per state (NY is 12th by total but 4th by rate), which is itself a fact.
 *   - Rank measured at EACH complexity tier. California is 1st at the simple
 *     tier and 13th at the complex tier; Texas moves the other way, 25th to
 *     10th. That trajectory is the single strongest differentiator available.
 *   - The names of the states immediately above and below in the table, and
 *     the names of the states clustered within a few percent.
 *   - Implied billable hours per tier, because hourly rates move independently
 *     of totals — so the hours-vs-rate decomposition of the complexity step
 *     differs state by state.
 *   - Whether adjacent tiers' cost bands overlap, which is a yes/no structural
 *     fact that differs between siblings.
 *   - Where this matter type sits among the eight tracked in the same state,
 *     and how consistent the state's ranking is across those eight.
 *
 * Every value below is arithmetic over fields that already carry `sources[]`
 * in the seed dataset (cost_low/median/high, hourly_rate_*, typical_duration).
 * No new data is entered here.
 *
 * DELIBERATELY NOT USED: `median_household_income` and `population` exist in
 * states.json but carry no source citation, and CODE-05 acceptance requires
 * every displayed figure to be sourced. An affordability ratio would have been
 * a strong differentiator; it is omitted rather than shipped unsourced.
 *
 * UPL guard (CLAUDE.md, 부속G): these are descriptive statistics about
 * published fee ranges. Nothing here recommends an action, predicts an
 * outcome, or applies law to a situation.
 */

import { STATES, STATE_MAP } from "@/lib/constants/states";
import { CATEGORIES } from "@/lib/constants/categories";
import {
  getCategoryTierFigures,
  getCostByComplexity,
  getModerateMedianCost,
  getTierFigures,
  hasUniqueData,
  type SeedTierFigures,
} from "@/lib/page-index";
import { aOrAn, formatCurrency } from "@/lib/utils/format";

type Complexity = "simple" | "moderate" | "complex";

const TIERS: Complexity[] = ["simple", "moderate", "complex"];

const STATE_CODES = STATES.map((state) => state.code);

/** A named peer state and its median at whichever tier is under discussion. */
export interface PeerState {
  name: string;
  median: number;
}

/** One complexity tier's figures plus the arithmetic derived from them. */
export interface TierFacts {
  complexity: Complexity;
  low: number;
  median: number;
  high: number;
  /** high - low, in dollars — the absolute width of the quoted band. */
  bandWidth: number;
  hourlyLow: number | null;
  hourlyMedian: number | null;
  hourlyHigh: number | null;
  /** median / hourlyMedian, rounded — implied billable hours at this tier. */
  hours: number | null;
  /** Rank among indexable peer states at THIS tier (1 = highest median). */
  rank: number | null;
  /** Median of the peer medians at THIS tier. */
  peerMedian: number;
  /** The state directly above at THIS tier, by name. */
  neighborAbove: PeerState | null;
  /** The state directly below at THIS tier, by name. */
  neighborBelow: PeerState | null;
  /** Two rows either side of this state at THIS tier, for a compact table. */
  window: { rank: number; name: string; median: number; isSelf: boolean }[];
  /** Peer states within 3% of this tier's median. */
  clusterCount: number;
  duration: string | null;
  /** Midpoint of the recorded duration in months, parsed from `duration`. */
  durationMonths: number | null;
}

/** How this state's cost sits relative to every other indexable state. */
export interface StateCostContext {
  stateName: string;
  /** 1 + the number of states with a strictly higher median; tied states share a rank. */
  rank: number;
  /** States recording a strictly higher / strictly lower median. */
  statesHigher: number;
  statesLower: number;
  /** How many indexable states back the ranking (the honest denominator). */
  rankedOutOf: number;
  /** Median of the moderate-complexity medians across indexable states. */
  peerMedian: number;
  /** Signed percent difference vs peerMedian, rounded. */
  vsPeerPercent: number;
  direction: "above" | "below" | "at";
  /** own median - peerMedian, in dollars. */
  dollarsFromPeerMedian: number;
  /** Quartile of the peer distribution (1 = lowest-cost 25%). */
  quartile: 1 | 2 | 3 | 4;
  /** The state directly above this one in the table, by name. */
  neighborAbove: PeerState | null;
  /** The state directly below this one in the table, by name. */
  neighborBelow: PeerState | null;
  /** Peer states whose moderate median is within 3% of this one's. */
  clusterPeers: string[];
  /** Rank by moderate-tier median hourly rate (1 = highest rate). */
  hourlyRank: number | null;
  /** States with a moderate-tier hourly rate: the denominator of hourlyRank and hoursRank. */
  ratedOutOf: number;
  /** costRank - hourlyRank. Positive: rate ranks higher than the total does. */
  rankGap: number | null;
  /** Median implied hours across peer states at the moderate tier. */
  peerMedianHours: number | null;
  /** Median of the peers' moderate-tier median hourly rates. */
  peerMedianRate: number | null;
  /** Median band width (high - low) across peer states, in dollars. */
  peerMedianBandWidth: number;
  /** Facts for each tier that exists, keyed by complexity. */
  tiers: Partial<Record<Complexity, TierFacts>>;
  /** simpleRank - complexRank. Positive: the state climbs as complexity rises. */
  tierRankShift: number | null;
  /** complexHours / simpleHours, 1 decimal. */
  hoursMultiple: number | null;
  /** complexHourlyMedian / simpleHourlyMedian, 2 decimals. */
  rateMultiple: number | null;
  /** complexMedian / simpleMedian, 1 decimal. */
  costMultiple: number | null;
  /** true when the simple tier's high reaches the moderate tier's low. */
  overlapSimpleModerate: boolean | null;
  /** true when the moderate tier's high reaches the complex tier's low. */
  overlapModerateComplex: boolean | null;
  /** Rank of this matter type among the tracked matter types in this state. */
  categoryRankInState: number;
  categoryHigherInState: number;
  categoryLowerInState: number;
  categoryCountInState: number;
  /** The matter type ranked directly above this one in the same state. */
  categoryAbove: string | null;
  /** The matter type ranked directly below this one in the same state. */
  categoryBelow: string | null;
  /** The matter type with the largest median in this state, and that median. */
  topCategory: { name: string; median: number } | null;
  /** The matter type where this state ranks nearest the top of the table. */
  strongestCategoryRank: { name: string; rank: number; of: number } | null;
  /** The matter type where this state ranks nearest the bottom. */
  weakestCategoryRank: { name: string; rank: number; of: number } | null;
  /** The state directly above in the HOURLY-RATE ranking, by name and rate. */
  hourlyNeighborAbove: { name: string; rate: number } | null;
  /** The state directly below in the HOURLY-RATE ranking, by name and rate. */
  hourlyNeighborBelow: { name: string; rate: number } | null;
  /** Other tracked states recording the identical median hourly rate. */
  sameRateStates: string[];
  /** Rank by IMPLIED HOURS (median / rate) — a third ordering of the table. */
  hoursRank: number | null;
  /** Where the state falls in the peer distribution, 0-100. */
  percentile: number;
  /** The highest- and lowest-recorded rows of this category's table. */
  tableEnds: { top: PeerState; bottom: PeerState } | null;
  /** The states between here and five places up, and five places down. */
  fivePlaces: { up: PeerState[]; down: PeerState[] };
  /** Ranked window in the HOURLY-rate table: two rows either side. */
  rateWindow: { rank: number; name: string; rate: number; isSelf: boolean }[];
  /** max/min of this state's own matter-type medians, and the peer median of it. */
  internalRatio: { own: number; peer: number } | null;
  /** How many tracked matter types rank this state in the top / bottom third. */
  matterRankCounts: { top: number; bottom: number; total: number };
  /** How many sources the moderate row cites. */
  sourceCount: number;
  /** The ranked slice of the table around this state, for a compact comparison. */
  peerWindow: { rank: number; name: string; median: number; isSelf: boolean }[];
  /** Every tracked matter type in this state: median, rank, premium vs midpoint. */
  categoryTable: {
    name: string;
    median: number;
    simpleMedian: number | null;
    complexMedian: number | null;
    rank: number | null;
    rankedOutOf: number | null;
    vsMidpointPercent: number | null;
    /** Implied billable hours for this matter in this state. */
    hours: number | null;
    /** The state one row above in THIS matter's table — a different state per matter. */
    above: string | null;
  }[];
  /** The matter type carrying this state's largest premium over its midpoint. */
  highestPremium: { name: string; percent: number } | null;
  /** The matter type carrying this state's smallest premium (or largest discount). */
  lowestPremium: { name: string; percent: number } | null;
  /** Dollars the median would have to move to change rank by one row. */
  rankSensitivity: { toPassAbove: number | null; toDropBelow: number | null };
  /** Nearest strictly higher and strictly lower medians (ties excluded), and how many other states record exactly this median. */
  rankEdges: { higher: PeerState | null; lower: PeerState | null; tied: number };
  /** Rows a +/-10% revision to this median could cross, upward and downward. */
  rowsWithinTenPercent: { up: number; down: number };
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
}

/**
 * Midpoint of a recorded duration string such as "3-6 months". Returns null
 * for anything it cannot parse rather than guessing a number — the strings are
 * seed data and a mis-parse would put an invented figure on the page.
 */
function parseDurationMonths(duration: string | null): number | null {
  if (!duration) return null;
  const range = duration.match(/(\d+)\s*[-–]\s*(\d+)\s*month/i);
  if (range) return (Number(range[1]) + Number(range[2])) / 2;
  const single = duration.match(/(\d+)\s*month/i);
  if (single) return Number(single[1]);
  return null;
}

export function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/**
 * Peer set for a (category, tier): every state that passes the CODE-06
 * information-gain gate for this category. Gated states only, so the ranking
 * never cites a page we ourselves treat as too thin to index.
 */
function peerFigures(categorySlug: string, complexity: Complexity): SeedTierFigures[] {
  return getCategoryTierFigures(categorySlug, complexity).filter(
    (row) => hasUniqueData(row.stateCode, categorySlug) && row.median > 0,
  );
}

interface Standing {
  /** 1 + the number of states recording a strictly higher value; tied states share a rank. */
  rank: number;
  higher: number;
  lower: number;
  of: number;
}

function standingOf(values: { code: string; value: number }[], stateCode: string): Standing | null {
  const own = values.find((row) => row.code === stateCode);
  if (!own) return null;
  const higher = values.filter((row) => row.value > own.value).length;
  const lower = values.filter((row) => row.value < own.value).length;
  return { rank: higher + 1, higher, lower, of: values.length };
}

function standingIn(
  rows: SeedTierFigures[],
  stateCode: string,
  key: "median" | "hourlyMedian",
): Standing | null {
  return standingOf(
    rows
      .map((row) => ({ code: row.stateCode, value: key === "median" ? row.median : row.hourlyMedian ?? 0 }))
      .filter((row) => row.value > 0),
    stateCode,
  );
}

function rankIn(rows: SeedTierFigures[], stateCode: string, key: "median" | "hourlyMedian"): number | null {
  return standingIn(rows, stateCode, key)?.rank ?? null;
}

function strictRank(rows: { median: number }[], median: number): number {
  return 1 + rows.filter((row) => row.median > median).length;
}

function buildTierFacts(
  stateCode: string,
  categorySlug: string,
  complexity: Complexity,
): TierFacts | null {
  const row = getTierFigures(stateCode, categorySlug, complexity);
  if (!row || row.median <= 0) return null;
  const peers = peerFigures(categorySlug, complexity);
  const descending = [...peers].sort((a, b) => b.median - a.median);
  const selfIndex = descending.findIndex((r) => r.stateCode === stateCode);
  const nameOf = (code: string) => STATE_MAP.get(code)?.name ?? code;
  const above = selfIndex > 0 ? descending[selfIndex - 1] : undefined;
  const below = selfIndex >= 0 ? descending[selfIndex + 1] : undefined;
  return {
    complexity,
    low: row.low,
    median: row.median,
    high: row.high,
    bandWidth: Math.max(0, row.high - row.low),
    hourlyLow: row.hourlyLow,
    hourlyMedian: row.hourlyMedian,
    hourlyHigh: row.hourlyHigh,
    hours: row.hourlyMedian && row.hourlyMedian > 0 ? Math.round(row.median / row.hourlyMedian) : null,
    rank: rankIn(peers, stateCode, "median"),
    peerMedian: median(peers.map((r) => r.median)),
    neighborAbove: above ? { name: nameOf(above.stateCode), median: above.median } : null,
    neighborBelow: below ? { name: nameOf(below.stateCode), median: below.median } : null,
    window: descending
      .slice(Math.max(0, selfIndex - 2), selfIndex + 3)
      .map((r) => ({
        rank: strictRank(peers, r.median),
        name: nameOf(r.stateCode),
        median: r.median,
        isSelf: r.stateCode === stateCode,
      })),
    clusterCount: peers.filter(
      (r) => r.stateCode !== stateCode && Math.abs(r.median - row.median) / row.median <= 0.03,
    ).length,
    duration: row.duration,
    durationMonths: parseDurationMonths(row.duration),
  };
}

/**
 * Where this matter type sits among the tracked matter types in the SAME
 * state, and how consistently the state ranks across all of them. Both are
 * per-state facts: two states with similar divorce costs routinely have a
 * different internal ordering and a different rank spread.
 */
function crossCategoryFacts(stateCode: string, categorySlug: string) {
  const ordered = CATEGORIES.map((category) => ({
    slug: category.slug,
    name: category.displayName,
    median: getModerateMedianCost(stateCode, category.slug) ?? 0,
  }))
    .filter((entry) => entry.median > 0)
    .sort((a, b) => b.median - a.median);

  const index = ordered.findIndex((entry) => entry.slug === categorySlug);

  const ranks = ordered
    .map((entry) => {
      const standing = standingIn(peerFigures(entry.slug, "moderate"), stateCode, "median");
      return standing === null
        ? null
        : { name: entry.name, rank: standing.rank, of: standing.of, higher: standing.higher, lower: standing.lower };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  const rankOfMatter = (name: string) => ranks.find((r) => r.name === name);
  const ownMedian = ordered[index]?.median ?? 0;
  const matterHigher = ordered.filter((entry) => entry.median > ownMedian).length;
  const matterLower = ordered.filter((entry) => entry.median < ownMedian).length;

  // How far above or below each matter type's OWN national midpoint this state
  // sits. A state is rarely uniformly expensive: the premium it carries differs
  // by practice area, and which areas carry the largest and smallest premium is
  // a per-state fact.
  const premiums = ordered
    .map((entry) => {
      const peers = peerFigures(entry.slug, "moderate");
      const mid = median(peers.map((r) => r.median));
      if (!mid) return null;
      return {
        name: entry.name,
        percent: Math.round(((entry.median - mid) / mid) * 100),
      };
    })
    .filter((entry): entry is { name: string; percent: number } => entry !== null)
    .sort((a, b) => b.percent - a.percent);

  const sortedRanks = [...ranks]
    .sort((a, b) => a.rank - b.rank)
    .map((r) => ({ name: r.name, rank: r.rank, of: r.of }));

  // How spread out a state's OWN matter types are, against the same spread
  // computed for every other state. A state whose practice areas sit close
  // together prices differently from one where they fan out, and which of the
  // two a state is cannot be read off any single row.
  const ownMedians = ordered.map((entry) => entry.median).filter((m) => m > 0);
  const ownRatio =
    ownMedians.length > 1 ? Math.max(...ownMedians) / Math.min(...ownMedians) : null;
  const peerRatios = STATE_CODES.flatMap((code) => {
    const medians = CATEGORIES.map((c) => getModerateMedianCost(code, c.slug) ?? 0).filter(
      (m) => m > 0,
    );
    if (medians.length < 2) return [];
    return [Math.max(...medians) / Math.min(...medians)];
  });
  const peerRatio = peerRatios.length ? median(peerRatios.map((r) => r * 100)) / 100 : null;

  return {
    categoryTable: ordered.map((entry) => ({
      name: entry.name,
      median: entry.median,
      simpleMedian: getCostByComplexity(stateCode, entry.slug, "simple"),
      complexMedian: getCostByComplexity(stateCode, entry.slug, "complex"),
      rank: rankOfMatter(entry.name)?.rank ?? null,
      rankedOutOf: rankOfMatter(entry.name)?.of ?? null,
      vsMidpointPercent: premiums.find((r) => r.name === entry.name)?.percent ?? null,
      hours: (() => {
        const row = getTierFigures(stateCode, entry.slug, "moderate");
        return row?.hourlyMedian && row.hourlyMedian > 0
          ? Math.round(row.median / row.hourlyMedian)
          : null;
      })(),
      above: (() => {
        const peers = peerFigures(entry.slug, "moderate").sort((a, b) => b.median - a.median);
        const index = peers.findIndex((r) => r.stateCode === stateCode);
        const prev = index > 0 ? peers[index - 1] : undefined;
        return prev ? STATE_MAP.get(prev.stateCode)?.name ?? prev.stateCode : null;
      })(),
    })),
    highestPremium: premiums[0] ?? null,
    lowestPremium: premiums.length > 1 ? premiums[premiums.length - 1]! : null,
    internalRatio:
      ownRatio !== null && peerRatio !== null
        ? { own: Math.round(ownRatio * 10) / 10, peer: Math.round(peerRatio * 10) / 10 }
        : null,
    matterRankCounts: {
      top: ranks.filter((r) => r.higher * 3 < r.of).length,
      bottom: ranks.filter((r) => r.higher * 3 >= r.of && r.lower * 3 < r.of).length,
      total: ranks.length,
    },
    categoryRankInState: index >= 0 ? matterHigher + 1 : 0,
    categoryHigherInState: matterHigher,
    categoryLowerInState: matterLower,
    categoryCountInState: ordered.length,
    categoryAbove: index > 0 ? ordered[index - 1]!.name : null,
    categoryBelow: index >= 0 && index < ordered.length - 1 ? ordered[index + 1]!.name : null,
    topCategory: ordered[0] ? { name: ordered[0].name, median: ordered[0].median } : null,
    strongestCategoryRank: sortedRanks[0] ?? null,
    weakestCategoryRank: sortedRanks.length > 1 ? sortedRanks[sortedRanks.length - 1]! : null,
  };
}

/**
 * Builds the per-entity context for a (state, category) pair, or null when the
 * pair has no moderate-complexity row (in which case callers render nothing
 * rather than a sentence with holes in it).
 */
export function buildStateCostContext(
  stateCode: string,
  categorySlug: string,
): StateCostContext | null {
  const stateInfo = STATE_MAP.get(stateCode);
  if (!stateInfo) return null;

  const moderatePeers = peerFigures(categorySlug, "moderate");
  if (moderatePeers.length === 0) return null;

  const own = moderatePeers.find((row) => row.stateCode === stateCode);
  if (!own) return null;

  const tiers: Partial<Record<Complexity, TierFacts>> = {};
  for (const complexity of TIERS) {
    const facts = buildTierFacts(stateCode, categorySlug, complexity);
    if (facts) tiers[complexity] = facts;
  }
  const simple = tiers.simple;
  const moderate = tiers.moderate;
  const complex = tiers.complex;
  if (!moderate) return null;

  const descending = [...moderatePeers].sort((a, b) => b.median - a.median);
  const position = descending.findIndex((row) => row.stateCode === stateCode) + 1;
  const statesHigher = moderatePeers.filter((row) => row.median > own.median).length;
  const statesLower = moderatePeers.filter((row) => row.median < own.median).length;
  const rank = statesHigher + 1;
  const peerMed = median(moderatePeers.map((row) => row.median));

  const vsPeerRaw = peerMed > 0 ? ((own.median - peerMed) / peerMed) * 100 : 0;
  const vsPeerPercent = Math.round(Math.abs(vsPeerRaw));
  const direction: StateCostContext["direction"] =
    vsPeerPercent < 1 ? "at" : vsPeerRaw > 0 ? "above" : "below";

  const nameOf = (code: string) => STATE_MAP.get(code)?.name ?? code;
  const aboveRow = descending[position - 2];
  const belowRow = descending[position];

  const fiveUp = descending
    .slice(Math.max(0, position - 6), Math.max(0, position - 1))
    .map((row) => ({ name: nameOf(row.stateCode), median: row.median }));
  const fiveDown = descending
    .slice(position, position + 5)
    .map((row) => ({ name: nameOf(row.stateCode), median: row.median }));

  const clusterPeers = moderatePeers
    .filter(
      (row) =>
        row.stateCode !== stateCode &&
        own.median > 0 &&
        Math.abs(row.median - own.median) / own.median <= 0.03,
    )
    .sort((a, b) => b.median - a.median)
    .map((row) => nameOf(row.stateCode));

  const hourlyRank = rankIn(moderatePeers, stateCode, "hourlyMedian");

  const rated = moderatePeers
    .filter((row) => row.hourlyMedian && row.hourlyMedian > 0)
    .sort((a, b) => b.hourlyMedian! - a.hourlyMedian!);
  const ownRateIndex = rated.findIndex((row) => row.stateCode === stateCode);
  const rateAbove = ownRateIndex > 0 ? rated[ownRateIndex - 1] : undefined;
  const rateBelow = ownRateIndex >= 0 ? rated[ownRateIndex + 1] : undefined;
  const sameRateStates =
    own.hourlyMedian && own.hourlyMedian > 0
      ? rated
          .filter((row) => row.stateCode !== stateCode && row.hourlyMedian === own.hourlyMedian)
          .map((row) => nameOf(row.stateCode))
      : [];

  const peerHours = moderatePeers
    .filter((row) => row.hourlyMedian && row.hourlyMedian > 0)
    .map((row) => Math.round(row.median / row.hourlyMedian!));

  const hoursMultiple =
    simple?.hours && complex?.hours && simple.hours > 0
      ? Math.round((complex.hours / simple.hours) * 10) / 10
      : null;
  const rateMultiple =
    simple?.hourlyMedian && complex?.hourlyMedian && simple.hourlyMedian > 0
      ? Math.round((complex.hourlyMedian / simple.hourlyMedian) * 100) / 100
      : null;
  const costMultiple =
    simple && complex && simple.median > 0
      ? Math.round((complex.median / simple.median) * 10) / 10
      : null;

  const selfIndex = position - 1;
  const peerWindow = descending
    .slice(Math.max(0, selfIndex - 6), selfIndex + 7)
    .map((row) => ({
      rank: strictRank(moderatePeers, row.median),
      name: nameOf(row.stateCode),
      median: row.median,
      isSelf: row.stateCode === stateCode,
    }));

  const rowsWithinTenPercent = {
    up: moderatePeers.filter(
      (row) => row.median > own.median && row.median <= own.median * 1.1,
    ).length,
    down: moderatePeers.filter(
      (row) => row.median < own.median && row.median >= own.median * 0.9,
    ).length,
  };

  const byName = (a: SeedTierFigures, b: SeedTierFigures) => nameOf(a.stateCode).localeCompare(nameOf(b.stateCode));
  const nearestHigher = moderatePeers.filter((row) => row.median > own.median).sort((a, b) => a.median - b.median || byName(a, b))[0];
  const nearestLower = moderatePeers.filter((row) => row.median < own.median).sort((a, b) => b.median - a.median || byName(a, b))[0];

  const quartileIndex = Math.min(3, Math.floor((statesLower / moderatePeers.length) * 4));

  return {
    stateName: stateInfo.name,
    rank,
    statesHigher,
    statesLower,
    rankedOutOf: moderatePeers.length,
    peerMedian: peerMed,
    vsPeerPercent,
    direction,
    dollarsFromPeerMedian: own.median - peerMed,
    quartile: (quartileIndex + 1) as 1 | 2 | 3 | 4,
    neighborAbove: aboveRow ? { name: nameOf(aboveRow.stateCode), median: aboveRow.median } : null,
    neighborBelow: belowRow ? { name: nameOf(belowRow.stateCode), median: belowRow.median } : null,
    clusterPeers,
    hourlyRank,
    ratedOutOf: rated.length,
    rankGap: hourlyRank === null ? null : rank - hourlyRank,
    peerMedianHours: peerHours.length ? median(peerHours) : null,
    peerMedianRate: rated.length ? median(rated.map((row) => row.hourlyMedian!)) : null,
    peerMedianBandWidth: median(moderatePeers.map((row) => Math.max(0, row.high - row.low))),
    tiers,
    tierRankShift:
      simple?.rank && complex?.rank ? simple.rank - complex.rank : null,
    hoursMultiple,
    rateMultiple,
    costMultiple,
    overlapSimpleModerate: simple && moderate ? simple.high >= moderate.low : null,
    overlapModerateComplex: moderate && complex ? moderate.high >= complex.low : null,
    sourceCount: own.sourceCount,
    hourlyNeighborAbove: rateAbove
      ? { name: nameOf(rateAbove.stateCode), rate: rateAbove.hourlyMedian! }
      : null,
    hourlyNeighborBelow: rateBelow
      ? { name: nameOf(rateBelow.stateCode), rate: rateBelow.hourlyMedian! }
      : null,
    sameRateStates,
    hoursRank: standingOf(
      rated.map((row) => ({ code: row.stateCode, value: row.median / row.hourlyMedian! })),
      stateCode,
    )?.rank ?? null,
    tableEnds:
      descending.length > 1
        ? {
            top: { name: nameOf(descending[0]!.stateCode), median: descending[0]!.median },
            bottom: {
              name: nameOf(descending[descending.length - 1]!.stateCode),
              median: descending[descending.length - 1]!.median,
            },
          }
        : null,
    fivePlaces: { up: fiveUp, down: fiveDown },
    rateWindow: rated
      .slice(Math.max(0, ownRateIndex - 2), ownRateIndex + 3)
      .map((row) => ({
        rank: 1 + rated.filter((other) => other.hourlyMedian! > row.hourlyMedian!).length,
        name: nameOf(row.stateCode),
        rate: row.hourlyMedian!,
        isSelf: row.stateCode === stateCode,
      })),
    percentile:
      moderatePeers.length > 1 ? Math.round((statesLower / (moderatePeers.length - 1)) * 100) : 100,
    peerWindow,
    rankSensitivity: {
      toPassAbove: aboveRow ? aboveRow.median - own.median : null,
      toDropBelow: belowRow ? own.median - belowRow.median : null,
    },
    rowsWithinTenPercent,
    rankEdges: {
      higher: nearestHigher ? { name: nameOf(nearestHigher.stateCode), median: nearestHigher.median } : null,
      lower: nearestLower ? { name: nameOf(nearestLower.stateCode), median: nearestLower.median } : null,
      tied: moderatePeers.filter((row) => row.stateCode !== stateCode && row.median === own.median).length,
    },
    ...crossCategoryFacts(stateCode, categorySlug),
  };
}

/* -------------------------------------------------------------------------
 * Sentence builders.
 *
 * Each returns a DIFFERENT sentence shape depending on which bucket this
 * state's own figures fall into, so two sibling pages differ structurally
 * rather than by number substitution alone. Every claim is literally true of
 * the bucket it is selected for, and every figure traces to the seed row.
 * ---------------------------------------------------------------------- */

const usd = (value: number) => formatCurrency(Math.round(value));

const countStates = (n: number) => `${n} ${n === 1 ? "state" : "states"}`;

const countPlaces = (n: number) => `${n} ${n === 1 ? "place" : "places"}`;

const hourWord = (n: number) => (n === 1 ? "hour" : "hours");

const tierMidpointGap = (median: number, midpoint: number, mode: "over-under" | "off") => {
  const gap = Math.round(Math.abs(median - midpoint));
  if (gap === 0) return `exactly on the ${usd(midpoint)} tier midpoint`;
  if (mode === "off") return `${usd(gap)} off the ${usd(midpoint)} tier midpoint`;
  return `${usd(gap)} ${median >= midpoint ? "over" : "under"} the ${usd(midpoint)} tier midpoint`;
};

/** Where the state sits in the table, and by how much. */
export function rankSentence(ctx: StateCostContext, matterLabel: string): string {
  const { stateName, rank, rankedOutOf, peerMedian, vsPeerPercent, dollarsFromPeerMedian, statesHigher, statesLower } = ctx;
  const gap = usd(Math.abs(dollarsFromPeerMedian));

  if (ctx.direction === "at") {
    return `${stateName} is the ${ordinal(rank)} of ${rankedOutOf} tracked states by median ${matterLabel} cost, and its ${usd(
      ctx.tiers.moderate!.median,
    )} figure lands within a percent of the ${usd(peerMedian)} midpoint of that table — the rank is meaningful, the distance is not.`;
  }

  switch (ctx.quartile) {
    case 1:
      return `Sorted by median cost, ${stateName} is ${ordinal(rank)} of ${rankedOutOf} for ${aOrAn(matterLabel)} ${matterLabel}, placing it in the lowest-cost quarter of the table: ${gap} and ${vsPeerPercent}% below the ${usd(
        peerMedian,
      )} midpoint, with ${statesLower === 0 ? "no state" : countStates(statesLower)} recording a lower median still.`;
    case 2:
      return `${stateName} ranks ${ordinal(rank)} of ${rankedOutOf} for ${aOrAn(matterLabel)} ${matterLabel}. Its ${usd(
        ctx.tiers.moderate!.median,
      )} median trails the ${usd(peerMedian)} table midpoint by ${gap}, which is ${vsPeerPercent}% — close enough that a single firm's quote can straddle both figures.`;
    case 3:
      return `At ${ordinal(rank)} of ${rankedOutOf}, ${stateName} sits above the midpoint of the ${matterLabel} table: ${gap} more than the ${usd(
        peerMedian,
      )} median state, or ${vsPeerPercent}%, with ${statesHigher === 0 ? "no state" : countStates(statesHigher)} recording a higher median.`;
    case 4:
    default:
      return `${stateName} ranks ${ordinal(rank)} of ${rankedOutOf} tracked states for ${aOrAn(matterLabel)} ${matterLabel}, inside the highest-cost quarter of the table. The gap to the ${usd(
        peerMedian,
      )} midpoint is ${gap} — ${vsPeerPercent}% — and ${
        statesHigher === 0
          ? "no state records a higher median"
          : `only ${countStates(statesHigher)} ${statesHigher === 1 ? "records" : "record"} a higher median`
      }.`;
  }
}

/** Which states bracket this one, by name. */
export function neighborSentence(ctx: StateCostContext, matterLabel: string): string | null {
  const { neighborAbove, neighborBelow, stateName } = ctx;
  const ownMedian = ctx.tiers.moderate!.median;
  if (!neighborAbove && !neighborBelow) return null;

  if (neighborAbove && neighborBelow) {
    const gapUp = neighborAbove.median - ownMedian;
    const gapDown = ownMedian - neighborBelow.median;
    const total = gapUp + gapDown;
    if (total === 0) {
      return `${neighborAbove.name} and ${neighborBelow.name} both record ${usd(
        ownMedian,
      )}, the same figure as ${stateName}, so its place among the three is a tie-break rather than a measured difference.`;
    }
    if (total <= ownMedian * 0.04) {
      return `${neighborAbove.name} (${usd(neighborAbove.median)}) and ${neighborBelow.name} (${usd(
        neighborBelow.median,
      )}) bracket ${stateName} inside a ${usd(total)} window — narrow enough that ${ordinal(
        ctx.rank,
      )} is close to arbitrary.`;
    }
    if (gapUp > gapDown * 2) {
      return `${neighborBelow.name} is the nearest state below at ${usd(
        neighborBelow.median,
      )} — ${gapDown === 0 ? "the same figure" : `${usd(gapDown)} away`} — while the next state up, ${neighborAbove.name}, is a wider ${usd(
        gapUp,
      )} step at ${usd(neighborAbove.median)}. ${stateName} therefore sits at the top edge of a band rather than in the middle of one.`;
    }
    if (gapDown > gapUp * 2) {
      return `${neighborAbove.name}, at ${usd(neighborAbove.median)}, is ${gapUp === 0 ? "level with" : `only ${usd(gapUp)} above`} ${stateName}, but the drop to ${neighborBelow.name} at ${usd(neighborBelow.median)} is ${usd(
        gapDown,
      )} — the state sits at the bottom edge of its group, with clear air beneath it.`;
    }
    return `In the ${matterLabel} table ${stateName} falls between ${neighborBelow.name} at ${usd(
      neighborBelow.median,
    )} and ${neighborAbove.name} at ${usd(neighborAbove.median)}, ${
      gapDown === 0 ? "level with" : `${usd(gapDown)} above`
    } the first and ${gapUp === 0 ? "level with" : `${usd(gapUp)} below`} the second.`;
  }

  if (!neighborAbove && neighborBelow) {
    return `No tracked state records a higher median ${matterLabel} figure than ${stateName}; the next state down is ${neighborBelow.name} at ${usd(
      neighborBelow.median,
    )}, ${ownMedian - neighborBelow.median === 0 ? "the same figure" : `${usd(ownMedian - neighborBelow.median)} lower`}.`;
  }

  return `No tracked state records a lower median ${matterLabel} figure than ${stateName}; the state immediately above is ${neighborAbove!.name} at ${usd(
    neighborAbove!.median,
  )}, ${neighborAbove!.median - ownMedian === 0 ? "the same figure" : `${usd(neighborAbove!.median - ownMedian)} higher`}.`;
}

/** How many peers cluster on the same figure. */
export function clusterSentence(ctx: StateCostContext, matterLabel: string): string | null {
  const { clusterPeers, stateName } = ctx;
  const ownMedian = ctx.tiers.moderate!.median;

  if (clusterPeers.length === 0) {
    return `Within three percent of ${stateName}'s ${usd(
      ownMedian,
    )} there is no other tracked state at all, so the figure is not part of a cluster and small changes to it would move the state several places.`;
  }
  if (clusterPeers.length === 1) {
    return `Only one other tracked state, ${clusterPeers[0]}, records a median within three percent of ${stateName}'s ${usd(
      ownMedian,
    )} — a pairing rather than a cluster.`;
  }
  if (clusterPeers.length <= 3) {
    return `${clusterPeers.join(", ")} record medians within three percent of ${stateName}'s ${usd(
      ownMedian,
    )}. ${aOrAn(matterLabel, true)} ${matterLabel} quote anywhere in that group is describing effectively the same market.`;
  }
  const named = clusterPeers.slice(0, 4).join(", ");
  return `${clusterPeers.length} tracked states — ${named} among them — record a median within three percent of ${stateName}'s ${usd(
    ownMedian,
  )}. The figure sits in the densest part of the ${matterLabel} distribution, where a rank change of several places costs only a few hundred dollars.`;
}

/** Rate rank against total rank — the two do not move together. */
export function hourlyPositionSentence(ctx: StateCostContext, matterLabel: string): string | null {
  const { hourlyRank, rankGap, rank, ratedOutOf, stateName } = ctx;
  const hourly = ctx.tiers.moderate!.hourlyMedian;
  if (hourlyRank === null || rankGap === null || !hourly) return null;

  const rateText = `${usd(hourly)} an hour`;

  if (rankGap === 0) {
    return `Ranked by hourly rate instead of by total, ${stateName} does not move: ${ordinal(
      hourlyRank,
    )} on both measures, at ${rateText}. Rate and total are telling the same story here.`;
  }
  if (rankGap >= 10) {
    return `Rate and total point in different directions. ${stateName} attorneys rank ${ordinal(
      hourlyRank,
    )} of ${ratedOutOf} at ${rateText}, ${rankGap} places above where the state lands on total ${matterLabel} cost (${ordinal(
      rank,
    )}) — on these figures, high rates are not accompanied by high totals.`;
  }
  if (rankGap >= 6) {
    return `The two rankings disagree sharply. ${stateName} attorneys sit ${ordinal(
      hourlyRank,
    )} of ${ratedOutOf} on hourly rate at ${rateText}, but the state is only ${ordinal(
      rank,
    )} on total ${matterLabel} cost — the estimates imply fewer billed hours than the rate alone would produce.`;
  }
  if (rankGap >= 3) {
    return `${stateName} ranks ${ordinal(hourlyRank)} of ${ratedOutOf} on hourly rate at ${rateText} and ${ordinal(
      rank,
    )} on total cost — ${rankGap} places apart, enough that the rate is a slightly optimistic guide to the total.`;
  }
  if (rankGap > 0) {
    return `The two measures nearly agree: ${ordinal(hourlyRank)} of ${ratedOutOf} on hourly rate at ${rateText}, ${ordinal(
      rank,
    )} on total cost, ${rankGap} ${rankGap === 1 ? "place" : "places"} apart.`;
  }
  if (rankGap <= -10) {
    return `The total is doing something the rate does not explain. ${stateName} sits ${ordinal(
      hourlyRank,
    )} of ${ratedOutOf} on rate at ${rateText} but ${ordinal(
      rank,
    )} on total ${matterLabel} cost, ${Math.abs(rankGap)} places higher — a sign that the estimates assume longer matters rather than higher prices.`;
  }
  if (rankGap <= -6) {
    return `Hourly rate does not explain this state's position. At ${rateText} ${stateName} is only ${ordinal(
      hourlyRank,
    )} of ${ratedOutOf} on rate, yet ${ordinal(
      rank,
    )} on total ${matterLabel} cost — the totals reflect billed hours accumulating, not an unusually high rate.`;
  }
  if (rankGap <= -3) {
    return `On hourly rate alone ${stateName} is ${ordinal(hourlyRank)} of ${ratedOutOf} at ${rateText}, ${Math.abs(
      rankGap,
    )} places behind its ${ordinal(rank)} position on total cost.`;
  }
  return `Rate and total sit ${Math.abs(rankGap)} ${
    Math.abs(rankGap) === 1 ? "place" : "places"
  } apart — ${ordinal(hourlyRank)} of ${ratedOutOf} at ${rateText} against ${ordinal(
    rank,
  )} on the ${matterLabel} total — which is close enough to read as the same signal.`;
}

/** Implied billable hours at the moderate tier, against the peer distribution. */
export function hoursSentence(ctx: StateCostContext, matterLabel: string): string | null {
  const moderate = ctx.tiers.moderate!;
  if (!moderate.hours || !moderate.hourlyMedian) return null;
  const { peerMedianHours, stateName } = ctx;
  const hours = moderate.hours;

  const comparison =
    peerMedianHours === null
      ? ""
      : hours > peerMedianHours
        ? ` The peer median is ${peerMedianHours} hours, so ${hours - peerMedianHours} more ${hourWord(hours - peerMedianHours)} of work ${hours - peerMedianHours === 1 ? "sits" : "sit"} behind the ${stateName} figure than behind the typical state's.`
        : hours < peerMedianHours
          ? ` The peer median is ${peerMedianHours} hours: ${stateName} reaches its total in ${
              peerMedianHours - hours
            } fewer implied ${hourWord(peerMedianHours - hours)}${
              ctx.peerMedianRate !== null && moderate.hourlyMedian > ctx.peerMedianRate
                ? `, because the rate rather than the workload carries more of it: ${usd(moderate.hourlyMedian)} an hour against a ${usd(ctx.peerMedianRate)} peer median.`
                : "."
            }`
          : ` That rounds to the same ${peerMedianHours} hours as the peer median, so on workload ${stateName} is indistinguishable from the middle of the table at this precision.`;

  if (hours >= 45) {
    return `Divide the ${usd(moderate.median)} median by the ${usd(
      moderate.hourlyMedian,
    )} median rate and the implied workload is about ${hours} billable hours — more than a full working week of attorney time on ${aOrAn(matterLabel)} ${matterLabel}.${comparison}`;
  }
  if (hours >= 25) {
    return `The ${usd(moderate.median)} median divided by the ${usd(
      moderate.hourlyMedian,
    )} median rate implies roughly ${hours} billable hours.${comparison}`;
  }
  if (hours >= 12) {
    return `At ${usd(moderate.hourlyMedian)} an hour, the ${usd(
      moderate.median,
    )} median represents about ${hours} hours of attorney time — a matter measured in days of work, not weeks.${comparison}`;
  }
  return `The ${usd(moderate.median)} median covers only about ${hours} ${hourWord(hours)} at the ${usd(
    moderate.hourlyMedian,
  )} median rate, so a single added hour moves the total by ${Math.round((moderate.hourlyMedian / moderate.median) * 100)}%.${comparison}`;
}

/**
 * The complexity step, decomposed. Cost multiple = hours multiple x rate
 * multiple; showing both factors separates "more work" from "pricier work",
 * and the hours factor is what varies between states.
 */
export function escalationSentence(ctx: StateCostContext, matterLabel: string): string | null {
  const simple = ctx.tiers.simple;
  const complex = ctx.tiers.complex;
  const { hoursMultiple, rateMultiple, costMultiple, stateName } = ctx;
  if (!simple || !complex || hoursMultiple === null || rateMultiple === null || costMultiple === null) {
    return null;
  }

  const arithmetic = `${simple.hours} hours at ${usd(simple.hourlyMedian!)} becomes ${complex.hours} hours at ${usd(
    complex.hourlyMedian!,
  )}`;

  if (hoursMultiple >= 5) {
    return `Moving from a simple to a complex ${matterLabel} multiplies the ${stateName} total by ${costMultiple}x, and most of that is hours rather than price: ${arithmetic}, so the workload grows ${hoursMultiple}x while the rate grows ${rateMultiple}x.`;
  }
  if (hoursMultiple >= 4.4) {
    return `The ${costMultiple}x step from the simple to the complex tier breaks down as ${hoursMultiple}x the hours against ${rateMultiple}x the rate — ${arithmetic}. Hours carry the larger part of the step, and the rate rises with them.`;
  }
  if (hoursMultiple >= 3.9) {
    return `${stateName} records a ${costMultiple}x gap between its simple and complex ${matterLabel} medians. Decomposed, that is ${hoursMultiple}x the billed time at ${rateMultiple}x the rate: ${arithmetic}.`;
  }
  return `A complex ${matterLabel} costs ${costMultiple}x a simple one in ${stateName}, and the implied workload rises under 3.9x — ${hoursMultiple}x, as ${arithmetic} — against a ${rateMultiple}x rise in the rate. Hours still carry the larger part of the increase.`;
}

/** How the state's rank moves as complexity rises — the strongest differentiator. */
export function trajectorySentence(ctx: StateCostContext, matterLabel: string): string | null {
  const simple = ctx.tiers.simple;
  const moderate = ctx.tiers.moderate!;
  const complex = ctx.tiers.complex;
  const { tierRankShift, stateName, rankedOutOf } = ctx;
  if (!simple?.rank || !complex?.rank || tierRankShift === null || !moderate.rank) return null;

  const path = `${ordinal(simple.rank)} at the simple tier, ${ordinal(moderate.rank)} at moderate, ${ordinal(
    complex.rank,
  )} at complex`;

  if (tierRankShift >= 10) {
    return `Rank is not stable across the tiers, and the direction matters. ${stateName} runs ${path} of ${rankedOutOf} — it climbs ${tierRankShift} places as the matter gets harder. Straightforward ${matterLabel} work is estimated at ordinary prices here; contested work is not.`;
  }
  if (tierRankShift >= 4) {
    return `${stateName} moves up the table as complexity rises: ${path}, a ${tierRankShift}-place climb. The state's position on the headline moderate figure understates where it sits once a matter is contested.`;
  }
  if (tierRankShift <= -10) {
    return `The tiers rank ${stateName} very differently. It is ${path} of ${rankedOutOf} — a fall of ${Math.abs(
      tierRankShift,
    )} places as the matter becomes harder. The state is expensive to start ${aOrAn(matterLabel)} ${matterLabel} in and comparatively ordinary to finish one in.`;
  }
  if (tierRankShift <= -4) {
    return `Ranked tier by tier, ${stateName} slides ${Math.abs(
      tierRankShift,
    )} places downward: ${path}. Its headline moderate position sits between the two extremes rather than summarising them.`;
  }
  return `The ranking barely moves across tiers — ${path} of ${rankedOutOf} — so ${stateName} keeps roughly the same relative position whether the ${matterLabel} is straightforward or contested.`;
}

/** Whether adjacent tiers' bands overlap: a structural yes/no that differs by state. */
export function overlapSentence(ctx: StateCostContext, matterLabel: string): string | null {
  const simple = ctx.tiers.simple;
  const moderate = ctx.tiers.moderate!;
  const complex = ctx.tiers.complex;
  const { overlapSimpleModerate, overlapModerateComplex, stateName } = ctx;
  if (!simple || !complex || overlapSimpleModerate === null || overlapModerateComplex === null) {
    return null;
  }

  if (overlapSimpleModerate && overlapModerateComplex) {
    return `The three bands are continuous in ${stateName}: the simple tier reaches ${usd(
      simple.high,
    )} where the moderate tier starts at ${usd(moderate.low)}, and the moderate tier reaches ${usd(
      moderate.high,
    )} where the complex tier starts at ${usd(
      complex.low,
    )}. A single quoted figure can therefore belong to two different tiers, and the tier label — not the number — is what identifies which.`;
  }
  if (overlapSimpleModerate && !overlapModerateComplex) {
    return `The lower two bands run into each other — the simple tier tops out at ${usd(
      simple.high,
    )} against a moderate floor of ${usd(
      moderate.low,
    )} — but there is a clear gap of ${usd(
      complex.low - moderate.high,
    )} between the moderate ceiling of ${usd(moderate.high)} and the complex floor of ${usd(
      complex.low,
    )}. In ${stateName} the jump into contested work is a step, not a slope.`;
  }
  if (!overlapSimpleModerate && overlapModerateComplex) {
    return `${usd(moderate.low - simple.high)} separates the simple ceiling of ${usd(
      simple.high,
    )} from the moderate floor of ${usd(
      moderate.low,
    )}, so the first escalation is a clean break, while the moderate and complex bands overlap from ${usd(
      complex.low,
    )} upward. The expensive end of a routine ${matterLabel} and the cheap end of a contested one are the same money in ${stateName}.`;
  }
  return `Neither pair of adjacent bands touches: ${usd(moderate.low - simple.high)} of clear space between the simple and moderate tiers, and ${usd(
    complex.low - moderate.high,
  )} between the moderate and complex tiers. Every ${matterLabel} estimate for ${stateName} maps to exactly one tier, which makes the tier label unusually informative here.`;
}

/** The absolute width of the quoted band, and what it buys in hours. */
export function bandSentence(ctx: StateCostContext, matterLabel: string): string | null {
  const moderate = ctx.tiers.moderate!;
  const { peerMedianBandWidth, stateName } = ctx;
  if (moderate.bandWidth <= 0) return null;

  const extraHours =
    moderate.hourlyMedian && moderate.hourlyMedian > 0
      ? Math.round(moderate.bandWidth / moderate.hourlyMedian)
      : null;
  const hoursClause = extraHours
    ? ` End to end that is ${extraHours} hours at ${usd(moderate.hourlyMedian!)}.`
    : "";

  const delta = moderate.bandWidth - peerMedianBandWidth;
  if (peerMedianBandWidth > 0 && delta > peerMedianBandWidth * 0.15) {
    return `In dollars the ${stateName} moderate band is wide: ${usd(moderate.low)} to ${usd(
      moderate.high,
    )}, a ${usd(moderate.bandWidth)} range, ${usd(delta)} wider than the peer-median band of ${usd(
      peerMedianBandWidth,
    )}.${hoursClause}`;
  }
  if (peerMedianBandWidth > 0 && delta < -peerMedianBandWidth * 0.15) {
    return `The ${stateName} moderate band spans ${usd(moderate.low)} to ${usd(
      moderate.high,
    )} — ${usd(moderate.bandWidth)} — which is ${usd(
      Math.abs(delta),
    )} narrower than the peer-median band of ${usd(
      peerMedianBandWidth,
    )}, so quoted ${matterLabel} figures cluster more tightly here than in most tracked states.${hoursClause}`;
  }
  return `From ${usd(moderate.low)} to ${usd(moderate.high)} the moderate band is ${usd(
    moderate.bandWidth,
  )} wide, close to the ${usd(peerMedianBandWidth)} peer median.${hoursClause}`;
}

/** What the median works out to per month of the recorded timeline. */
export function tempoSentence(ctx: StateCostContext, matterLabel: string): string | null {
  const moderate = ctx.tiers.moderate!;
  if (!moderate.durationMonths || moderate.durationMonths <= 0 || !moderate.duration) return null;
  const perMonth = Math.round(moderate.median / moderate.durationMonths);
  const complex = ctx.tiers.complex;
  const { stateName } = ctx;

  if (complex?.durationMonths && complex.durationMonths > 0) {
    const complexPerMonth = Math.round(complex.median / complex.durationMonths);
    if (complexPerMonth > perMonth * 1.1) {
      return `The estimate assumes ${moderate.duration} for a moderate ${matterLabel} — a national duration for this matter and complexity, not one specific to ${stateName} — and across it the ${usd(
        moderate.median,
      )} median works out to roughly ${usd(perMonth)} a month. A complex ${matterLabel} is assumed to run longer, at ${
        complex.duration
      }, but it also runs hotter — about ${usd(
        complexPerMonth,
      )} a month — so the extra cost is not simply the extra calendar time.`;
    }
    if (complexPerMonth < perMonth * 0.9) {
      return `The ${usd(moderate.median)} median across ${
        moderate.duration
      }, the national duration the estimate assumes for a moderate ${matterLabel}, is about ${usd(perMonth)} a month. A complex ${matterLabel} costs more in total but less per month — roughly ${usd(
        complexPerMonth,
      )} across the ${complex.duration} it assumes — because the additional cost arrives as a longer timeline rather than a heavier monthly burn.`;
    }
    return `Per month of elapsed time the two tiers are close: the ${usd(moderate.median)} moderate median is about ${usd(
      perMonth,
    )} a month across the ${moderate.duration} assumed for a moderate matter, and the ${usd(
      complex.median,
    )} complex median is ${usd(complexPerMonth)} a month across the ${
      complex.duration
    } assumed for a complex one. Both durations are national figures for this matter, not specific to ${stateName}.`;
  }

  return `Across the ${moderate.duration} the estimate assumes for a moderate matter (a national figure for this matter and complexity, not specific to ${stateName}), the ${usd(
    moderate.median,
  )} median is roughly ${usd(perMonth)} a month of elapsed time.`;
}

/** Where this matter type sits among the tracked matter types in the same state. */
export function categoryMixSentence(ctx: StateCostContext, matterLabel: string): string | null {
  const {
    categoryRankInState,
    categoryHigherInState,
    categoryLowerInState,
    categoryCountInState,
    categoryAbove,
    categoryBelow,
    topCategory,
    stateName,
  } = ctx;
  if (!categoryRankInState || categoryCountInState < 2) return null;
  const ownMedian = ctx.tiers.moderate!.median;
  const level = (name: string | null) => ctx.categoryTable.find((row) => row.name === name)?.median === ownMedian;

  if (categoryHigherInState === 0 && categoryBelow) {
    return `Against the other matter types tracked in ${stateName}, ${aOrAn(matterLabel)} ${matterLabel} carries the largest median of the ${categoryCountInState} at ${usd(
      ownMedian,
    )} — ${level(categoryBelow) ? "level with" : "ahead of"} ${categoryBelow}, the next line down.`;
  }
  if (categoryLowerInState === 0 && categoryAbove) {
    return `Among the ${categoryCountInState} matter types tracked in ${stateName}, ${aOrAn(matterLabel)} ${matterLabel} records the smallest median at ${usd(
      ownMedian,
    )}, ${level(categoryAbove) ? "level with" : "below"} ${categoryAbove} on the line above.`;
  }
  const shareClause =
    topCategory && topCategory.median > 0
      ? ` At ${Math.round((ownMedian / topCategory.median) * 100)}% of ${topCategory.name} (${usd(
          topCategory.median,
        )}).`
      : "";
  if (categoryRankInState <= Math.ceil(categoryCountInState / 3)) {
    return `${usd(ownMedian)} ranks ${aOrAn(matterLabel)} ${matterLabel} ${ordinal(
      categoryRankInState,
    )} of ${categoryCountInState} in ${stateName}, ${level(categoryAbove) ? "level with" : "under"} ${categoryAbove}, ${level(categoryBelow) ? "level with" : "over"} ${categoryBelow}.${shareClause}`;
  }
  return `In ${stateName} ${aOrAn(matterLabel)} ${matterLabel} is ${ordinal(categoryRankInState)} of ${categoryCountInState} at ${usd(
    ownMedian,
  )}, between ${categoryAbove} and ${categoryBelow}.${shareClause}`;
}

/** How consistently the state ranks across the matter types it is tracked for. */
export function consistencySentence(ctx: StateCostContext, matterLabel: string): string | null {
  const { strongestCategoryRank, weakestCategoryRank, rank, stateName } = ctx;
  if (!strongestCategoryRank || !weakestCategoryRank) return null;
  const spread = weakestCategoryRank.rank - strongestCategoryRank.rank;
  if (spread <= 0) return null;

  const ownPosition = `its ${ordinal(rank)} on ${matterLabel}`;

  if (spread <= 5) {
    return `${stateName} is consistent across practice areas: over the matter types tracked here its rank only moves between ${ordinal(
      strongestCategoryRank.rank,
    )} (${strongestCategoryRank.name}) and ${ordinal(weakestCategoryRank.rank)} (${
      weakestCategoryRank.name
    }), so ${ownPosition} reflects a general price level rather than something specific to this matter.`;
  }
  if (spread <= 14) {
    return `Across practice areas ${stateName} ranges from ${ordinal(strongestCategoryRank.rank)} of ${strongestCategoryRank.of} for ${
      strongestCategoryRank.name
    } to ${ordinal(weakestCategoryRank.rank)} of ${weakestCategoryRank.of} for ${
      weakestCategoryRank.name
    } — a ${spread}-place spread, with ${ownPosition} inside it.`;
  }
  return `The state does not rank uniformly. ${stateName} is ${ordinal(strongestCategoryRank.rank)} of ${strongestCategoryRank.of} for ${
    strongestCategoryRank.name
  } but ${ordinal(weakestCategoryRank.rank)} of ${weakestCategoryRank.of} for ${
    weakestCategoryRank.name
  }, a ${spread}-place spread across the matter types tracked here, so ${ownPosition} says little about what the other lines cost.`;
}

/**
 * How far the recorded median would have to move to change the ranking, and
 * how crowded this part of the table is. Both are properties of where the
 * state sits in the distribution, so both differ page to page.
 */
export function sensitivitySentence(ctx: StateCostContext, matterLabel: string): string | null {
  const { rankSensitivity, rowsWithinTenPercent, stateName, rank } = ctx;
  const { toPassAbove, toDropBelow } = rankSensitivity;
  if (toPassAbove === null && toDropBelow === null) return null;

  const crowd = rowsWithinTenPercent.up + rowsWithinTenPercent.down;
  const { up, down } = rowsWithinTenPercent;

  if (toPassAbove === 0 || toDropBelow === 0) {
    return `Another tracked state records exactly ${usd(
      ctx.tiers.moderate!.median,
    )} for ${aOrAn(matterLabel)} ${matterLabel}, so the order among the states sharing that figure is a tie-break rather than a measured difference. Within ten percent of that figure the field holds ${up} above and ${down} below.`;
  }

  const nextUp = ctx.neighborAbove?.name;
  const nextDown = ctx.neighborBelow?.name;
  const moveClause =
    toPassAbove !== null && toDropBelow !== null
      ? `${usd(toPassAbove)} up reaches ${nextUp} and ${usd(toDropBelow)} down reaches ${nextDown}`
      : toPassAbove !== null
        ? `${usd(toPassAbove)} more reaches ${nextUp}`
        : `${usd(toDropBelow!)} less reaches ${nextDown}`;

  if (crowd >= 7 && down > up * 1.5) {
    return `The states within ten percent are lopsided: ${down} below ${stateName} against ${up} above. ${moveClause}, so a downward revision would cost the state far more places than an equivalent upward one would gain — the ${ordinal(
      rank,
    )} position is propped up by a thin ${matterLabel} field above it and a crowded one beneath.`;
  }
  if (crowd >= 7 && up > down * 1.5) {
    return `Within ten percent of the ${stateName} figure there are ${up} states above and only ${down} below. ${moveClause}, which means the ranking has far more room to improve than to slip: the ${matterLabel} field is dense overhead and sparse underneath.`;
  }
  if (crowd >= 14) {
    return `The ${ordinal(rank)} position is not a stable fact about ${stateName}: ${moveClause}, and a ten percent revision in either direction would cross ${crowd} states, ${up} above and ${down} below in near-equal numbers.`;
  }
  if (crowd >= 7) {
    return `${moveClause}. A ten percent revision to the underlying figure would cross ${crowd} states in total — ${up} up, ${down} down — so the rank reads better as a band than as a precise place.`;
  }
  if (crowd === 0) {
    return `${moveClause}, and no other tracked state sits within ten percent of the ${stateName} figure. The position is well separated from its neighbours.`;
  }
  return `${moveClause}, and only ${countStates(crowd)} ${crowd === 1 ? "sits" : "sit"} within ten percent of the ${stateName} figure: ${up} above it and ${down} below. The position is comparatively well separated from its neighbours.`;
}

/**
 * Assumption items, SELECTED by this state's own figures. Different states
 * qualify for different items, receive them in a different order, and each item
 * carries the state's numbers — so the list is not a fixed block of prose. The
 * pool is deliberately larger than the number of items any one page renders,
 * and the two universal caveats are themselves written in alternatives, because
 * a shared closing block was one of the largest identical passages a 5-gram
 * measurement found between two sibling pages.
 */
export function assumptionItems(ctx: StateCostContext, matterLabel: string): string[] {
  const moderate = ctx.tiers.moderate!;
  const simple = ctx.tiers.simple;
  const complex = ctx.tiers.complex;
  const conditional: string[] = [];
  const near = ctx.clusterPeers.length;

  if (near >= 4) {
    conditional.push(
      `${near} tracked states record a median within three percent of ${usd(moderate.median)} — about ${usd(
        moderate.median * 0.03,
      )} either way — so a revision of that size could move ${ctx.stateName} past as many as ${near} places.`,
    );
  } else if (near === 0) {
    conditional.push(
      `No other tracked state's median is within three percent of ${usd(
        moderate.median,
      )}, so the rank would hold under a revision of that size, but there is no state that close to cross-check the figure against.`,
    );
  } else {
    const names =
      near === 1 ? ctx.clusterPeers[0]! : `${ctx.clusterPeers.slice(0, -1).join(", ")} and ${ctx.clusterPeers[near - 1]}`;
    conditional.push(
      `${names} ${near === 1 ? "records a median" : "record medians"} within three percent of ${usd(
        moderate.median,
      )}; no other state is close enough to corroborate it.`,
    );
  }

  if (ctx.rankGap !== null && Math.abs(ctx.rankGap) >= 6) {
    conditional.push(
      `Rate and total disagree by ${Math.abs(ctx.rankGap)} places (${ordinal(
        ctx.hourlyRank!,
      )} on rate against ${ordinal(ctx.rank)} on total), so the ${usd(
        moderate.hourlyMedian ?? 0,
      )} rate alone is a poor guide to the ${usd(moderate.median)} total.`,
    );
  } else if (ctx.rankGap === 0) {
    conditional.push(
      `Rate and total both rank ${ctx.stateName} ${ordinal(
        ctx.rank,
      )}, which makes ${usd(moderate.hourlyMedian ?? 0)} a workable shorthand here — it is not one everywhere in our cost figures.`,
    );
  } else if (ctx.rankGap !== null) {
    conditional.push(
      `Rate and total sit ${countPlaces(Math.abs(ctx.rankGap))} apart (${ordinal(
        ctx.hourlyRank!,
      )} against ${ordinal(ctx.rank)}); close, but not the same measurement.`,
    );
  }

  if (ctx.overlapSimpleModerate && simple) {
    conditional.push(
      `${
        moderate.low === simple.high ? usd(moderate.low) : `${usd(moderate.low)}–${usd(simple.high)}`
      } belongs to both bands; the tier, not the figure, separates them.`,
    );
  } else if (simple) {
    conditional.push(
      `A quote between ${usd(simple.high)} and ${usd(
        moderate.low,
      )} falls in the gap between two estimated bands, and this page does not describe it.`,
    );
  }

  if (ctx.overlapModerateComplex && complex) {
    conditional.push(
      `The moderate band reaches ${usd(moderate.high)} while the complex band starts at ${usd(
        complex.low,
      )}: the same money buys different work at the two tiers.`,
    );
  } else if (complex) {
    conditional.push(
      `${usd(
        complex.low - moderate.high,
      )} of clear space separates the moderate ceiling from the complex floor, so escalation is a jump rather than a drift.`,
    );
  }

  if (ctx.tierRankShift !== null && Math.abs(ctx.tierRankShift) >= 8) {
    conditional.push(
      `"The ${ctx.stateName} rank" is ambiguous by ${Math.abs(
        ctx.tierRankShift,
      )} places unless a tier is named: ${ordinal(simple?.rank ?? ctx.rank)} simple, ${ordinal(
        ctx.rank,
      )} moderate, ${ordinal(complex?.rank ?? ctx.rank)} complex.`,
    );
  }

  if (moderate.hours && moderate.hours >= 35) {
    conditional.push(
      `The ${moderate.hours} implied hours are arithmetic, not a timesheet: they treat all of ${usd(
        moderate.median,
      )} as attorney time at ${usd(moderate.hourlyMedian ?? 0)}, although a total can include costs other than attorney time.`,
    );
  } else if (moderate.hours) {
    conditional.push(
      `${usd(moderate.median)} ÷ ${usd(moderate.hourlyMedian ?? 0)} comes to about ${
        moderate.hours
      } hours — an arithmetic implication of the estimate for ${aOrAn(matterLabel)} ${matterLabel}, not a timesheet.`,
    );
  }

  const { higher, lower, tied } = ctx.rankEdges;
  const legalFees = `Legal fees change over time, and any change since these estimates were modeled is absent from the ${usd(
    moderate.median,
  )} median.`;
  const rankItem =
    ctx.rank > Math.round(ctx.rankedOutOf / 2)
      ? legalFees
      : higher
        ? `A rise of ${usd(higher.median - moderate.median)} in the ${ctx.stateName} median, to the ${usd(
            higher.median,
          )} that ${higher.name} records, would move it up from ${ordinal(ctx.rank)}.`
        : tied > 0
          ? `${ctx.stateName} holds ${ordinal(ctx.rank)} with no state above it, but ${
              tied === 1 ? "another state records" : `${tied} other states record`
            } the same ${usd(moderate.median)}, so any fall in its figure would lower its rank.`
          : lower
            ? `${ctx.stateName} holds ${ordinal(ctx.rank)} with no state above it; a fall of more than ${usd(
                moderate.median - lower.median,
              )}, below the ${usd(lower.median)} that ${lower.name} records, would be needed to lower its rank.`
            : legalFees;

  const universal = [
    ctx.quartile >= 3
      ? `The ${usd(moderate.low)}–${usd(moderate.high)} band is a single statewide estimate for ${
          ctx.stateName
        }, with no county-level figures behind it, so a quote above ${usd(
          moderate.high,
        )} is a comparison with a model rather than a finding about any county.`
      : `The ${usd(moderate.low)}–${usd(
          moderate.high,
        )} band is one statewide estimate with no county breakdown behind it, so a quote outside it is not by itself evidence of anything.`,
    rankItem,
  ];

  return [...conditional, ...universal];
}

/**
 * The opening "what is actually recorded" block. Deliberately describes THIS
 * state's composition rather than the general methodology, which lives once on
 * the legal-fees guide instead of being restated on every programmatic page.
 * The connective phrasing is chosen by quartile so that two states in different
 * parts of the table introduce their rows differently.
 */
export function datasetSentences(ctx: StateCostContext): string[] {
  const moderate = ctx.tiers.moderate!;
  const simple = ctx.tiers.simple;
  const complex = ctx.tiers.complex;
  const out: string[] = [];

  const rate = (tier: TierFacts) =>
    tier.hourlyMedian && tier.hourlyMedian > 0
      ? ` at ${usd(tier.hourlyLow ?? 0)}–${usd(tier.hourlyHigh ?? 0)}/hr`
      : "";
  const hourlyMatter = Boolean(moderate.hourlyMedian && moderate.hourlyMedian > 0);

  const tierParts: string[] = [];
  if (simple) {
    tierParts.push(
      `simple, ${usd(simple.low)}–${usd(simple.high)}${rate(simple)}${simple.duration ? ` over ${simple.duration}` : ""}`,
    );
  }
  tierParts.push(
    `moderate, ${usd(moderate.low)}–${usd(moderate.high)}${rate(moderate)}${moderate.duration ? ` over ${moderate.duration}` : ""}`,
  );
  if (complex) {
    tierParts.push(
      `complex, ${usd(complex.low)}–${usd(complex.high)}${rate(complex)}${complex.duration ? ` over ${complex.duration}` : ""}`,
    );
  }

  const estimates = `${ctx.stateName} carries ${tierParts.length} ${
    hourlyMatter ? "cost estimates" : "estimates of case expenses"
  } — ${tierParts.join("; ")} — on ${ctx.sourceCount} shared ${
    ctx.sourceCount === 1 ? "citation" : "citations"
  }.`;

  switch (ctx.quartile) {
    case 1:
      out.push(`${estimates} Those figures place it in the lower quarter of the table.`);
      break;
    case 2:
      out.push(`${estimates} They put it at or below the midpoint of the table without reaching the bottom quarter.`);
      break;
    case 3:
      out.push(`${estimates} They put it at or above the midpoint, short of the top quarter.`);
      break;
    default:
      out.push(`${estimates} Those figures put it in the top quarter of the table.`);
  }

  const floorGap = moderate.median - moderate.low;
  const ceilingGap = moderate.high - moderate.median;
  out.push(
    `${usd(moderate.median)} is a median, not the middle of the band — ${usd(
      floorGap,
    )} above the ${usd(moderate.low)} floor, ${usd(ceilingGap)} under the ${usd(
      moderate.high,
    )} ceiling. Ranks for this matter are out of ${ctx.rankedOutOf}; the matter-type table gives each matter its own count.`,
  );

  return out;
}

/**
 * The ranked neighbourhood at the OTHER two tiers. The states bracketing a
 * given state change tier by tier — a state can be surrounded by one set of
 * peers on straightforward matters and a completely different set on contested
 * ones — so these sentences carry names and figures that the moderate-tier
 * paragraphs above do not.
 */
export function tierNeighborSentences(ctx: StateCostContext, matterLabel: string): string[] {
  const out: string[] = [];
  const simple = ctx.tiers.simple;
  const complex = ctx.tiers.complex;

  if (simple?.rank && simple.neighborAbove && simple.neighborBelow) {
    const above = simple.neighborAbove;
    const below = simple.neighborBelow;
    out.push(
      `${usd(simple.median)} is ${ordinal(simple.rank)} of ${
        ctx.rankedOutOf
      } on a straightforward ${matterLabel}, ${above.median === simple.median ? "level with" : "under"} ${above.name} (${usd(
        above.median,
      )}) and ${below.median === simple.median ? "level with" : "over"} ${below.name} (${usd(below.median)}), ${tierMidpointGap(
        simple.median,
        simple.peerMedian,
        "over-under",
      )}.`,
    );
  } else if (simple?.rank) {
    out.push(
      `At the simple tier ${ctx.stateName} records ${usd(simple.median)} and ranks ${ordinal(
        simple.rank,
      )} of ${ctx.rankedOutOf}, against a tier midpoint of ${usd(simple.peerMedian)}.`,
    );
  }

  if (complex?.rank && complex.neighborAbove && complex.neighborBelow) {
    const above = complex.neighborAbove;
    const below = complex.neighborBelow;
    out.push(
      `${usd(complex.median)} is ${ordinal(complex.rank)} of ${
        ctx.rankedOutOf
      } once contested, between ${above.name} (${usd(above.median)}) and ${below.name} (${usd(
        below.median,
      )}), ${tierMidpointGap(complex.median, complex.peerMedian, "off")}.`,
    );
  } else if (complex?.rank) {
    out.push(
      `At the complex tier ${ctx.stateName} records ${usd(complex.median)} for ${ordinal(
        complex.rank,
      )} of ${ctx.rankedOutOf}, against a tier midpoint of ${usd(complex.peerMedian)}.`,
    );
  }

  return out;
}

/**
 * Whether this state is uniformly priced across practice areas, or carries a
 * much larger premium in some than in others. Which matter types sit at each
 * end differs by state, and so does the size of the spread between them.
 */
export function premiumSentence(ctx: StateCostContext): string | null {
  const { highestPremium, lowestPremium, stateName } = ctx;
  if (!highestPremium || !lowestPremium || highestPremium.name === lowestPremium.name) return null;

  const describe = (entry: { name: string; percent: number }) =>
    entry.percent === 0
      ? `${entry.name} sits within a percent of its own midpoint`
      : entry.percent > 0
        ? `${entry.name} runs ${entry.percent}% above its own midpoint`
        : `${entry.name} runs ${Math.abs(entry.percent)}% below its own midpoint`;

  const spread = highestPremium.percent - lowestPremium.percent;

  if (spread <= 8) {
    return `The premium ${stateName} carries is close to uniform across practice areas: ${describe(
      highestPremium,
    )} and ${describe(
      lowestPremium,
    )}, only ${spread} percentage points apart. Whatever drives the state's price level applies to every matter type here at roughly the same strength.`;
  }
  if (spread <= 20) {
    return `${stateName} is not equally priced in every practice area. Measured against each matter's own midpoint, ${describe(
      highestPremium,
    )} while ${describe(lowestPremium)} — a ${spread}-point spread between the extremes.`;
  }
  const closing =
    highestPremium.percent > 0 && lowestPremium.percent < 0
      ? ` A single "${stateName} is expensive" or "${stateName} is inexpensive" claim would be wrong for at least one of the matter types tracked here.`
      : lowestPremium.percent > 0
        ? " Every tracked matter type runs above its own midpoint here, so the difference is one of degree."
        : highestPremium.percent < 0
          ? " Every tracked matter type runs below its own midpoint here, so the difference is one of degree."
          : "";
  return `The spread across practice areas is wide. ${describe(
    highestPremium,
  )[0]!.toUpperCase()}${describe(highestPremium).slice(1)}, while ${describe(
    lowestPremium,
  )} — ${spread} percentage points apart.${closing}`;
}

/**
 * The rate ranking is a separate table from the cost ranking, with a different
 * set of states around this one and — because 51 states share far fewer
 * distinct median rates than distinct medians — an identifiable group of states
 * recording exactly the same rate. Both are per-state facts the cost ranking
 * does not carry.
 */
export function rateGroupSentences(ctx: StateCostContext, matterLabel: string): string[] {
  const moderate = ctx.tiers.moderate!;
  if (!moderate.hourlyMedian || ctx.hourlyRank === null) return [];
  const out: string[] = [];

  const above = ctx.hourlyNeighborAbove;
  const below = ctx.hourlyNeighborBelow;
  if (above && below) {
    out.push(
      `${usd(
        moderate.hourlyMedian,
      )} an hour puts ${ctx.stateName} between ${above.name} (${usd(above.rate)}) and ${below.name} (${usd(
        below.rate,
      )}) — not the ${matterLabel} cost pairing.`,
    );
  } else if (above) {
    out.push(
      `No tracked state records a lower median rate than ${ctx.stateName}'s ${usd(
        moderate.hourlyMedian,
      )}; the next state up is ${above.name} at ${usd(above.rate)}.`,
    );
  } else if (below) {
    out.push(
      `${ctx.stateName}'s ${usd(
        moderate.hourlyMedian,
      )} median rate is the highest of the tracked states; the next one down is ${below.name} at ${usd(below.rate)}.`,
    );
  }

  if (ctx.sameRateStates.length === 0) {
    out.push(
      `No other tracked state records ${usd(
        moderate.hourlyMedian,
      )} as its median rate, so the figure identifies ${ctx.stateName} on its own among the tracked states.`,
    );
  } else if (ctx.sameRateStates.length <= 3) {
    out.push(
      `${ctx.sameRateStates.join(", ")} ${
        ctx.sameRateStates.length === 1 ? "records" : "record"
      } the same ${usd(
        moderate.hourlyMedian,
      )}: rate cannot separate them, totals do.`,
    );
  } else {
    out.push(
      `${ctx.sameRateStates.length} other states record exactly ${usd(
        moderate.hourlyMedian,
      )} — ${ctx.sameRateStates.slice(0, 4).join(", ")} among them — so rate is a coarse instrument in this ${matterLabel} table.`,
    );
  }

  const simple = ctx.tiers.simple;
  const complex = ctx.tiers.complex;
  if (simple?.hourlyMedian && complex?.hourlyMedian) {
    out.push(
      `${usd(moderate.median)} buys ${Math.round(
        moderate.median / simple.hourlyMedian,
      )} hours at ${usd(simple.hourlyMedian)}, ${moderate.hours ?? 0} at ${usd(
        moderate.hourlyMedian,
      )}, ${Math.round(moderate.median / complex.hourlyMedian)} at ${usd(
        complex.hourlyMedian,
      )}.`,
    );
  }

  return out;
}

/** One worked calculation: a bolded lead-in and the body prose. */
export interface CalculationBlock {
  lead: string;
  body: string;
}

/**
 * Three calculations from this state's own rows. Each has alternative FORMS
 * selected by the state's figures, so sibling pages do not merely substitute
 * numbers into one fixed worked example — the arithmetic being demonstrated
 * differs as well.
 */
export function calculationBlocks(ctx: StateCostContext, matterLabel: string): CalculationBlock[] {
  const simple = ctx.tiers.simple;
  const moderate = ctx.tiers.moderate!;
  const complex = ctx.tiers.complex;
  const blocks: CalculationBlock[] = [];

  /* 1 — the simple tier, framed either by time or by the gap to moderate. */
  if (simple?.hours && simple.hourlyMedian && moderate.hours) {
    const hourGap = moderate.hours - simple.hours;
    const moneyGap = moderate.median - simple.median;
    if (simple.durationMonths && simple.durationMonths > 0) {
      blocks.push({
        lead: "Simple tier.",
        body: `${usd(simple.median)} ÷ ${usd(simple.hourlyMedian)} = about ${
          simple.hours
        } hours, spread over the assumed ${simple.duration} at roughly ${usd(
          simple.median / simple.durationMonths,
        )} a month. The ${usd(moneyGap)} step to the moderate tier raises the implied hours from ${simple.hours} to ${
          moderate.hours
        }, ${hourGap} more, at the moderate tier's own ${usd(moderate.hourlyMedian!)} rate.`,
      });
    } else {
      blocks.push({
        lead: "Simple tier.",
        body: `${usd(simple.median)} ÷ ${usd(simple.hourlyMedian)} = about ${
          simple.hours
        } hours — ${hourGap} fewer than the moderate tier's ${moderate.hours}, and ${usd(
          moneyGap,
        )} less.`,
      });
    }
  }

  /* 2 — the complexity step, decomposed into work and price. */
  if (complex?.hours && moderate.hours && complex.hourlyMedian && moderate.hourlyMedian) {
    const addedHours = complex.hours - moderate.hours;
    const workEffect = addedHours * moderate.hourlyMedian;
    const rateEffect = complex.hours * (complex.hourlyMedian - moderate.hourlyMedian);
    const parts = workEffect + rateEffect;
    const workShare = Math.round((workEffect / parts) * 100);
    const priceShare = 100 - workShare;
    const gap = complex.median - moderate.median;
    const opening = `${usd(moderate.median)} to ${usd(complex.median)} is a ${usd(gap)} step`;
    const workText = `${addedHours} more ${addedHours === 1 ? "hour" : "hours"} at ${usd(moderate.hourlyMedian)} is ${usd(workEffect)}`;
    const priceText = `${usd(complex.hourlyMedian)} across ${complex.hours} hours adds ${usd(rateEffect)}`;
    const rounding =
      parts === gap ? "" : ` (the two parts come to ${usd(parts)} because the hours are rounded to whole numbers)`;
    blocks.push({
      lead: "Work against price.",
      body:
        addedHours <= 0
          ? `${opening} carried by price, not work: the implied hours ${
              addedHours === 0 ? `stay at ${complex.hours}` : `fall from ${moderate.hours} to ${complex.hours}`
            }, while the rate moves from ${usd(moderate.hourlyMedian)} to ${usd(complex.hourlyMedian)}.`
          : workShare >= 60
            ? `${opening}, mostly work: ${workText}, while moving to ${priceText}. Work carries ${workShare}%${rounding}.`
            : priceShare >= 60
              ? `${opening} weighted toward price: ${workText}, but ${priceText}. Price carries ${priceShare}%${rounding}.`
              : `${opening} split between work and price: ${workText}, and ${priceText}. Work carries ${workShare}% and price ${priceShare}%${rounding}.`,
    });
  }

  /* 3 — the cost of using the wrong reference figure. */
  const above = ctx.neighborAbove;
  const below = ctx.neighborBelow;
  const nationalError = Math.abs(ctx.dollarsFromPeerMedian);
  if (above && below) {
    const overAbove = above.median - moderate.median;
    const underBelow = moderate.median - below.median;
    const worst = Math.max(overAbove, underBelow);
    const errorTail =
      worst === 0
        ? ""
        : worst < Math.max(50, moderate.median * 0.01)
          ? `, against at most ${usd(worst)} for the two neighbours`
          : `, ${Math.round(nationalError / worst)}x the larger neighbour error`;
    blocks.push({
      lead: "Borrowing the wrong figure.",
      body:
        nationalError > worst * 4
          ? `${below.name} (${usd(below.median)}) ${
              underBelow === 0 ? "matches this state exactly" : `is ${usd(underBelow)} light`
            }, ${above.name} (${usd(above.median)}) ${
              overAbove === 0 ? "matches it exactly" : `is ${usd(overAbove)} heavy`
            } — but the ${usd(
              ctx.peerMedian,
            )} table midpoint is out by ${usd(nationalError)}${errorTail}.`
          : `Budgeting from ${below.name} (${usd(below.median)}) ${
              underBelow === 0 ? `gives the same figure as ${ctx.stateName}` : `lands ${usd(underBelow)} under ${ctx.stateName}`
            }; from ${above.name} (${usd(above.median)}), ${
              overAbove === 0 ? "the same figure" : `${usd(overAbove)} over`
            }; from the ${usd(ctx.peerMedian)} table midpoint, ${
              nationalError === 0 ? "the same figure" : `${usd(nationalError)} out`
            }.`,
    });
  } else {
    blocks.push({
      lead: "What using the wrong reference figure costs.",
      body: `${ctx.stateName} ends the ${matterLabel} table, so one side has no neighbouring figure to borrow. The ${usd(
        ctx.peerMedian,
      )} midpoint of all ${ctx.rankedOutOf} tracked states ${
        nationalError === 0
          ? `is the same figure as the ${usd(moderate.median)} estimate here.`
          : `is out by ${usd(nationalError)} against the ${usd(moderate.median)} estimate here.`
      }`,
    });
  }

  return blocks;
}


/**
 * The same comparative read, done separately at the simple and complex tiers.
 * A state's position, its neighbours and its implied workload all move between
 * tiers — and the two tiers answer different searches ("uncontested" versus
 * "contested"), so neither is served by the moderate-tier paragraphs alone.
 */
export function tierAnalysisSentences(
  ctx: StateCostContext,
  matterLabel: string,
  tierKey: "simple" | "complex",
): string[] {
  const tier = ctx.tiers[tierKey];
  const moderate = ctx.tiers.moderate!;
  if (!tier || !tier.rank) return [];
  const out: string[] = [];
  const label = tierKey === "simple" ? "straightforward" : "contested";

  const gap = tier.median - tier.peerMedian;
  const pct = tier.peerMedian > 0 ? Math.round(Math.abs(gap / tier.peerMedian) * 100) : 0;
  const drift = tier.rank - ctx.rank;
  const midpointClause =
    Math.round(Math.abs(gap)) === 0
      ? `exactly on the ${usd(tier.peerMedian)} tier midpoint`
      : `${usd(Math.abs(gap))} (${pct}%) ${gap >= 0 ? "over" : "under"} the ${usd(tier.peerMedian)} tier midpoint`;

  if (drift === 0) {
    out.push(
      `${usd(tier.median)} keeps ${ctx.stateName} at ${ordinal(
        tier.rank,
      )} on ${label} matters, the same place it holds on the headline figure, ${midpointClause}.`,
    );
  } else if (drift < 0) {
    out.push(
      `${usd(tier.median)} puts ${ctx.stateName} ${ordinal(tier.rank)} of ${
        ctx.rankedOutOf
      } on ${label} matters, ${Math.abs(drift)} up on its moderate position, and ${midpointClause}.`,
    );
  } else {
    out.push(
      `${usd(tier.median)} drops ${ctx.stateName} to ${ordinal(tier.rank)} of ${
        ctx.rankedOutOf
      } on ${label} matters, ${drift} below its moderate position and ${midpointClause}.`,
    );
  }

  if (tier.hours && tier.hourlyMedian) {
    const share = moderate.hours ? Math.round((tier.hours / moderate.hours) * 100) : null;
    out.push(
      share !== null
        ? `${tier.hours} implied hours at ${usd(tier.hourlyMedian)}: ${share}% of the moderate tier's ${
            moderate.hours
          }${tier.duration ? `, over ${tier.duration}` : ""}.`
        : `The tier implies ${tier.hours} billable hours at its own ${usd(
            tier.hourlyMedian,
          )} median rate.`,
    );
  }

  if (tier.neighborAbove && tier.neighborBelow) {
    const window = tier.neighborAbove.median - tier.neighborBelow.median;
    out.push(
      window === 0
        ? `${tier.neighborAbove.name} and ${tier.neighborBelow.name} both record ${usd(
            tier.neighborAbove.median,
          )}, the same figure as ${ctx.stateName} at this tier.`
        : `${tier.neighborAbove.name} (${usd(tier.neighborAbove.median)}) and ${
            tier.neighborBelow.name
          } (${usd(tier.neighborBelow.median)}) bracket it — a ${usd(window)} window.`,
    );
  }

  return out;
}

/**
 * How wide a state's own practice areas fan out, and how many of them place it
 * near the top or the bottom of their tables. Both describe the state rather
 * than this one matter type, and both differ state by state.
 */
export function stateShapeSentences(ctx: StateCostContext, matterLabel: string): string[] {
  const out: string[] = [];
  const { internalRatio, matterRankCounts, percentile, stateName } = ctx;

  if (internalRatio) {
    const diff = internalRatio.own - internalRatio.peer;
    out.push(
      diff >= 0.4
        ? `${stateName}'s practice areas fan out more than most: its largest tracked median is ${internalRatio.own}x its smallest, against ${internalRatio.peer}x for the typical state. Prices here are set matter by matter rather than by one statewide level.`
        : diff <= -0.4
          ? `The practice areas sit unusually close together in ${stateName} — the largest tracked median is ${internalRatio.own}x the smallest, against ${internalRatio.peer}x for the typical state — so one figure travels further across matter types here than it would elsewhere.`
          : `The largest tracked median in ${stateName} is ${internalRatio.own}x the smallest, effectively the ${internalRatio.peer}x that the typical state records: the internal spread is ordinary even where the levels are not.`,
    );
  }

  if (matterRankCounts.total > 0) {
    const { top, bottom, total } = matterRankCounts;
    out.push(
      top === total
        ? `Every one of the ${total} matter types tracked for ${stateName} places it in the upper third of its table, which is why the ${ordinal(
            ctx.rank,
          )} on ${matterLabel} is not an outlier.`
        : bottom === total
          ? `All ${total} tracked matter types place ${stateName} in the lower third of their tables, the ${matterLabel} figure included.`
          : `${top} of ${total} matter types rank ${stateName} in the upper third, ${bottom} in the lower, ${
              total - top - bottom
            } between; ${matterLabel} is ${ordinal(ctx.rank)}.`,
    );
  }

  // A percentile is not a rank, and printing it against the rank denominator
  // produced impossible strings ("54th of 51"). State it as a percentile of the
  // tracked set, with the rank kept separate — the two answer different
  // questions and reading one as the other is what made the line nonsense.
  out.push(
    percentile >= 90
      ? `That places the ${matterLabel} figure in the ${ordinal(percentile)} percentile of the ${ctx.rankedOutOf} states tracked here.`
      : `In percentile terms it sits at the ${ordinal(percentile)} percentile of the ${ctx.rankedOutOf} tracked states.`,
  );

  return out;
}


/**
 * What it would take to move five places in either direction, named. The states
 * that would have to be passed differ per page, and so does the money involved,
 * which makes this a concrete way to say how tightly packed the table is where
 * this state sits.
 */
export function movementSentences(ctx: StateCostContext, matterLabel: string): string[] {
  const moderate = ctx.tiers.moderate!;
  const out: string[] = [];
  const { up, down } = ctx.fivePlaces;

  if (up.length > 0) {
    const target = up[0]!;
    const upNames = up.map((state) => state.name).join(", ");
    out.push(
      target.median === moderate.median
        ? `Climbing five places would mean passing ${upNames}, which all record the same ${usd(
            moderate.median,
          )} as ${ctx.stateName}, so the position moves without the figure changing.`
        : `Climbing five places would mean passing ${upNames} and adding ${usd(
            target.median - moderate.median,
          )} to the ${usd(moderate.median)} estimate here.`,
    );
  } else {
    out.push(
      `There is nothing above ${ctx.stateName} to climb past: ${usd(
        moderate.median,
      )} is the highest ${matterLabel} median estimate among the tracked states.`,
    );
  }

  if (down.length > 0) {
    const target = down[down.length - 1]!;
    const downNames = down.map((state) => state.name).join(", ");
    out.push(
      target.median === moderate.median
        ? `Five places down means passing under ${downNames}, which all record the same ${usd(
            moderate.median,
          )} as ${ctx.stateName}.`
        : `Five places down means passing under ${downNames}: ${usd(moderate.median - target.median)}.`,
    );
  } else {
    out.push(
      `There is nothing below: ${usd(moderate.median)} is the lowest ${matterLabel} median estimate among the tracked states.`,
    );
  }

  if (ctx.tableEnds && ctx.tableEnds.top.name !== ctx.stateName && ctx.tableEnds.bottom.name !== ctx.stateName) {
    const { top, bottom } = ctx.tableEnds;
    const toTop = top.median - moderate.median;
    const fromBottom = moderate.median - bottom.median;
    out.push(
      `${toTop === 0 ? "Level with" : `${usd(toTop)} short of`} ${top.name} (${usd(top.median)}), ${
        fromBottom === 0 ? "level with" : `${usd(fromBottom)} clear of`
      } ${bottom.name} (${usd(bottom.median)}).`,
    );
  }

  return out;
}

/**
 * Reads a specific outside figure — the table midpoint — against this state's
 * own band and rate, so the page shows what a number from somewhere else means
 * here rather than only what this state records.
 */
export function calibrationSentence(ctx: StateCostContext, matterLabel: string): string | null {
  const moderate = ctx.tiers.moderate!;
  if (!moderate.hourlyMedian || moderate.high <= moderate.low) return null;
  const position = Math.round(
    ((ctx.peerMedian - moderate.low) / (moderate.high - moderate.low)) * 100,
  );
  const hoursAtPeer = Math.round(ctx.peerMedian / moderate.hourlyMedian);
  const hoursGap = Math.abs((moderate.hours ?? 0) - hoursAtPeer);

  if (position < 0) {
    return `The ${usd(ctx.peerMedian)} table midpoint falls below the ${usd(
      moderate.low,
    )} floor of the ${ctx.stateName} band entirely — a matter priced at the national middle would be outside anything estimated for this state.`;
  }
  if (position > 100) {
    return `The ${usd(ctx.peerMedian)} table midpoint sits above the ${usd(
      moderate.high,
    )} ceiling estimated for ${ctx.stateName}, so the typical tracked state's figure is higher than anything in this state's moderate band.`;
  }
  return `${position}% up the ${usd(
    moderate.low,
  )}–${usd(moderate.high)} band sits the ${usd(
    ctx.peerMedian,
  )} table midpoint, buying ${hoursAtPeer} hours at ${usd(
    moderate.hourlyMedian,
  )} against the ${moderate.hours} the local ${matterLabel} median implies — ${
    hoursGap === 0 ? "the same number of hours" : `${hoursGap} ${hoursGap === 1 ? "hour" : "hours"} apart`
  }.`;
}


/**
 * Implied hours give a third ordering of the same 51 rows, and it agrees with
 * neither the cost ranking nor the rate ranking: a state can be mid-table on
 * money and near the top on the amount of work its figures imply.
 */
export function hoursRankSentence(ctx: StateCostContext, matterLabel: string): string | null {
  const moderate = ctx.tiers.moderate!;
  if (ctx.hoursRank === null || !moderate.hours) return null;
  const vsCost = ctx.hoursRank - ctx.rank;
  const vsRate = ctx.hourlyRank === null ? null : ctx.hoursRank - ctx.hourlyRank;

  if (Math.abs(vsCost) <= 2 && (vsRate === null || Math.abs(vsRate) <= 2)) {
    return `Ranked by implied hours rather than money, ${ctx.stateName} is ${ordinal(
      ctx.hoursRank,
    )} of ${ctx.ratedOutOf} at ${moderate.hours} hours, where cost and rate also put it.`;
  }
  if (vsCost < 0) {
    return `A third ordering: by implied hours ${ctx.stateName} is ${ordinal(
      ctx.hoursRank,
    )} of ${ctx.ratedOutOf} at ${moderate.hours} hours, ${countPlaces(
      Math.abs(vsCost),
    )} above its cost rank of ${ordinal(
      ctx.rank,
    )} on cost — more work behind the same ${matterLabel} money.`;
  }
  if (vsCost === 0) {
    return `By implied hours ${ctx.stateName} is ${ordinal(ctx.hoursRank)} of ${
      ctx.ratedOutOf
    } at ${moderate.hours} hours, the same place it holds on cost, so the ${matterLabel} total and the implied workload agree even though the hourly rate ranks differently.`;
  }
  return `By implied hours ${ctx.stateName} falls to ${ordinal(ctx.hoursRank)} of ${
    ctx.ratedOutOf
  } at ${moderate.hours} hours, ${countPlaces(vsCost)} below its ${ordinal(
    ctx.rank,
  )} on cost — the ${matterLabel} total arriving on fewer implied hours.`;
}

/**
 * Cluster density at the simple and complex tiers, which is not the same as at
 * the moderate tier — a state can be alone on straightforward matters and in a
 * crowd on contested ones.
 */
export function tierClusterSentence(
  ctx: StateCostContext,
  tierKey: "simple" | "complex",
): string | null {
  const tier = ctx.tiers[tierKey];
  if (!tier) return null;
  const label = tierKey === "simple" ? "simple" : "complex";
  const moderateCluster = ctx.clusterPeers.length;

  if (tier.clusterCount === 0) {
    return `Nothing else sits within three percent of the ${usd(
      tier.median,
    )} here, against ${moderateCluster} at the moderate tier.`;
  }
  const one = tier.clusterCount === 1;
  if (tier.clusterCount > moderateCluster) {
    return `${countStates(tier.clusterCount)} ${one ? "records" : "record"} a ${label}-tier median within three percent of ${usd(
      tier.median,
    )}, denser than the ${moderateCluster} around the moderate tier.`;
  }
  return `${countStates(tier.clusterCount)} ${one ? "sits" : "sit"} within three percent of the ${usd(
    tier.median,
  )} here, against ${moderateCluster} at the moderate tier.`;
}

/**
 * Two further calculations: what each end of the band buys in time, and how
 * many straightforward matters one contested matter is worth at this state's
 * own recorded rates.
 */
export function extraCalculations(ctx: StateCostContext, matterLabel: string): CalculationBlock[] {
  const simple = ctx.tiers.simple;
  const moderate = ctx.tiers.moderate!;
  const complex = ctx.tiers.complex;
  const out: CalculationBlock[] = [];

  if (moderate.hourlyMedian && moderate.durationMonths) {
    const lowHours = Math.round(moderate.low / moderate.hourlyMedian);
    const highHours = Math.round(moderate.high / moderate.hourlyMedian);
    out.push({
      lead: "Both ends, in time.",
      body: `${usd(moderate.low)} is ${lowHours} hours at ${usd(
        moderate.hourlyMedian,
      )}; ${usd(moderate.high)} is ${highHours}. Over the ${
        moderate.duration
      } assumed for a moderate ${matterLabel}, that is ${Math.round(
        lowHours / moderate.durationMonths,
      )} to ${Math.round(highHours / moderate.durationMonths)} hours a month.`,
    });
  }

  if (simple && complex && simple.median > 0 && simple.hours && complex.hours) {
    const count = Math.round((complex.median / simple.median) * 10) / 10;
    const factor = Math.round((complex.hours / simple.hours) * 10) / 10;
    const rateRises = (complex.hourlyMedian ?? 0) > (simple.hourlyMedian ?? 0);
    out.push({
      lead: "Contested against simple.",
      body: `At ${ctx.stateName}'s own estimates, ${usd(
        complex.median,
      )} buys ${count} matters at the ${usd(simple.median)} simple median — or, counted in time, ${
        complex.hours
      } implied hours against ${simple.hours}, a factor of ${factor}${
        count !== factor && rateRises ? " — the two ratios differing because the rate rises with the tier" : ""
      }.`,
    });
  }

  return out;
}
