import { NextResponse } from "next/server";
import { buildStatisticsAggregate } from "@/lib/seo/statistics";
import { getFamilyDate } from "@/lib/content-dates";

/**
 * CODE-04 — /legal-cost-statistics/data.csv: the same real aggregation as
 * data.json and the statistics page, in CSV form for spreadsheet/journalist
 * use (part of the digital-PR "linkable asset" per 부속P §4 CODE-04).
 */
export const revalidate = 604800; // 7 days, mirrors the page's ISR window

function csvEscape(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const aggregate = buildStatisticsAggregate();
  const dateUpdated = getFamilyDate("page:legal-cost-statistics")?.date ?? "";

  const header = [
    "category",
    "display_name",
    "national_average_median_cost_usd",
    "state_count",
    "highest_cost_state_code",
    "highest_cost_state_name",
    "highest_cost_state_median_usd",
    "lowest_cost_state_code",
    "lowest_cost_state_name",
    "lowest_cost_state_median_usd",
    "high_vs_low_percent",
    "date_updated",
  ];

  const rows = aggregate.categoryRows.map((row) =>
    [
      row.categorySlug,
      row.categoryDisplayName,
      row.nationalAverage,
      row.stateCount,
      row.highestState.code,
      row.highestState.name,
      row.highestState.median,
      row.lowestState.code,
      row.lowestState.name,
      row.lowestState.median,
      row.highVsLowPercent,
      dateUpdated,
    ]
      .map(csvEscape)
      .join(","),
  );

  const csv = [header.join(","), ...rows].join("\n") + "\n";

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="legal-cost-statistics.csv"',
      "Cache-Control": "public, max-age=0, s-maxage=604800, stale-while-revalidate=86400",
    },
  });
}
