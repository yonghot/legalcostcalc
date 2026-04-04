import {
  findCostsByFilters,
  findCostsByStatesAndCategory,
} from "@/lib/repositories/cost-repository";
import { STATES } from "@/lib/constants/states";
import { STATE_MAP } from "@/lib/constants/states";
import { LegalCostData, LegalCostRow, CostComparisonResult } from "@/lib/types";

function mapRowToData(row: LegalCostRow): LegalCostData {
  return {
    id: row.id,
    category: row.category,
    stateCode: row.state_code,
    complexity: row.complexity as LegalCostData["complexity"],
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
    typicalDuration: row.typical_duration ?? "Varies",
    commonFees: row.common_fees ?? [],
    sources: row.sources ?? [],
    lastVerifiedAt: row.last_verified_at ?? row.updated_at,
  };
}

export async function getCosts(params: {
  category?: string;
  stateCode?: string;
  complexity?: string;
}): Promise<LegalCostData[]> {
  const rows = await findCostsByFilters(params);
  return rows.map(mapRowToData);
}

export async function getCostForPage(
  category: string,
  stateCode: string,
): Promise<LegalCostData[]> {
  const rows = await findCostsByFilters({ category, stateCode });
  return rows.map(mapRowToData);
}

export async function compareCosts(
  stateCodes: string[],
  category: string,
): Promise<CostComparisonResult> {
  const rows = await findCostsByStatesAndCategory(stateCodes, category);

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
