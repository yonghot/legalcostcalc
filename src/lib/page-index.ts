/**
 * page-index.ts — T09/CODE-06 thin-page triage: the single source of truth
 * for which programmatic /[state]/[slug] pages carry real, unique per-page
 * data and are therefore safe to index and link internally.
 *
 * CODE-06 (부속P §4) strengthens the original T09 single-fact check
 * ("has a moderate row with a real cost + a source") into an explicit
 * information-gain guard: a page must carry >=4 entity-specific facts that
 * DIFFER from sibling pages before it is indexable. This is deliberately
 * NOT a re-spec of breadcrumbs/meta/hub-page mechanics (부속I) — only the
 * gating math changes; everything downstream (sitemap.ts, generateMetadata's
 * `robots`, T06/T07 internal-link modules, CategoryEditorial) keeps reading
 * the same INDEXABLE_PAGES/hasUniqueData surface as before.
 *
 * The four facts scored (per CODE-06 사양):
 *   1. Local average (moderate-complexity median cost) — must be real (>0)
 *      and sourced.
 *   2. Local range (low-high spread across complexity tiers) — must be a
 *      real, non-degenerate range (low < high).
 *   3. Sample-scenario result — a specific complexity-tier computed value
 *      (the "simple" tier cost) distinct from generic/zero data.
 *   4. Computed comparison-vs-benchmark — the page's moderate median versus
 *      the category's national-average median (see `nationalAverage`
 *      below), which is *itself* only a differentiating fact when the
 *      page's own row signature is not a byte-for-byte duplicate of a
 *      sibling state's row for the same category (the exact
 *      near-duplicate-template failure mode 부속P §8 anti-pattern #3 warns
 *      against — Google fingerprints page STRUCTURE, and identical
 *      low/median/high/hourly/duration rows across two states are
 *      structurally the same page with only the state name swapped).
 *
 * A page needs all 4 facts to be indexable. Fact 4 is the one that
 * specifically catches full-signature duplicates (see
 * `hasDuplicateSiblingSignature`) — a state whose entire cost row is
 * identical to another state's row in the same category contributes no
 * differentiating comparison and fails the gate even though facts 1-3 look
 * individually present.
 */
import costsSeed from "@/data/seed/costs.json";
import { STATES } from "@/lib/constants/states";
import { CATEGORIES } from "@/lib/constants/categories";
import { StateInfo } from "@/lib/types/state";
import { CategoryInfo } from "@/lib/types/category";

interface SeedRow {
  category: string;
  state_code: string;
  complexity: string;
  cost_low: number;
  cost_median: number;
  cost_high: number;
  hourly_rate_low?: number | null;
  hourly_rate_median?: number | null;
  hourly_rate_high?: number | null;
  typical_duration?: string | null;
  sources?: string[] | null;
}

const SEED_ROWS = costsSeed as SeedRow[];

const MIN_DIFFERENTIATING_FACTS = 4;

export interface PageIndexEntry {
  state: StateInfo;
  category: CategoryInfo;
  /** Canonical clean path, e.g. "/california/divorce-cost". */
  path: string;
  /**
   * true only when the (state, category) pair carries >=4
   * entity-specific facts that differ from sibling pages — the CODE-06
   * information-gain gate. See `factCount`/`facts` for the breakdown.
   */
  hasUniqueData: boolean;
  /** Number of differentiating facts found (0-4), for diagnostics/tests. */
  factCount: number;
  /** Named breakdown of which facts passed, for diagnostics/tests. */
  facts: {
    localAverage: boolean;
    localRange: boolean;
    sampleScenario: boolean;
    comparisonVsBenchmark: boolean;
  };
}

function rowsFor(stateCode: string, categorySlug: string): SeedRow[] {
  return SEED_ROWS.filter((r) => r.state_code === stateCode && r.category === categorySlug);
}

function findRow(rows: SeedRow[], complexity: string): SeedRow | undefined {
  return rows.find((r) => r.complexity === complexity);
}

/**
 * National-average moderate-complexity median cost per category, computed
 * once from the real dataset (never hardcoded) — the benchmark fact 4
 * compares each state's local median against.
 */
const NATIONAL_AVERAGE_BY_CATEGORY: Record<string, number> = (() => {
  const sums = new Map<string, { total: number; count: number }>();
  for (const row of SEED_ROWS) {
    if (row.complexity !== "moderate") continue;
    if (typeof row.cost_median !== "number" || row.cost_median <= 0) continue;
    const entry = sums.get(row.category) ?? { total: 0, count: 0 };
    entry.total += row.cost_median;
    entry.count += 1;
    sums.set(row.category, entry);
  }
  const out: Record<string, number> = {};
  for (const [category, { total, count }] of sums) {
    out[category] = count > 0 ? total / count : 0;
  }
  return out;
})();

export function getNationalAverage(categorySlug: string): number | null {
  const avg = NATIONAL_AVERAGE_BY_CATEGORY[categorySlug];
  return typeof avg === "number" && avg > 0 ? avg : null;
}

/**
 * A row signature capturing every visible-to-the-user number/duration field.
 * Two states with an identical signature for the same category render a
 * structurally-identical page (only the state name substituted) — the exact
 * "spun/templated" pattern the March-2026 information-gain signal targets.
 */
function rowSignature(row: SeedRow): string {
  return [
    row.cost_low,
    row.cost_median,
    row.cost_high,
    row.hourly_rate_low ?? "",
    row.hourly_rate_median ?? "",
    row.hourly_rate_high ?? "",
    row.typical_duration ?? "",
  ].join("|");
}

/**
 * true when this (state, category) pair's moderate-complexity row is a
 * byte-for-byte duplicate of at least one OTHER state's row for the same
 * category — i.e. it contributes zero real differentiation versus a sibling
 * page even though every individual field is "present."
 */
function hasDuplicateSiblingSignature(
  stateCode: string,
  categorySlug: string,
  moderateRow: SeedRow,
): boolean {
  const signature = rowSignature(moderateRow);
  return SEED_ROWS.some(
    (r) =>
      r.category === categorySlug &&
      r.complexity === "moderate" &&
      r.state_code !== stateCode &&
      rowSignature(r) === signature,
  );
}

/**
 * Scores the four CODE-06 information-gain facts for a (state, category)
 * pair directly from the seed dataset. Every fact traces to a real seed
 * value — nothing here is hand-flagged or invented.
 */
function scoreFacts(stateCode: string, categorySlug: string) {
  const rows = rowsFor(stateCode, categorySlug);
  const moderateRow = findRow(rows, "moderate");
  const simpleRow = findRow(rows, "simple");
  const complexRow = findRow(rows, "complex");

  // Fact 1 — local average: a real, sourced moderate-complexity median.
  const localAverage = Boolean(
    moderateRow &&
      typeof moderateRow.cost_median === "number" &&
      moderateRow.cost_median > 0 &&
      moderateRow.sources &&
      moderateRow.sources.length > 0,
  );

  // Fact 2 — local range: a genuine, non-degenerate low-high spread.
  const localRange = Boolean(
    moderateRow &&
      typeof moderateRow.cost_low === "number" &&
      typeof moderateRow.cost_high === "number" &&
      moderateRow.cost_low > 0 &&
      moderateRow.cost_high > moderateRow.cost_low,
  );

  // Fact 3 — sample-scenario result: a specific complexity-tier computed
  // value (the "simple" tier), distinct from the moderate figure and
  // sourced independently, plus the "complex" tier existing for contrast.
  const sampleScenario = Boolean(
    simpleRow &&
      typeof simpleRow.cost_median === "number" &&
      simpleRow.cost_median > 0 &&
      simpleRow.sources &&
      simpleRow.sources.length > 0 &&
      complexRow &&
      typeof complexRow.cost_median === "number" &&
      complexRow.cost_median > 0,
  );

  // Fact 4 — computed comparison-vs-benchmark: local median vs. the real
  // category national average, AND the row must not be a full-signature
  // duplicate of another state's row (a duplicate contributes no genuine
  // comparison — it would render the identical sentence/number as a
  // sibling page, the near-duplicate-template anti-pattern).
  const nationalAverage = getNationalAverage(categorySlug);
  const comparisonVsBenchmark = Boolean(
    moderateRow &&
      localAverage &&
      nationalAverage !== null &&
      !hasDuplicateSiblingSignature(stateCode, categorySlug, moderateRow),
  );

  const facts = { localAverage, localRange, sampleScenario, comparisonVsBenchmark };
  const factCount = Object.values(facts).filter(Boolean).length;

  return { facts, factCount };
}

/**
 * Full page index for every (state, category) combination. Computed once at
 * module load — the seed dataset is static JSON bundled at build time, so
 * this is safe to use inside sitemap.ts, generateMetadata, and any
 * server/client component without a database round-trip.
 */
export const PAGE_INDEX: PageIndexEntry[] = STATES.flatMap((state) =>
  CATEGORIES.map((category) => {
    const { facts, factCount } = scoreFacts(state.code, category.slug);
    return {
      state,
      category,
      path: `/${state.slug}/${category.slug}-cost`,
      hasUniqueData: factCount >= MIN_DIFFERENTIATING_FACTS,
      factCount,
      facts,
    };
  }),
);

/** Only the pages that pass the information-gain gate — safe to index and link. */
export const INDEXABLE_PAGES: PageIndexEntry[] = PAGE_INDEX.filter((p) => p.hasUniqueData);

/** Fast lookup: "STATE_CODE:category-slug" -> PageIndexEntry. */
const PAGE_INDEX_MAP = new Map<string, PageIndexEntry>(
  PAGE_INDEX.map((p) => [`${p.state.code}:${p.category.slug}`, p]),
);

export function getPageIndexEntry(stateCode: string, categorySlug: string): PageIndexEntry | undefined {
  return PAGE_INDEX_MAP.get(`${stateCode}:${categorySlug}`);
}

export function hasUniqueData(stateCode: string, categorySlug: string): boolean {
  return getPageIndexEntry(stateCode, categorySlug)?.hasUniqueData ?? false;
}

/**
 * Moderate-complexity median cost for a (state, category) pair, read
 * directly from the static seed dataset — used by hub-page data tables,
 * which need real per-row figures at build/request time without a Supabase
 * round-trip. Returns null when no moderate row exists (should not happen
 * for any INDEXABLE_PAGES entry per computeHasUniqueData's own check).
 */
export function getModerateMedianCost(stateCode: string, categorySlug: string): number | null {
  const row = SEED_ROWS.find(
    (r) => r.state_code === stateCode && r.category === categorySlug && r.complexity === "moderate",
  );
  return row ? row.cost_median : null;
}

/**
 * K07 — median cost for a (state, category) pair at a SPECIFIC complexity
 * tier ("simple" | "moderate" | "complex"), read directly from the static
 * seed dataset. Used by the divorce-cost-by-state hub, which frames
 * simple/complex as the real uncontested/contested cost split (real data
 * only — never interpolated/invented). Returns null when no row exists for
 * that (state, category, complexity) triple.
 */
export function getCostByComplexity(
  stateCode: string,
  categorySlug: string,
  complexity: "simple" | "moderate" | "complex",
): number | null {
  const row = SEED_ROWS.find(
    (r) =>
      r.state_code === stateCode &&
      r.category === categorySlug &&
      r.complexity === complexity,
  );
  return row ? row.cost_median : null;
}

/**
 * CODE-05 — moderate-complexity low/median/high range for a (state,
 * category) pair, read directly from the static seed dataset. Used by the
 * dynamic OG image generator (opengraph-image.tsx), which needs the real
 * headline range without a Supabase round-trip (edge runtime). Returns
 * null when no moderate row exists.
 */
export function getModerateCostRange(
  stateCode: string,
  categorySlug: string,
): { low: number; median: number; high: number } | null {
  const row = SEED_ROWS.find(
    (r) => r.state_code === stateCode && r.category === categorySlug && r.complexity === "moderate",
  );
  if (!row) return null;
  return { low: row.cost_low, median: row.cost_median, high: row.cost_high };
}

/**
 * CODE-05 (deepening pass) — the full seed row for one (state, category,
 * complexity) triple, in a shape components can read without importing the
 * seed JSON themselves (CLAUDE.md layer order: page -> service -> repository;
 * `lib/page-index` is the existing sanctioned reader of the bundled seed for
 * build-time analysis that must not make a database round-trip).
 *
 * Exposed because the per-entity analysis needs fields the earlier helpers
 * dropped — the hourly band at EACH tier, and the source count — to compute
 * implied hours per tier and to describe how many citations back a row.
 */
export interface SeedTierFigures {
  stateCode: string;
  low: number;
  median: number;
  high: number;
  hourlyLow: number | null;
  hourlyMedian: number | null;
  hourlyHigh: number | null;
  duration: string | null;
  sourceCount: number;
}

function toTierFigures(row: SeedRow): SeedTierFigures {
  return {
    stateCode: row.state_code,
    low: row.cost_low,
    median: row.cost_median,
    high: row.cost_high,
    hourlyLow: row.hourly_rate_low ?? null,
    hourlyMedian: row.hourly_rate_median ?? null,
    hourlyHigh: row.hourly_rate_high ?? null,
    duration: row.typical_duration ?? null,
    sourceCount: row.sources?.length ?? 0,
  };
}

/** One tier's figures for a (state, category) pair, or null when absent. */
export function getTierFigures(
  stateCode: string,
  categorySlug: string,
  complexity: "simple" | "moderate" | "complex",
): SeedTierFigures | null {
  const row = SEED_ROWS.find(
    (r) => r.state_code === stateCode && r.category === categorySlug && r.complexity === complexity,
  );
  return row ? toTierFigures(row) : null;
}

/**
 * Every state's figures for one (category, complexity) pair — the peer set the
 * per-entity analysis ranks against. Unfiltered by the information-gain gate on
 * purpose: callers apply `hasUniqueData` themselves so a ranking never cites a
 * page we treat as too thin to index.
 */
export function getCategoryTierFigures(
  categorySlug: string,
  complexity: "simple" | "moderate" | "complex",
): SeedTierFigures[] {
  return SEED_ROWS.filter((r) => r.category === categorySlug && r.complexity === complexity).map(
    toTierFigures,
  );
}
