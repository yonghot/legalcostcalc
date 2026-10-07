export const HOURLY_RATE_BENCHMARK = {
  national: "$349",
  lowest: "$196",
  lowestPlace: "West Virginia",
  highest: "$492",
  highestPlace: "Washington, D.C.",
  sourceLabel: "Clio's 2025 Legal Trends Report",
  sourceUrl: "https://www.clio.com/resources/legal-trends/compare-lawyer-rates/",
} as const;

export const HOME_DESCRIPTION = `Legal fees depend on the matter, state and billing method; the average lawyer rate was about ${HOURLY_RATE_BENCHMARK.national} (Clio, 2025). Free legal cost estimates for all 50 states.`;
