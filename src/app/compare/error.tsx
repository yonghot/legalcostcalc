"use client";

import { useEffect } from "react";
import { ErrorContent } from "@/components/shared/error-content";

export default function CompareError({
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
    <ErrorContent
      title="Unable to load comparison data"
      message="We had trouble loading the cost comparison data. Please try again or return to the calculator."
      reset={reset}
      showBackLink
    />
  );
}
