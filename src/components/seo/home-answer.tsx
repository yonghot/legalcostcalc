import { buildStatisticsAggregate } from "@/lib/seo/statistics";
import { formatCurrency } from "@/lib/utils/format";
import { HOURLY_RATE_BENCHMARK } from "@/lib/constants/benchmarks";

export function HomeAnswer() {
  const { categoryRows } = buildStatisticsAggregate();
  const costliest = categoryRows[0];
  const cheapest = categoryRows[categoryRows.length - 1];

  return (
    <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
      Legal costs depend on the matter, the state and how the lawyer bills. The average lawyer
      hourly rate was about {HOURLY_RATE_BENCHMARK.national} in{" "}
      <a
        href={HOURLY_RATE_BENCHMARK.sourceUrl}
        className="underline hover:text-teal-700"
        target="_blank"
        rel="noopener noreferrer"
      >
        {HOURLY_RATE_BENCHMARK.sourceLabel}
      </a>
      {costliest && cheapest && costliest !== cheapest
        ? `, and in our modeled estimates the average of the state medians runs from ${formatCurrency(cheapest.nationalAverage)} for ${cheapest.categoryDisplayName.toLowerCase()} to ${formatCurrency(costliest.nationalAverage)} for ${costliest.categoryDisplayName.toLowerCase()}`
        : ""}
      . Choose a state and matter below for a low, median and high estimate with its sources.
      General information, not legal advice.
    </p>
  );
}
