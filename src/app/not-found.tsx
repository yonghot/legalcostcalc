import Link from "next/link";
import { Scale, Home, ArrowRight } from "lucide-react";
import { Disclaimer } from "@/components/shared/disclaimer";
import { CATEGORIES } from "@/lib/constants/categories";
import { STATES } from "@/lib/constants/states";

const POPULAR_STATES = ["CA", "TX", "FL", "NY", "IL"];
const POPULAR_CATEGORIES = ["divorce", "dui", "personal-injury", "bankruptcy"];

export default function NotFound() {
  const popularStates = STATES.filter((s) =>
    POPULAR_STATES.includes(s.code),
  );
  const popularCategories = CATEGORIES.filter((c) =>
    POPULAR_CATEGORIES.includes(c.slug),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Disclaimer />
      <div className="mt-12 flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50">
          <Scale className="h-8 w-8 text-teal-600" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-slate-900">Page Not Found</h1>
        <p className="mt-3 max-w-md text-slate-600">
          The page you&apos;re looking for doesn&apos;t exist. Try one of these
          popular legal cost pages instead.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-teal-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
        >
          <Home className="h-5 w-5" aria-hidden="true" />
          Back to Calculator
        </Link>
      </div>

      {/* Popular Pages */}
      <div className="mt-16 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Popular States
          </h2>
          <div className="space-y-2">
            {popularStates.map((state) => (
              <Link
                key={state.code}
                href={`/${state.slug}/divorce-cost`}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm transition-all hover:border-teal-200 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
              >
                <span className="font-medium text-slate-700">
                  Legal Costs in {state.name}
                </span>
                <ArrowRight className="h-5 w-5 text-slate-300" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Popular Categories
          </h2>
          <div className="space-y-2">
            {popularCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/california/${cat.slug}-cost`}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm transition-all hover:border-teal-200 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
              >
                <span className="font-medium text-slate-700">
                  {cat.displayName} Cost
                </span>
                <ArrowRight className="h-5 w-5 text-slate-300" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-16">
        <Disclaimer />
      </div>
    </div>
  );
}
