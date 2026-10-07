import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CARD_HOVER, FOCUS_RING } from "@/lib/utils/styles";
import type { TrafficPage } from "@/lib/top-traffic";

interface PopularPagesProps {
  heading: string;
  intro: ReactNode;
  pages: TrafficPage[];
  className?: string;
}

export function PopularPages({ heading, intro, pages, className }: PopularPagesProps) {
  if (pages.length === 0) return null;

  return (
    <section aria-labelledby="popular-pages-heading" className={className}>
      <h2 id="popular-pages-heading" className="text-2xl font-bold text-slate-900">
        {heading}
      </h2>
      <p className="mt-2 text-slate-600">{intro}</p>
      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pages.map((page) => (
          <li key={page.path}>
            <Link
              href={page.path}
              className={`flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm font-medium text-slate-800 ${CARD_HOVER} ${FOCUS_RING}`}
            >
              <span>
                {page.categoryName} cost in {page.stateName}
              </span>
              <ArrowRight className="h-4 w-4 flex-shrink-0 text-slate-300" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
