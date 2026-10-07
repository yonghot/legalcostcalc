"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FOCUS_RING } from "@/lib/utils/styles";
import { trackEvent } from "@/lib/analytics";

type NextStepId = "compare_states" | "guide" | "settlement_estimator";

interface NextStep {
  id: NextStepId;
  href: string;
  title: string;
  hint: string;
}

export function nextStepsFor(categorySlug: string | undefined, categoryName: string): NextStep[] {
  const steps: NextStep[] = [];
  if (categorySlug) {
    steps.push({
      id: "compare_states",
      href: `/category/${categorySlug}`,
      title: `Compare ${categoryName} cost across states`,
      hint: "Every state's estimate in one table.",
    });
  }
  steps.push({
    id: "guide",
    href: "/how-legal-fees-work",
    title: "How attorney fees are billed",
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

function trackNextStep(step: NextStepId, linkUrl: string) {
  trackEvent("next_step_click", { step, link_url: linkUrl });
}

export function NextSteps({ categorySlug, categoryName }: { categorySlug?: string; categoryName: string }) {
  const steps = nextStepsFor(categorySlug, categoryName);

  return (
    <section aria-labelledby="next-steps-heading">
      <h2 id="next-steps-heading" className="text-base font-semibold text-slate-900">
        Next steps
      </h2>
      <ul className="mt-3 space-y-2">
        {steps.map((step) => (
          <li key={step.id}>
            <Link
              href={step.href}
              onClick={() => trackNextStep(step.id, step.href)}
              className={`flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm transition-colors hover:border-teal-200 ${FOCUS_RING}`}
            >
              <span>
                <span className="block font-medium text-slate-800">{step.title}</span>
                <span className="mt-0.5 block text-slate-500">{step.hint}</span>
              </span>
              <ArrowRight className="h-4 w-4 flex-shrink-0 text-slate-300" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
