"use client";

import { useEffect } from "react";
import { ErrorContent } from "@/components/shared/error-content";

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
    <ErrorContent
      title="Something went wrong"
      message="We encountered an error loading this page. Please try again."
      reset={reset}
    />
  );
}
