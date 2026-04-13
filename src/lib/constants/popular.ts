/**
 * Shared "popular" item lists — single source of truth
 * used by Home, 404 page, and Smart404Suggestions.
 */

/** Top 10 states by combined search volume + population */
export const POPULAR_STATE_CODES = [
  "CA", "TX", "FL", "NY", "IL", "PA", "OH", "GA", "NC", "MI",
] as const;

/** Top 5 subset for compact displays (404, suggestions) */
export const POPULAR_STATE_CODES_SHORT = [
  "CA", "TX", "FL", "NY", "IL",
] as const;

/** Top 4 categories for compact displays */
export const POPULAR_CATEGORY_SLUGS = [
  "divorce", "dui", "personal-injury", "bankruptcy",
] as const;
