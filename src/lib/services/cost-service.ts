import {
  findCostsByFilters,
  findCostsByStatesAndCategory,
} from "@/lib/repositories/cost-repository";
import {
  findSeedCostsByFilters,
  findSeedCostsByStatesAndCategory,
} from "@/lib/repositories/cost-seed-repository";
import { STATE_MAP } from "@/lib/constants/states";
import { Complexity, LegalCostData, LegalCostRow, CostComparisonResult } from "@/lib/types";

const VALID_COMPLEXITIES: readonly Complexity[] = ["simple", "moderate", "complex"] as const;

function isValidComplexity(value: string): value is Complexity {
  return VALID_COMPLEXITIES.includes(value as Complexity);
}

function mapRowToData(row: LegalCostRow): LegalCostData {
  const complexity = isValidComplexity(row.complexity) ? row.complexity : "moderate";

  // Build contingency fee range only when all three values are present and non-null.
  // Personal-injury rows carry these; all other categories have them null.
  const contingencyFee =
    row.contingency_fee_low != null &&
    row.contingency_fee_median != null &&
    row.contingency_fee_high != null
      ? {
          low: row.contingency_fee_low,
          median: row.contingency_fee_median,
          high: row.contingency_fee_high,
        }
      : null;

  return {
    id: row.id,
    category: row.category,
    stateCode: row.state_code,
    complexity,
    costRange: {
      low: row.cost_low,
      median: row.cost_median,
      high: row.cost_high,
    },
    hourlyRate: {
      low: row.hourly_rate_low ?? 0,
      median: row.hourly_rate_median ?? 0,
      high: row.hourly_rate_high ?? 0,
    },
    contingencyFee,
    typicalDuration: row.typical_duration ?? "Varies",
    commonFees: row.common_fees ?? [],
    sources: row.sources ?? [],
    lastVerifiedAt: row.last_verified_at ?? row.updated_at,
  };
}

/**
 * Fallback policy (business logic, hence here and not in a repository).
 *
 * The database is the preferred source. When it cannot answer — missing/invalid
 * credentials, a paused project, a network failure, or a query that succeeds but
 * returns nothing for a pair the seed does cover — we serve the bundled seed
 * rather than an empty page.
 *
 * This was not a hypothetical: on 2026-08-17 production returned
 * `{"data":null,"error":"Internal server error"}` for every cost query, and all
 * 400 programmatic landing pages had been rendering with no cost content at all
 * (the pages catch the error and continue with an empty array). The seed holds
 * the same 1,224 sourced rows the table is meant to hold, so falling back costs
 * nothing in accuracy and keeps the pages — and their source attributions —
 * intact while the connection is repaired.
 *
 * `reason` is logged once per failed query so a broken database stays visible in
 * server logs instead of silently degrading into "the seed is fine".
 */
function withSeedFallback(
  rows: LegalCostRow[] | null,
  seed: () => LegalCostRow[],
  context: string,
  reason?: unknown,
): LegalCostRow[] {
  if (rows && rows.length > 0) return rows;
  const fallback = seed();
  if (fallback.length > 0) {
    const detail = reason instanceof Error ? reason.message : reason ? String(reason) : "no rows";
    console.warn(`[cost-service] ${context}: using seed data (db: ${detail})`);
  }
  return fallback;
}

export async function getCosts(params: {
  category?: string;
  stateCode?: string;
  complexity?: string;
}): Promise<LegalCostData[]> {
  let rows: LegalCostRow[] | null = null;
  let reason: unknown;
  try {
    rows = await findCostsByFilters(params);
  } catch (error) {
    reason = error;
  }
  return withSeedFallback(rows, () => findSeedCostsByFilters(params), "getCosts", reason).map(
    mapRowToData,
  );
}

export async function getCostForPage(
  category: string,
  stateCode: string,
): Promise<LegalCostData[]> {
  let rows: LegalCostRow[] | null = null;
  let reason: unknown;
  try {
    rows = await findCostsByFilters({ category, stateCode });
  } catch (error) {
    reason = error;
  }
  return withSeedFallback(
    rows,
    () => findSeedCostsByFilters({ category, stateCode }),
    `getCostForPage(${stateCode}/${category})`,
    reason,
  ).map(mapRowToData);
}

export async function compareCosts(
  stateCodes: string[],
  category: string,
): Promise<CostComparisonResult> {
  let dbRows: LegalCostRow[] | null = null;
  let reason: unknown;
  try {
    dbRows = await findCostsByStatesAndCategory(stateCodes, category);
  } catch (error) {
    reason = error;
  }
  const rows = withSeedFallback(
    dbRows,
    () => findSeedCostsByStatesAndCategory(stateCodes, category),
    `compareCosts(${category})`,
    reason,
  );

  const stateGroups = new Map<string, LegalCostData[]>();
  for (const row of rows) {
    const mapped = mapRowToData(row);
    const existing = stateGroups.get(row.state_code) || [];
    existing.push(mapped);
    stateGroups.set(row.state_code, existing);
  }

  // Synchronous lookup from the in-memory map instead of N async calls
  const states = stateCodes.map((code) => {
    const stateInfo = STATE_MAP.get(code);
    return {
      stateCode: code,
      stateName: stateInfo?.name ?? code,
      costs: stateGroups.get(code) || [],
    };
  });

  return { category, states };
}
