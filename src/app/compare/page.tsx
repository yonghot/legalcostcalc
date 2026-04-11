"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Disclaimer } from "@/components/shared/disclaimer";
import { ComparisonForm, CompareMode } from "@/components/compare/comparison-form";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { CATEGORIES } from "@/lib/constants/categories";
import { STATES } from "@/lib/constants/states";
import { VALID_COMPLEXITIES } from "@/lib/constants/costs";
import { CostComparisonResult, LegalCostData } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/format";
import { useRequestTracker } from "@/lib/hooks/use-request-tracker";
import Link from "next/link";

interface CategoryComparisonResult {
  state: string;
  stateName: string;
  categories: { category: string; categoryName: string; costs: LegalCostData[] }[];
}

export default function ComparePage() {
  const [mode, setMode] = useState<CompareMode>("states");
  const [state1, setState1] = useState("");
  const [state2, setState2] = useState("");
  const [category, setCategory] = useState("");
  const [category2, setCategory2] = useState("");
  const [result, setResult] = useState<CostComparisonResult | null>(null);
  const [categoryResult, setCategoryResult] = useState<CategoryComparisonResult | null>(null);

  const { loading, error, execute } = useRequestTracker();

  const handleCompareStates = useCallback(async () => {
    if (!state1 || !state2 || !category) return;

    const outcome = await execute(
      async () => {
        const params = new URLSearchParams({ states: `${state1},${state2}`, category });
        const res = await fetch(`/api/costs/compare?${params}`);
        return res.json();
      },
      { errorMessage: "Failed to compare costs. Please try again." }
    );

    if (outcome.stale) return;
    if (outcome.data?.error) {
      setResult(null);
    } else if (outcome.data?.data) {
      setResult(outcome.data.data);
      setCategoryResult(null);
    }
  }, [state1, state2, category, execute]);

  const handleCompareCategories = useCallback(async () => {
    if (!state1 || !category || !category2) return;

    const outcome = await execute(
      async () => {
        const [res1, res2] = await Promise.all([
          fetch(`/api/costs?state=${state1}&category=${category}`),
          fetch(`/api/costs?state=${state1}&category=${category2}`),
        ]);
        return Promise.all([res1.json(), res2.json()]);
      },
      { errorMessage: "Failed to compare costs. Please try again." }
    );

    if (outcome.stale) return;
    if (!outcome.data) return;

    const [json1, json2] = outcome.data;
    if (json1.error || json2.error) {
      setCategoryResult(null);
    } else {
      const stateInfo = STATES.find((s) => s.code === state1);
      const cat1Info = CATEGORIES.find((c) => c.slug === category);
      const cat2Info = CATEGORIES.find((c) => c.slug === category2);
      setCategoryResult({
        state: state1,
        stateName: stateInfo?.name ?? state1,
        categories: [
          { category, categoryName: cat1Info?.displayName ?? category, costs: json1.data },
          { category: category2, categoryName: cat2Info?.displayName ?? category2, costs: json2.data },
        ],
      });
      setResult(null);
    }
  }, [state1, category, category2, execute]);

  const handleCompare = mode === "states" ? handleCompareStates : handleCompareCategories;

  const isFormValid =
    mode === "states"
      ? !!(state1 && state2 && category && state1 !== state2)
      : !!(state1 && category && category2 && category !== category2);

  const handleModeChange = (newMode: CompareMode) => {
    setMode(newMode);
    setResult(null);
    setCategoryResult(null);
  };

  return (
    <div className="py-16">
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "Compare Costs", href: "/compare" },
        ]}
      />
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
          <ComparisonResultSection
            title={`${CATEGORIES.find((c) => c.slug === result.category)?.displayName} Cost Comparison`}
            items={result.states.map((s) => ({
              key: s.stateCode,
              label: s.stateName,
              costs: s.costs,
              linkSlug: STATES.find((st) => st.code === s.stateCode)?.slug,
              linkCategory: result.category,
            }))}
          />
        )}

        {/* Cross-Category Results */}
        {categoryResult && categoryResult.categories.length === 2 && (
          <ComparisonResultSection
            title={`Cost Comparison in ${categoryResult.stateName}`}
            items={categoryResult.categories.map((c) => ({
              key: c.category,
              label: c.categoryName,
              costs: c.costs,
              linkSlug: STATES.find((s) => s.code === categoryResult.state)?.slug,
              linkCategory: c.category,
            }))}
          />
        )}

        <div className="mt-12">
          <Disclaimer />
        </div>
      </div>
    </div>
  );
}

function ComparisonResultSection({
  title,
  items,
}: {
  title: string;
  items: {
    key: string;
    label: string;
    costs: LegalCostData[];
    linkSlug?: string;
    linkCategory: string;
  }[];
}) {
  const getCostByComplexity = (costs: LegalCostData[], complexity: string) =>
    costs.find((c) => c.complexity === complexity);

  return (
    <div className="mt-8 space-y-6">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>

      {VALID_COMPLEXITIES.map((complexity) => {
        const hasData = items.some((item) => getCostByComplexity(item.costs, complexity));
        if (!hasData) return null;

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
                {items.map((item, i) => {
                  const cost = getCostByComplexity(item.costs, complexity);
                  return (
                    <div key={item.key || i} className="text-center">
                      <h3 className="mb-3 font-semibold text-slate-700">{item.label}</h3>
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
                      {item.linkSlug && (
                        <Link
                          href={`/${item.linkSlug}/${item.linkCategory}-cost`}
                          className="mt-3 inline-block text-xs font-medium text-teal-600 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 rounded-sm"
                        >
                          View full details →
                        </Link>
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
  );
}
