"use client";

import { useEffect } from "react";
import { ErrorContent } from "@/components/shared/error-content";

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
    <ErrorContent
      title="Unable to load cost data"
      message="We had trouble loading the legal cost data for this page. Please try again or return to the calculator."
      reset={reset}
      showBackLink
    />
  );
}
