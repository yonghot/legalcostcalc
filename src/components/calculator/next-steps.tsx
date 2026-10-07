"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FOCUS_RING } from "@/lib/utils/styles";
import { trackEvent } from "@/lib/analytics";
import { nextStepsFor, type NextStep, type NextStepPlacement } from "@/lib/next-steps";

export { nextStepsFor };

function trackNextStep(placement: NextStepPlacement, step: NextStep) {
  trackEvent("related_click", {
    link_module: "next_step",
    link_context: `${placement}_${step.id}`,
    link_url: step.href,
  });
}

interface NextStepsProps {
  steps?: NextStep[];
  categorySlug?: string;
  categoryName?: string;
  placement?: NextStepPlacement;
  className?: string;
}

export function NextSteps({
  steps,
  categorySlug,
  categoryName = "",
  placement = "result",
  className,
}: NextStepsProps) {
  const items = steps ?? nextStepsFor(categorySlug, categoryName);
  if (items.length === 0) return null;
  const headingId = `next-steps-${placement}`;

  return (
    <section data-next-step={placement} aria-labelledby={headingId} className={className}>
      <h2 id={headingId} className="text-base font-semibold text-slate-900">
        Next steps
      </h2>
      <ul className="mt-3 max-w-3xl space-y-2">
        {items.map((step) => (
          <li key={step.id}>
            <Link
              href={step.href}
              onClick={() => trackNextStep(placement, step)}
              className={`flex min-h-11 items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm transition-colors hover:border-teal-200 ${FOCUS_RING}`}
            >
              <span>
                <span className="block font-medium text-slate-800">{step.title}</span>
                <span className="mt-0.5 block text-slate-600">{step.hint}</span>
              </span>
              <ArrowRight className="h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
