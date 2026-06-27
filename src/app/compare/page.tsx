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
import { LegalCostData } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/format";
import { useCompareCosts } from "@/lib/hooks/use-compare-costs";
import { FOCUS_RING } from "@/lib/utils/styles";
import Link from "next/link";

export default function ComparePage() {
  const [mode, setMode] = useState<CompareMode>("states");
  const [state1, setState1] = useState("");
  const [state2, setState2] = useState("");
  const [category, setCategory] = useState("");
  const [category2, setCategory2] = useState("");

  const {
    loading,
    error,
    stateResult,
    categoryResult,
    compareStates,
    compareCategories,
    reset,
  } = useCompareCosts();

  const handleCompareStates = useCallback(
    () => compareStates(state1, state2, category),
    [state1, state2, category, compareStates]
  );

  const handleCompareCategories = useCallback(
    () => compareCategories(state1, category, category2),
    [state1, category, category2, compareCategories]
  );

  const handleCompare = mode === "states" ? handleCompareStates : handleCompareCategories;

  const isFormValid =
    mode === "states"
      ? !!(state1 && state2 && category && state1 !== state2)
      : !!(state1 && category && category2 && category !== category2);

  const handleModeChange = (newMode: CompareMode) => {
    setMode(newMode);
    reset();
  };

  return (
    <div className="bg-gradient-to-b from-teal-50 to-white py-16 sm:py-20">
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "Compare Costs", href: "/compare" },
        ]}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Disclaimer />

        <nav className="mt-8 text-sm text-slate-500">
          <Link href="/" className={`hover:text-teal-600 ${FOCUS_RING} rounded-sm`}>Home</Link>
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

        <div aria-live="polite" aria-label="Comparison results">
        {/* Cross-State Results */}
        {stateResult && stateResult.states.length === 2 && (
          <ComparisonResultSection
            title={`${CATEGORIES.find((c) => c.slug === stateResult.category)?.displayName} Cost Comparison`}
            items={stateResult.states.map((s) => ({
              key: s.stateCode,
              label: s.stateName,
              costs: s.costs,
              linkSlug: STATES.find((st) => st.code === s.stateCode)?.slug,
              linkCategory: stateResult.category,
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
        </div>

        <div className="mt-12">
          <Disclaimer />
        </div>
      </div>
    </div>
  );
}

function CostDifference({ cost1, cost2 }: { cost1: number; cost2: number }) {
  if (!cost1 || !cost2) return null;
  const diff = cost2 - cost1;
  const pctDiff = Math.round((diff / cost1) * 100);
  if (diff === 0) {
    return (
      <div className="flex items-center justify-center py-2 text-sm text-slate-500">
        Same median cost
      </div>
    );
  }
  const isHigher = diff > 0;
  return (
    <div className="flex items-center justify-center gap-1.5 py-2">
      <span className={`font-mono text-sm font-semibold ${isHigher ? "text-red-600" : "text-teal-600"}`}>
        {isHigher ? "+" : ""}{formatCurrency(diff)}
      </span>
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${isHigher ? "bg-red-50 text-red-700" : "bg-teal-50 text-teal-700"}`}>
        {isHigher ? "+" : ""}{pctDiff}%
      </span>
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

        const cost0 = getCostByComplexity(items[0]?.costs ?? [], complexity);
        const cost1 = getCostByComplexity(items[1]?.costs ?? [], complexity);

        return (
          <Card key={complexity} className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Badge variant="outline" className="capitalize">{complexity}</Badge>
                Complexity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                          className={`mt-3 inline-block text-xs font-medium text-teal-600 hover:text-teal-700 ${FOCUS_RING} rounded-sm`}
                        >
                          View full details →
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Visual difference indicator */}
              {cost0 && cost1 && (
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <CostDifference
                    cost1={cost0.costRange.median}
                    cost2={cost1.costRange.median}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
