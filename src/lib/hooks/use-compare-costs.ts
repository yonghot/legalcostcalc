"use client";

import { useCallback, useState } from "react";
import { ApiResponse, CostComparisonResult, LegalCostData } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants/categories";
import { STATES } from "@/lib/constants/states";
import { useRequestTracker } from "./use-request-tracker";

export interface CategoryComparisonResult {
  state: string;
  stateName: string;
  categories: {
    category: string;
    categoryName: string;
    costs: LegalCostData[];
  }[];
}

/**
 * Hook encapsulating /api/costs/compare and dual /api/costs fetches used by
 * the Compare page. Keeps the page component free of direct API calls.
 */
export function useCompareCosts() {
  const { loading, error, execute } = useRequestTracker();
  const [stateResult, setStateResult] = useState<CostComparisonResult | null>(null);
  const [categoryResult, setCategoryResult] = useState<CategoryComparisonResult | null>(null);

  const compareStates = useCallback(
    async (state1: string, state2: string, category: string) => {
      if (!state1 || !state2 || !category) return;

      const outcome = await execute(
        async () => {
          const params = new URLSearchParams({
            states: `${state1},${state2}`,
            category,
          });
          const res = await fetch(`/api/costs/compare?${params}`);
          return (await res.json()) as ApiResponse<CostComparisonResult>;
        },
        { errorMessage: "Failed to compare costs. Please try again." }
      );

      if (outcome.stale) return;
      if (outcome.data?.error || !outcome.data?.data) {
        setStateResult(null);
        return;
      }

      setStateResult(outcome.data.data);
      setCategoryResult(null);
    },
    [execute]
  );

  const compareCategories = useCallback(
    async (state: string, category1: string, category2: string) => {
      if (!state || !category1 || !category2) return;

      const outcome = await execute(
        async () => {
          const [res1, res2] = await Promise.all([
            fetch(`/api/costs?state=${state}&category=${category1}`),
            fetch(`/api/costs?state=${state}&category=${category2}`),
          ]);
          return Promise.all([
            res1.json() as Promise<ApiResponse<LegalCostData[]>>,
            res2.json() as Promise<ApiResponse<LegalCostData[]>>,
          ]);
        },
        { errorMessage: "Failed to compare costs. Please try again." }
      );

      if (outcome.stale || !outcome.data) return;

      const [json1, json2] = outcome.data;
      if (json1.error || json2.error || !json1.data || !json2.data) {
        setCategoryResult(null);
        return;
      }

      const stateInfo = STATES.find((s) => s.code === state);
      const cat1Info = CATEGORIES.find((c) => c.slug === category1);
      const cat2Info = CATEGORIES.find((c) => c.slug === category2);

      setCategoryResult({
        state,
        stateName: stateInfo?.name ?? state,
        categories: [
          {
            category: category1,
            categoryName: cat1Info?.displayName ?? category1,
            costs: json1.data,
          },
          {
            category: category2,
            categoryName: cat2Info?.displayName ?? category2,
            costs: json2.data,
          },
        ],
      });
      setStateResult(null);
    },
    [execute]
  );

  const reset = useCallback(() => {
    setStateResult(null);
    setCategoryResult(null);
  }, []);

  return {
    loading,
    error,
    stateResult,
    categoryResult,
    compareStates,
    compareCategories,
    reset,
  };
}
