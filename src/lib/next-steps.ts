export type NextStepId =
  | "state_compare"
  | "compare_tool"
  | "category_hub"
  | "guide"
  | "settlement_estimator"
  | "top_page";

export type NextStepPlacement = "answer" | "result" | "home";

export interface NextStep {
  id: NextStepId;
  href: string;
  title: string;
  hint: string;
}

export function nextStepsFor(categorySlug: string | undefined, categoryName: string): NextStep[] {
  const steps: NextStep[] = [];
  if (categorySlug) {
    steps.push({
      id: "category_hub",
      href: `/category/${categorySlug}`,
      title: `Compare ${categoryName} cost across states`,
      hint: "Estimates by state in one table.",
    });
  }
  steps.push({
    id: "guide",
    href: "/how-legal-fees-work",
    title: "See how attorney fees are billed",
    hint: "Hourly, flat, and contingency billing explained.",
  });
  if (categorySlug === "personal-injury") {
    steps.push({
      id: "settlement_estimator",
      href: "/settlement-estimator",
      title: "Settlement net estimator",
      hint: "An illustrative net amount after contingency fee and case costs.",
    });
  }
  return steps;
}
