import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div>
      <section className="bg-gradient-to-b from-teal-50 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Disclaimer skeleton */}
          <div className="animate-pulse rounded-lg bg-amber-50 p-4">
            <div className="h-3 w-3/4 rounded bg-amber-200/50" />
            <div className="mt-2 h-3 w-1/2 rounded bg-amber-200/50" />
          </div>

          <div className="mt-8">
            {/* Breadcrumb skeleton */}
            <div className="mb-4 flex gap-2">
              <div className="h-4 w-12 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
            </div>

            {/* H1 skeleton */}
            <div className="h-9 w-2/3 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-5 w-1/2 animate-pulse rounded bg-slate-200" />
          </div>

          {/* Cost card skeleton */}
          <div className="mt-8">
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
                </div>
                <div className="mt-4 flex items-baseline gap-4">
                  <div className="h-10 w-32 animate-pulse rounded bg-teal-100" />
                  <div className="h-6 w-48 animate-pulse rounded bg-slate-100" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Complexity cards skeleton */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-slate-200">
                <CardContent className="p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="h-5 w-20 animate-pulse rounded bg-slate-200" />
                    <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
                  </div>
                  <div className="h-8 w-24 animate-pulse rounded bg-teal-100" />
                  <div className="mt-2 h-4 w-32 animate-pulse rounded bg-slate-100" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
