/**
 * page-index.ts — T09 thin-page triage: the single source of truth for which
 * programmatic /[state]/[slug] pages carry real, unique per-page data and are
 * therefore safe to index and link internally.
 *
 * hasUniqueData is DERIVED PROGRAMMATICALLY from the seed dataset (never
 * hand-flagged): a page qualifies when it has a moderate-complexity cost row
 * with a real cost figure AND at least one source URL. This mirrors the
 * per-row `sources[]` + `cost_median` fields already required by CLAUDE.md's
 * Data Rules ("All cost data requires sources[] with URLs").
 *
 * sitemap.ts, generateMetadata's `robots` field, and the T06/T07 internal
 * link modules (RelatedMatters, hub pages, breadcrumbs) all read from this
 * same filtered set — see tests/page-index.test.ts for the consistency
 * assertion required by the spec's T09 acceptance criteria.
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
  cost_median: number;
  sources?: string[] | null;
}

const SEED_ROWS = costsSeed as SeedRow[];

export interface PageIndexEntry {
  state: StateInfo;
  category: CategoryInfo;
  /** Canonical clean path, e.g. "/california/divorce-cost". */
  path: string;
  /**
   * true only when the (state, category) pair has a moderate-complexity row
   * with a real cost figure and at least one source URL — i.e. an actual
   * per-page data point, not template substitution with no backing data.
   */
  hasUniqueData: boolean;
}

function computeHasUniqueData(stateCode: string, categorySlug: string): boolean {
  const moderateRow = SEED_ROWS.find(
    (r) => r.state_code === stateCode && r.category === categorySlug && r.complexity === "moderate",
  );
  if (!moderateRow) return false;
  if (typeof moderateRow.cost_median !== "number" || moderateRow.cost_median <= 0) return false;
  if (!moderateRow.sources || moderateRow.sources.length === 0) return false;
  return true;
}

/**
 * Full page index for every (state, category) combination. Computed once at
 * module load — the seed dataset is static JSON bundled at build time, so
 * this is safe to use inside sitemap.ts, generateMetadata, and any
 * server/client component without a database round-trip.
 */
export const PAGE_INDEX: PageIndexEntry[] = STATES.flatMap((state) =>
  CATEGORIES.map((category) => ({
    state,
    category,
    path: `/${state.slug}/${category.slug}-cost`,
    hasUniqueData: computeHasUniqueData(state.code, category.slug),
  })),
);

/** Only the pages that pass the thin-content gate — safe to index and link. */
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
