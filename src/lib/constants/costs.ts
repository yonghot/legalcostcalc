import { Complexity } from "@/lib/types";

export const VALID_COMPLEXITIES: readonly Complexity[] = [
  "simple",
  "moderate",
  "complex",
] as const;

export const DEFAULT_COMPLEXITY: Complexity = "moderate";

/** Maximum number of state codes allowed in a comparison request */
export const MAX_COMPARISON_STATES = 2;

/** Maximum allowed length for filter string parameters to prevent abuse */
export const MAX_FILTER_PARAM_LENGTH = 100;

/** Default state slug used for category links on the homepage and footer */
export const DEFAULT_STATE_SLUG = "california";
