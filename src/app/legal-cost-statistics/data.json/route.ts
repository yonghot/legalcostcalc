import { NextResponse } from "next/server";
import { buildStatisticsAggregate } from "@/lib/seo/statistics";
import { DATA_VERSION_DATE } from "@/lib/constants/data-meta";

/**
 * CODE-04 — /legal-cost-statistics/data.json: the same real aggregation
 * rendered on the statistics page, exposed as a static machine-readable
 * feed (no fabrication, no independent computation — same
 * buildStatisticsAggregate() call as the page and the Dataset JSON-LD).
 */
export const revalidate = 604800; // 7 days, mirrors the page's ISR window

export async function GET() {
  const aggregate = buildStatisticsAggregate();

  const body = {
    dataVerifiedDate: DATA_VERSION_DATE.toISOString().slice(0, 10),
    source: "https://legalcostcalc.co/legal-cost-statistics",
    totalDataPoints: aggregate.totalDataPoints,
    findings: aggregate.findings,
    categories: aggregate.categoryRows.map((row) => ({
      category: row.categorySlug,
      displayName: row.categoryDisplayName,
      nationalAverageMedianCost: row.nationalAverage,
      stateCount: row.stateCount,
      highestCostState: {
        code: row.highestState.code,
        name: row.highestState.name,
        medianCost: row.highestState.median,
      },
      lowestCostState: {
        code: row.lowestState.code,
        name: row.lowestState.name,
        medianCost: row.lowestState.median,
      },
      highVsLowPercent: row.highVsLowPercent,
    })),
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=604800, stale-while-revalidate=86400",
    },
  });
}
