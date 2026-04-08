/**
 * Utility for checking data staleness.
 * CLAUDE.md rule: Data older than 1 year shows "data may be outdated" warning.
 * Single-source data labeled "estimated range".
 */

export interface DataFreshnessResult {
  isStale: boolean;
  formattedDate: string;
}

/**
 * Check if a verification date is older than 1 year.
 * Returns staleness status and a formatted date string.
 */
export function checkDataFreshness(lastVerifiedAt: string): DataFreshnessResult {
  const verifiedDate = new Date(lastVerifiedAt);
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  return {
    isStale: verifiedDate < oneYearAgo,
    formattedDate: verifiedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    }),
  };
}
