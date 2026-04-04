export type Complexity = "simple" | "moderate" | "complex";

export interface CostRange {
  low: number;
  median: number;
  high: number;
}

export interface LegalCostData {
  id: string;
  category: string;
  stateCode: string;
  complexity: Complexity;
  costRange: CostRange;
  hourlyRate: CostRange;
  typicalDuration: string;
  commonFees: string[];
  sources: string[];
  lastVerifiedAt: string;
}

export interface LegalCostRow {
  id: string;
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
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CostComparisonResult {
  category: string;
  states: {
    stateCode: string;
    stateName: string;
    costs: LegalCostData[];
  }[];
}
