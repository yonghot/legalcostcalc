"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Disclaimer } from "@/components/shared/disclaimer";
import { ComparisonForm, CompareMode } from "@/components/compare/comparison-form";
import { CATEGORIES } from "@/lib/constants/categories";
import { STATES } from "@/lib/constants/states";
import { VALID_COMPLEXITIES } from "@/lib/constants/costs";
import { CostComparisonResult, LegalCostData } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/format";
import Link from "next/link";

export default function ComparePage() {
  const [mode, setMode] = useState<CompareMode>("states");
  const [state1, setState1] = useState("");
  const [state2, setState2] = useState("");
  const [category, setCategory] = useState("");
  const [category2, setCategory2] = useState("");
  const [result, setResult] = useState<CostComparisonResult | null>(null);
  const [categoryResult, setCategoryResult] = useState<{
    state: string;
    stateName: string;
    categories: { category: string; categoryName: string; costs: LegalCostData[] }[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  const handleCompareStates = useCallback(async () => {
    if (!state1 || !state2 || !category) return;

    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        states: `${state1},${state2}`,
        category,
      });
      const res = await fetch(`/api/costs/compare?${params}`);
      const json = await res.json();

      if (currentRequestId !== requestIdRef.current) return;

      if (json.error) {
        setError(json.error);
        setResult(null);
      } else {
        setResult(json.data);
        setCategoryResult(null);
      }
    } catch {
      if (currentRequestId !== requestIdRef.current) return;
      setError("Failed to compare costs. Please try again.");
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [state1, state2, category]);

  const handleCompareCategories = useCallback(async () => {
    if (!state1 || !category || !category2) return;

    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const [res1, res2] = await Promise.all([
        fetch(`/api/costs?state=${state1}&category=${category}`),
        fetch(`/api/costs?state=${state1}&category=${category2}`),
      ]);
      const [json1, json2] = await Promise.all([res1.json(), res2.json()]);

      if (currentRequestId !== requestIdRef.current) return;

      if (json1.error || json2.error) {
        setError(json1.error || json2.error);
        setCategoryResult(null);
      } else {
        const stateInfo = STATES.find((s) => s.code === state1);
        const cat1Info = CATEGORIES.find((c) => c.slug === category);
        const cat2Info = CATEGORIES.find((c) => c.slug === category2);
        setCategoryResult({
          state: state1,
          stateName: stateInfo?.name ?? state1,
          categories: [
            {
              category,
              categoryName: cat1Info?.displayName ?? category,
              costs: json1.data as LegalCostData[],
            },
            {
              category: category2,
              categoryName: cat2Info?.displayName ?? category2,
              costs: json2.data as LegalCostData[],
            },
          ],
        });
        setResult(null);
      }
    } catch {
      if (currentRequestId !== requestIdRef.current) return;
      setError("Failed to compare costs. Please try again.");
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [state1, category, category2]);

  const handleCompare = mode === "states" ? handleCompareStates : handleCompareCategories;

  const isFormValid =
    mode === "states"
      ? !!(state1 && state2 && category)
      : !!(state1 && category && category2);

  const getCostByComplexity = (costs: LegalCostData[], complexity: string) =>
    costs.find((c) => c.complexity === complexity);

  const handleModeChange = (newMode: CompareMode) => {
    setMode(newMode);
    setResult(null);
    setCategoryResult(null);
    setError(null);
  };

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Disclaimer />

        <nav className="mt-8 text-sm text-slate-500">
          <Link href="/" className="hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 rounded-sm">Home</Link>
          <span className="mx-2">/</span>
          <span>Compare Costs</span>
        </nav>

        <div className="mt-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Compare Legal Costs
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            Compare legal costs between states or across different legal categories.
          </p>
        </div>

        <ComparisonForm
          mode={mode}
          onModeChange={handleModeChange}
          state1={state1}
          onState1Change={setState1}
          state2={state2}
          onState2Change={setState2}
          category={category}
          onCategoryChange={setCategory}
          category2={category2}
          onCategory2Change={setCategory2}
          onCompare={handleCompare}
          isFormValid={isFormValid}
          loading={loading}
        />

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        {/* Cross-State Results */}
        {result && result.states.length === 2 && (
          <div className="mt-8 space-y-6">
            <h2 className="text-xl font-bold text-slate-900">
              {CATEGORIES.find((c) => c.slug === result.category)?.displayName} Cost Comparison
            </h2>

            {VALID_COMPLEXITIES.map((complexity) => {
              const cost1 = getCostByComplexity(result.states[0].costs, complexity);
              const cost2 = getCostByComplexity(result.states[1].costs, complexity);

              if (!cost1 && !cost2) return null;

              return (
                <Card key={complexity} className="border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Badge variant="outline" className="capitalize">{complexity}</Badge>
                      Complexity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      {[result.states[0], result.states[1]].map((stateData, i) => {
                        const cost = getCostByComplexity(stateData.costs, complexity);
                        return (
                          <div key={stateData.stateCode || i} className="text-center">
                            <h3 className="mb-3 font-semibold text-slate-700">{stateData.stateName}</h3>
                            {cost ? (
                              <>
                                <p className="font-mono text-2xl font-bold text-teal-600">
                                  {formatCurrency(cost.costRange.median)}
                                </p>
                                <p className="mt-1 font-mono text-sm text-slate-500">
                                  {formatCurrency(cost.costRange.low)} – {formatCurrency(cost.costRange.high)}
                                </p>
                                <p className="mt-2 font-mono text-xs text-slate-400">
                                  {formatCurrency(cost.hourlyRate.median)}/hr median rate
                                </p>
                              </>
                            ) : (
                              <p className="text-sm text-slate-400">No data available</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Cross-Category Results */}
        {categoryResult && categoryResult.categories.length === 2 && (
          <div className="mt-8 space-y-6">
            <h2 className="text-xl font-bold text-slate-900">
              Cost Comparison in {categoryResult.stateName}
            </h2>

            {VALID_COMPLEXITIES.map((complexity) => {
              const cost1 = getCostByComplexity(categoryResult.categories[0].costs, complexity);
              const cost2 = getCostByComplexity(categoryResult.categories[1].costs, complexity);

              if (!cost1 && !cost2) return null;

              return (
                <Card key={complexity} className="border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Badge variant="outline" className="capitalize">{complexity}</Badge>
                      Complexity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      {categoryResult.categories.map((catData, i) => {
                        const cost = getCostByComplexity(catData.costs, complexity);
                        return (
                          <div key={catData.category || i} className="text-center">
                            <h3 className="mb-3 font-semibold text-slate-700">{catData.categoryName}</h3>
                            {cost ? (
                              <>
                                <p className="font-mono text-2xl font-bold text-teal-600">
                                  {formatCurrency(cost.costRange.median)}
                                </p>
                                <p className="mt-1 font-mono text-sm text-slate-500">
                                  {formatCurrency(cost.costRange.low)} – {formatCurrency(cost.costRange.high)}
                                </p>
                                <p className="mt-2 font-mono text-xs text-slate-400">
                                  {formatCurrency(cost.hourlyRate.median)}/hr median rate
                                </p>
                              </>
                            ) : (
                              <p className="text-sm text-slate-400">No data available</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-12">
          <Disclaimer />
        </div>
      </div>
    </div>
  );
}
