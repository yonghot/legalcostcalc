import { formatCurrency } from "@/lib/utils/format";
import { topTrafficPages } from "@/lib/top-traffic";
import type { NextStep } from "@/lib/next-steps";

interface PageStepsInput {
  stateSlug: string;
  stateName: string;
  categorySlug: string;
  categoryName: string;
  moderateMedian?: number | null;
  moderateLow?: number | null;
  moderateHigh?: number | null;
}

export function pageNextSteps(input: PageStepsInput): NextStep[] {
  const { stateSlug, stateName, categorySlug, categoryName, moderateMedian, moderateLow, moderateHigh } = input;
  const matter = categoryName.toLowerCase();
  const steps: NextStep[] = [];

  if (categorySlug === "personal-injury") {
    steps.push({
      id: "settlement_estimator",
      href: "/settlement-estimator",
      title: "Estimate the net amount after fees and case costs",
      hint: "An illustrative figure for a contingency-fee case, not a prediction of any outcome.",
    });
  } else {
    const other = topTrafficPages({ categorySlug, limit: 2 }).find((p) => p.path !== `/${stateSlug}/${categorySlug}-cost`);
    if (other) {
      steps.push({
        id: "state_compare",
        href: other.path,
        title: `Compare ${matter} cost in ${other.stateName}`,
        hint:
          moderateMedian && moderateMedian > 0
            ? `The moderate-case median in ${stateName} is ${formatCurrency(moderateMedian)}; see how ${other.stateName} differs.`
            : `See how ${other.stateName} differs from ${stateName}.`,
      });
    } else {
      steps.push({
        id: "compare_tool",
        href: "/compare",
        title: "Compare two states side by side",
        hint: `Put ${stateName} next to any other state for the same matter.`,
      });
    }
  }

  steps.push({
    id: "guide",
    href: "/how-legal-fees-work",
    title: "See how attorney fees are billed",
    hint:
      moderateLow && moderateHigh && moderateHigh > moderateLow
        ? `How hourly, flat and contingency billing shape a range such as ${formatCurrency(moderateLow)} to ${formatCurrency(moderateHigh)}.`
        : "Hourly, flat, and contingency billing explained.",
  });

  steps.push({
    id: "category_hub",
    href: `/category/${categorySlug}`,
    title: `See ${matter} cost in every state`,
    hint: "Every state's estimate in one table.",
  });

  return steps;
}

export function homeNextSteps(): NextStep[] {
  const steps: NextStep[] = [];
  const top = topTrafficPages({ limit: 1 })[0];
  if (top) {
    steps.push({
      id: "top_page",
      href: top.path,
      title: `See ${top.categoryName.toLowerCase()} cost in ${top.stateName}`,
      hint: "The estimate visitors open most often.",
    });
  }
  steps.push({
    id: "guide",
    href: "/how-legal-fees-work",
    title: "See how attorney fees are billed",
    hint: "Hourly, flat, and contingency billing explained.",
  });
  steps.push({
    id: "compare_tool",
    href: "/compare",
    title: "Compare two states side by side",
    hint: "The same matter in two states, tier by tier.",
  });
  return steps;
}
