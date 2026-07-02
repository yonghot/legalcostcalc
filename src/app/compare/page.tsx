"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Disclaimer } from "@/components/shared/disclaimer";
import { ComparisonForm, CompareMode } from "@/components/compare/comparison-form";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { CATEGORIES } from "@/lib/constants/categories";
import { STATES } from "@/lib/constants/states";
import { VALID_COMPLEXITIES } from "@/lib/constants/costs";
import { LegalCostData } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/format";
import { useCompareCosts } from "@/lib/hooks/use-compare-costs";
import { FOCUS_RING } from "@/lib/utils/styles";
import { AffiliateCTA } from "@/components/shared/affiliate-cta";
import { useTermsGate, TermsGateInline } from "@/components/compliance/TermsGate";
import { trackEvent } from "@/lib/analytics";
import { shouldFireCalculatorComplete } from "@/lib/utils/calc-funnel";
import Link from "next/link";

// calc_type slug for this page's analytics events.
const CALC_TYPE = "compare";

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

  const termsGate = useTermsGate();

  // T03 guard: calculator_complete must NEVER fire on default/SSR render —
  // only after a REAL user-driven input change. Set exclusively by the field
  // change handlers passed to <ComparisonForm>, never by effects.
  const hasUserInteractedRef = useRef(false);
  const lastCompleteAtRef = useRef(0);

  const markInteracted = useCallback(() => {
    if (hasUserInteractedRef.current) return;
    hasUserInteractedRef.current = true;
    trackEvent("calc_input_start", { calc_type: CALC_TYPE });
  }, []);

  // Fire calculator_complete once a user-initiated comparison result renders.
  // This effect only reacts to result state that is exclusively set inside
  // compareStates/compareCategories (never on initial mount, since both start
  // null), and is further gated by hasUserInteractedRef.
  useEffect(() => {
    if (!stateResult && !categoryResult) return;
    const now = Date.now();
    if (!shouldFireCalculatorComplete(hasUserInteractedRef.current, lastCompleteAtRef.current, now)) return;
    lastCompleteAtRef.current = now;
    // SENSITIVE SITE (legalcostcalc): never include result_bucket or any
    // input-derived value — event name + calc_type + site only.
    trackEvent("calculator_complete", { calc_type: CALC_TYPE });
  }, [stateResult, categoryResult]);

  const handleCompareStates = useCallback(
    () => compareStates(state1, state2, category),
    [state1, state2, category, compareStates]
  );

  const handleCompareCategories = useCallback(
    () => compareCategories(state1, category, category2),
    [state1, category, category2, compareCategories]
  );

  const runCompare = mode === "states" ? handleCompareStates : handleCompareCategories;

  // Clickwrap gate: before the FIRST calculation, require active consent.
  const handleCompare = useCallback(() => {
    if (!termsGate.hasConsented) return;
    runCompare();
  }, [termsGate.hasConsented, runCompare]);

  const handleGateAccept = useCallback(() => {
    const accepted = termsGate.accept();
    if (accepted) runCompare();
  }, [termsGate, runCompare]);

  const isFormValid =
    (mode === "states"
      ? !!(state1 && state2 && category && state1 !== state2)
      : !!(state1 && category && category2 && category !== category2)) &&
    Boolean(termsGate.hasConsented);

  const handleModeChange = (newMode: CompareMode) => {
    setMode(newMode);
    reset();
  };

  const handleState1Change = useCallback((v: string) => {
    markInteracted();
    setState1(v);
  }, [markInteracted]);

  const handleState2Change = useCallback((v: string) => {
    markInteracted();
    setState2(v);
  }, [markInteracted]);

  const handleCategoryChange = useCallback((v: string) => {
    markInteracted();
    setCategory(v);
  }, [markInteracted]);

  const handleCategory2Change = useCallback((v: string) => {
    markInteracted();
    setCategory2(v);
  }, [markInteracted]);

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

        <Breadcrumbs
          className="mt-8"
          items={[
            { name: "Home", href: "/" },
            { name: "Compare Costs", href: "/compare" },
          ]}
        />

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
          onState1Change={handleState1Change}
          state2={state2}
          onState2Change={handleState2Change}
          category={category}
          onCategoryChange={handleCategoryChange}
          category2={category2}
          onCategory2Change={handleCategory2Change}
          onCompare={handleCompare}
          isFormValid={isFormValid}
          loading={loading}
        />

        {/* Clickwrap gate — shown until consent is recorded, then never again. */}
        {termsGate.hasConsented === false && (
          <div className="mt-4">
            <TermsGateInline
              checked={termsGate.checked}
              onCheckedChange={termsGate.setChecked}
              onAccept={handleGateAccept}
            />
          </div>
        )}

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

        <div className="mt-8">
          <AffiliateCTA categorySlug={category || undefined} />
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
