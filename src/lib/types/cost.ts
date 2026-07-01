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
  /** Contingency fee percentages (e.g. 25/33/40). Present for personal-injury rows; null for hourly-billed categories. */
  contingencyFee: CostRange | null;
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
  /** Contingency fee percentages — present for personal-injury, null for other categories. */
  contingency_fee_low: number | null;
  contingency_fee_median: number | null;
  contingency_fee_high: number | null;
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
