/**
 * cost-seed-repository.ts — static-seed data access for `legal_costs`.
 *
 * WHY THIS EXISTS
 * A live audit on 2026-08-17 found every programmatic page in production
 * rendering an EMPTY body: https://legalcostcalc.co/california/divorce-cost
 * returned 200 with zero cost figures, and `/api/costs?category=divorce&state=CA`
 * returned `{"data":null,"error":"Internal server error"}`. The page catches the
 * repository error and falls back to `costs = []`, so 400 SEO landing pages had
 * been serving nothing but the header, disclaimer and footer — which is exactly
 * what AdSense's "low value content" rejection describes.
 *
 * The dataset those pages need was in the repo the whole time:
 * `src/data/seed/costs.json` (1,224 rows = 51 states x 8 categories x 3
 * complexity tiers, each with `sources[]`). `page-index.ts` already reads it
 * statically to decide which pages are indexable, so the sitemap advertised
 * pages whose content the renderer could not fetch.
 *
 * This repository exposes the seed through the SAME `LegalCostRow` contract as
 * the Supabase repository, so the service layer can fall back to it without any
 * page or component knowing. It is data access only — the decision about WHEN to
 * fall back is business logic and lives in `cost-service.ts` (CLAUDE.md layer
 * order: API Route -> Service -> Repository -> Supabase).
 *
 * Not a substitute for fixing the database connection: the seed is the same data
 * the DB is meant to hold, so a healthy DB simply wins. The seed only guarantees
 * the pages are never empty again.
 */
import costsSeed from "@/data/seed/costs.json";
import { DATA_VERSION_DATE } from "@/lib/constants/data-meta";
import { LegalCostRow } from "@/lib/types";

/** The seed's row shape — a subset of `LegalCostRow` (no id/timestamps). */
interface SeedRow {
  category: string;
  state_code: string;
  complexity: string;
  cost_low: number;
  cost_median: number;
  cost_high: number;
  hourly_rate_low: number | null;
  hourly_rate_median: number | null;
  hourly_rate_high: number | null;
  typical_duration: string | null;
  common_fees: string[] | null;
  sources: string[] | null;
}

const COMPLEXITY_ORDER: Record<string, number> = {
  complex: 0,
  moderate: 1,
  simple: 2,
};

/**
 * The seed carries no per-row verification date, so every row inherits the
 * dataset's verification date (`DATA_VERSION_DATE`, bumped when the data is
 * re-verified). This is the honest value: these rows were all verified together.
 */
const SEED_VERIFIED_AT = DATA_VERSION_DATE.toISOString();

function toRow(seed: SeedRow): LegalCostRow {
  return {
    // Deterministic synthetic id: the natural key of the row. Stable across
    // builds so React keys and any client-side caching stay consistent.
    id: `seed-${seed.state_code}-${seed.category}-${seed.complexity}`,
    category: seed.category,
    state_code: seed.state_code,
    complexity: seed.complexity,
    cost_low: seed.cost_low,
    cost_median: seed.cost_median,
    cost_high: seed.cost_high,
    hourly_rate_low: seed.hourly_rate_low,
    hourly_rate_median: seed.hourly_rate_median,
    hourly_rate_high: seed.hourly_rate_high,
    contingency_fee_low: null,
    contingency_fee_median: null,
    contingency_fee_high: null,
    typical_duration: seed.typical_duration,
    common_fees: seed.common_fees,
    sources: seed.sources,
    last_verified_at: SEED_VERIFIED_AT,
    created_at: SEED_VERIFIED_AT,
    updated_at: SEED_VERIFIED_AT,
  };
}

const SEED_ROWS: LegalCostRow[] = (costsSeed as SeedRow[]).map(toRow);

/** Mirrors `findCostsByFilters`, ordered by complexity like the DB query. */
export function findSeedCostsByFilters(params: {
  category?: string;
  stateCode?: string;
  complexity?: string;
}): LegalCostRow[] {
  const rows = SEED_ROWS.filter((row) => {
    if (params.category && row.category !== params.category) return false;
    if (params.stateCode && row.state_code !== params.stateCode) return false;
    if (params.complexity && row.complexity !== params.complexity) return false;
    return true;
  });
  // `.order("complexity")` in Postgres sorts alphabetically: complex, moderate,
  // simple. Reproduced here so callers that rely on ordering behave identically
  // whichever source answered.
  return [...rows].sort(
    (a, b) => (COMPLEXITY_ORDER[a.complexity] ?? 9) - (COMPLEXITY_ORDER[b.complexity] ?? 9),
  );
}

/** Mirrors `findCostsByStatesAndCategory`. */
export function findSeedCostsByStatesAndCategory(
  stateCodes: string[],
  category: string,
): LegalCostRow[] {
  const wanted = new Set(stateCodes);
  return SEED_ROWS.filter((row) => row.category === category && wanted.has(row.state_code));
}

/** Total seed rows — used by the fallback log line and by tests. */
export function seedRowCount(): number {
  return SEED_ROWS.length;
}
