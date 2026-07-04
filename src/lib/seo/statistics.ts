/**
 * lib/seo/statistics.ts — CODE-04: data/statistic "linkable asset"
 * aggregation for the /legal-cost-statistics page (부속P §4 CODE-04).
 *
 * Aggregates the SAME real, gated dataset the rest of the site uses
 * (INDEXABLE_PAGES / the seed costs.json, via lib/page-index.ts) into
 * original, citable statistics: a national headline, per-category
 * highest/lowest states, and cross-entity comparison findings. Every number
 * here traces back to a real costs.json row that already passed the CODE-06
 * information-gain gate — this module performs zero independent data entry,
 * only arithmetic (avg/min/max/percent-difference) over real inputs.
 *
 * Pure functions (no JSX, no I/O) so they're unit-testable and reusable by
 * the page, the Dataset JSON-LD, and the /legal-cost-statistics/data.json +
 * data.csv feed routes — one aggregation, four consumers, never four
 * separately-hand-maintained copies of the same numbers.
 */
import { INDEXABLE_PAGES, getNationalAverage, getModerateMedianCost } from "@/lib/page-index";
import { CATEGORIES } from "@/lib/constants/categories";
import { formatCurrency } from "@/lib/utils/format";

export interface CategoryStatRow {
  categorySlug: string;
  categoryDisplayName: string;
  /** Real national average (mean of moderate-complexity medians across all indexable states), rounded. */
  nationalAverage: number;
  /** Highest-cost indexable state for this category. */
  highestState: { code: string; name: string; slug: string; median: number };
  /** Lowest-cost indexable state for this category. */
  lowestState: { code: string; name: string; slug: string; median: number };
  /** Number of indexable (state, category) pairs backing this row — transparency on sample size. */
  stateCount: number;
  /** Percent the highest-cost state runs above the lowest-cost state, rounded. */
  highVsLowPercent: number;
}

export interface StatisticsAggregate {
  /** One row per category, sorted by nationalAverage descending (most expensive matter type first). */
  categoryRows: CategoryStatRow[];
  /** The single most expensive category nationally — the headline stat. */
  headline: CategoryStatRow;
  /** 3-5 one-line, pull-quote-ready findings, each traceable to a categoryRow. */
  findings: string[];
  /** Total real indexable data points this aggregate was built from. */
  totalDataPoints: number;
}

/**
 * Builds one CategoryStatRow per legal-matter category from INDEXABLE_PAGES
 * (the same CODE-06-gated set used sitewide — thin/duplicate pages never
 * contribute to these statistics). Returns null for a category with zero
 * indexable states rather than fabricating a row.
 */
function buildCategoryRow(categorySlug: string, categoryDisplayName: string): CategoryStatRow | null {
  const pagesForCategory = INDEXABLE_PAGES.filter((p) => p.category.slug === categorySlug);
  if (pagesForCategory.length === 0) return null;

  const nationalAverage = getNationalAverage(categorySlug);
  if (nationalAverage === null) return null;

  // getModerateMedianCost is guaranteed non-null for every INDEXABLE_PAGES
  // entry (page-index.ts's own invariant, asserted in page-index.test.ts).
  const withMedian = pagesForCategory
    .map((p) => {
      const median = getModerateMedianCost(p.state.code, categorySlug);
      return median !== null ? { state: p.state, median } : null;
    })
    .filter((x): x is { state: (typeof pagesForCategory)[number]["state"]; median: number } => x !== null);

  if (withMedian.length === 0) return null;

  const sorted = [...withMedian].sort((a, b) => b.median - a.median);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];

  const highVsLowPercent =
    lowest.median > 0 ? Math.round(((highest.median - lowest.median) / lowest.median) * 100) : 0;

  return {
    categorySlug,
    categoryDisplayName,
    nationalAverage: Math.round(nationalAverage),
    highestState: {
      code: highest.state.code,
      name: highest.state.name,
      slug: highest.state.slug,
      median: highest.median,
    },
    lowestState: {
      code: lowest.state.code,
      name: lowest.state.name,
      slug: lowest.state.slug,
      median: lowest.median,
    },
    stateCount: withMedian.length,
    highVsLowPercent,
  };
}

/**
 * Builds the full statistics aggregate: one row per category (only real,
 * indexable data contributes), a headline (most expensive category
 * nationally), and 3-5 quotable one-line findings derived directly from the
 * category rows. Computed once and reused by the page, Dataset JSON-LD, and
 * the /data.json + /data.csv feed routes so all four surfaces always agree.
 */
export function buildStatisticsAggregate(): StatisticsAggregate {
  const categoryRows = CATEGORIES.map((c) => buildCategoryRow(c.slug, c.displayName)).filter(
    (row): row is CategoryStatRow => row !== null,
  );

  categoryRows.sort((a, b) => b.nationalAverage - a.nationalAverage);

  const headline = categoryRows[0];

  const findings: string[] = [];

  if (headline) {
    findings.push(
      `${headline.categoryDisplayName} is the most expensive matter type nationally, with a median cost ` +
        `of ${formatCurrency(headline.nationalAverage)} across ${headline.stateCount} states.`,
    );
  }

  // Cheapest category nationally.
  const cheapest = categoryRows[categoryRows.length - 1];
  if (cheapest && cheapest.categorySlug !== headline?.categorySlug) {
    findings.push(
      `${cheapest.categoryDisplayName} is the least expensive matter type nationally, with a median cost ` +
        `of ${formatCurrency(cheapest.nationalAverage)} across ${cheapest.stateCount} states.`,
    );
  }

  // Largest high-vs-low state spread across categories (biggest state-to-state swing).
  const biggestSpread = [...categoryRows].sort((a, b) => b.highVsLowPercent - a.highVsLowPercent)[0];
  if (biggestSpread) {
    findings.push(
      `${biggestSpread.categoryDisplayName} costs ${biggestSpread.highVsLowPercent}% more in ` +
        `${biggestSpread.highestState.name} than in ${biggestSpread.lowestState.name} — the widest ` +
        "state-to-state gap of any matter type tracked.",
    );
  }

  // One or two direct cross-entity comparisons (highest-state pull-quotes) for
  // the top 2 categories, matching the CODE-04 "X costs 42% more in cityA than
  // cityB" example format literally.
  for (const row of categoryRows.slice(0, 2)) {
    if (row.highVsLowPercent <= 0) continue;
    findings.push(
      `${row.categoryDisplayName} costs ${row.highVsLowPercent}% more in ${row.highestState.name} ` +
        `(${formatCurrency(row.highestState.median)}) than in ${row.lowestState.name} ` +
        `(${formatCurrency(row.lowestState.median)}).`,
    );
  }

  // De-duplicate (defensive — categories could theoretically coincide) and cap 3-5 per spec.
  const uniqueFindings = Array.from(new Set(findings)).slice(0, 5);

  return {
    categoryRows,
    headline,
    findings: uniqueFindings,
    totalDataPoints: categoryRows.reduce((sum, r) => sum + r.stateCount, 0),
  };
}
