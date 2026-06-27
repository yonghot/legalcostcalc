import { Card, CardContent } from "@/components/ui/card";

/**
 * About page loading skeleton.
 *
 * Mirrors the disclaimer-first skeleton used by [state]/[slug]/loading.tsx and
 * compare/loading.tsx so the legally-required disclaimer placeholder is visible
 * during the loading phase on /about as well (UPL coverage on every route).
 */
export default function Loading() {
  return (
    <div>
      <section className="bg-gradient-to-b from-teal-50 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Disclaimer skeleton */}
          <div className="animate-pulse rounded-lg bg-amber-50 p-4">
            <div className="h-3 w-3/4 rounded bg-amber-200/50" />
            <div className="mt-2 h-3 w-1/2 rounded bg-amber-200/50" />
          </div>

          {/* H1 skeleton */}
          <div className="mt-8 h-9 w-1/2 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-5 w-2/3 animate-pulse rounded bg-slate-200" />

          {/* Body content skeleton */}
          <div className="mt-8 space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-11/12 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
          </div>

          {/* Notice card skeleton */}
          <div className="mt-8">
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
                <div className="mt-3 h-4 w-full animate-pulse rounded bg-slate-100" />
                <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-slate-100" />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
