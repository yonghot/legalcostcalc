import { getPublicSupabaseClient } from "@/lib/supabase/public";
import { LegalCostRow } from "@/lib/types";
import { MAX_FILTER_PARAM_LENGTH } from "@/lib/constants/costs";

function validateFilterParam(value: string, name: string): void {
  if (value.length > MAX_FILTER_PARAM_LENGTH) {
    throw new Error(`${name} exceeds maximum length of ${MAX_FILTER_PARAM_LENGTH}`);
  }
  // Reject characters that should never appear in category/state/complexity values
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    throw new Error(`${name} contains invalid characters`);
  }
}

export async function findCostsByFilters(params: {
  category?: string;
  stateCode?: string;
  complexity?: string;
}): Promise<LegalCostRow[]> {
  const supabase = getPublicSupabaseClient();
  let query = supabase.from("legal_costs").select("*");

  if (params.category) {
    validateFilterParam(params.category, "category");
    query = query.eq("category", params.category);
  }
  if (params.stateCode) {
    validateFilterParam(params.stateCode, "stateCode");
    query = query.eq("state_code", params.stateCode);
  }
  if (params.complexity) {
    validateFilterParam(params.complexity, "complexity");
    query = query.eq("complexity", params.complexity);
  }

  const { data, error } = await query.order("complexity");

  if (error) {
    throw new Error(`Failed to fetch costs: ${error.message}`);
  }

  return (data as LegalCostRow[]) || [];
}

export async function findCostsByStatesAndCategory(
  stateCodes: string[],
  category: string,
): Promise<LegalCostRow[]> {
  validateFilterParam(category, "category");
  for (const code of stateCodes) {
    validateFilterParam(code, "stateCode");
  }

  const supabase = getPublicSupabaseClient();

  const { data, error } = await supabase
    .from("legal_costs")
    .select("*")
    .eq("category", category)
    .in("state_code", stateCodes)
    .order("state_code")
    .order("complexity");

  if (error) {
    throw new Error(`Failed to fetch comparison costs: ${error.message}`);
  }

  return (data as LegalCostRow[]) || [];
}

export async function findAllCostsForStaticGeneration(): Promise<
  Pick<LegalCostRow, "category" | "state_code">[]
> {
  const supabase = getPublicSupabaseClient();

  const { data, error } = await supabase
    .from("legal_costs")
    .select("category, state_code")
    .order("category")
    .order("state_code");

  if (error) {
    throw new Error(`Failed to fetch static params: ${error.message}`);
  }

  // Deduplicate by category+state_code
  const seen = new Set<string>();
  return (data || []).filter((row) => {
    const key = `${row.category}-${row.state_code}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
