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

          <div className="mt-8 text-center">
            {/* Title skeleton */}
            <div className="mx-auto h-10 w-96 max-w-full animate-pulse rounded bg-slate-200" />
            <div className="mx-auto mt-4 h-5 w-80 max-w-full animate-pulse rounded bg-slate-200" />
          </div>

          {/* Form skeleton */}
          <div className="mt-10">
            <Card className="mx-auto max-w-3xl border-slate-200">
              <CardContent className="p-6">
                {/* Mode toggle skeleton */}
                <div className="mb-6 flex justify-center gap-2">
                  <div className="h-10 w-36 animate-pulse rounded-md bg-slate-200" />
                  <div className="h-10 w-36 animate-pulse rounded-md bg-slate-200" />
                </div>

                {/* Select fields skeleton */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="mb-2 h-4 w-16 animate-pulse rounded bg-slate-200" />
                    <div className="h-10 w-full animate-pulse rounded-md bg-slate-200" />
                  </div>
                  <div>
                    <div className="mb-2 h-4 w-16 animate-pulse rounded bg-slate-200" />
                    <div className="h-10 w-full animate-pulse rounded-md bg-slate-200" />
                  </div>
                </div>

                {/* Category select skeleton */}
                <div className="mt-4">
                  <div className="mb-2 h-4 w-24 animate-pulse rounded bg-slate-200" />
                  <div className="h-10 w-full animate-pulse rounded-md bg-slate-200" />
                </div>

                {/* Button skeleton */}
                <div className="mt-6 flex justify-center">
                  <div className="h-10 w-36 animate-pulse rounded-md bg-teal-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
