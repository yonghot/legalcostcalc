"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/shared/disclaimer";

export default function StateCategoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log to error reporting service
  }, [error]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Disclaimer />
      <div className="mt-8 flex flex-col items-center text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500" aria-hidden="true" />
        <h2 className="mt-4 text-2xl font-bold text-slate-900">
          Unable to load cost data
        </h2>
        <p className="mt-2 text-slate-600">
          We had trouble loading the legal cost data for this page. Please try again or return to the calculator.
        </p>
        <div className="mt-6 flex gap-4">
          <Button onClick={reset}>Try again</Button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
          >
            Back to Calculator
          </Link>
        </div>
      </div>
      <div className="mt-12">
        <Disclaimer />
      </div>
    </div>
  );
}
