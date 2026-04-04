import { createServerSupabaseClient } from "@/lib/supabase/server";
import { LegalCostRow } from "@/lib/types";

export async function findCostsByFilters(params: {
  category?: string;
  stateCode?: string;
  complexity?: string;
}): Promise<LegalCostRow[]> {
  const supabase = await createServerSupabaseClient();
  let query = supabase.from("legal_costs").select("*");

  if (params.category) {
    query = query.eq("category", params.category);
  }
  if (params.stateCode) {
    query = query.eq("state_code", params.stateCode);
  }
  if (params.complexity) {
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
  const supabase = await createServerSupabaseClient();

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
  const supabase = await createServerSupabaseClient();

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
