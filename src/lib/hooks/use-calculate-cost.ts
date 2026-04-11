"use client";

import { useCallback, useState } from "react";
import { ApiResponse, LegalCostData } from "@/lib/types";
import { useRequestTracker } from "./use-request-tracker";

interface CalculateParams {
  category: string;
  state: string;
  complexity?: string;
}

/**
 * Hook encapsulating the /api/costs fetch used by the calculator.
 * Keeps components free of direct API calls (see components/CLAUDE.md).
 */
export function useCalculateCost() {
  const { loading, error, execute } = useRequestTracker();
  const [results, setResults] = useState<LegalCostData[] | null>(null);

  const calculate = useCallback(
    async ({ category, state, complexity }: CalculateParams) => {
      if (!category || !state) return { stale: false, hasResults: false };

      const params = new URLSearchParams({
        category,
        state,
        ...(complexity && { complexity }),
      });

      const outcome = await execute(
        async () => {
          const res = await fetch(`/api/costs?${params}`);
          return (await res.json()) as ApiResponse<LegalCostData[]>;
        },
        { errorMessage: "Failed to calculate costs. Please try again." }
      );

      if (outcome.stale) return { stale: true as const, hasResults: false };

      if (outcome.data?.error || !outcome.data?.data) {
        setResults(null);
        return { stale: false as const, hasResults: false };
      }

      setResults(outcome.data.data);
      return { stale: false as const, hasResults: outcome.data.data.length > 0 };
    },
    [execute]
  );

  return { loading, error, results, calculate };
}
