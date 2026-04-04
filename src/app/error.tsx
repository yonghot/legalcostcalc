"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/shared/disclaimer";

export default function Error({
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
        <h2 className="mt-4 text-2xl font-bold text-slate-900">Something went wrong</h2>
        <p className="mt-2 text-slate-600">
          We encountered an error loading this page. Please try again.
        </p>
        <Button onClick={reset} className="mt-6">
          Try again
        </Button>
      </div>
      <div className="mt-12">
        <Disclaimer />
      </div>
    </div>
  );
}
