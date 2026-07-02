"use client";

import { useState, useRef, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CATEGORIES } from "@/lib/constants/categories";
import { STATES, STATE_MAP } from "@/lib/constants/states";
import { CostResult } from "./cost-result";
import { Calculator } from "lucide-react";
import { useCalculateCost } from "@/lib/hooks/use-calculate-cost";
import { useTermsGate, TermsGateInline } from "@/components/compliance/TermsGate";
import { trackEvent } from "@/lib/analytics";
import { shouldFireCalculatorComplete } from "@/lib/utils/calc-funnel";
import { useCalculatorPersistence } from "@/lib/hooks/use-calculator-persistence";
import { ContinueBanner } from "@/components/shared/continue-banner";

interface CostCalculatorProps {
  initialCategory?: string;
  initialState?: string;
}

// T16 — persistence allowlist for this calculator. `category`/`stateCode`/
// `complexity` are the same non-sensitive selector values already exposed
// in the URL path for spoke pages (never a free-text/financial matter
// detail) — the only fields this calculator ever saves.
type PersistedCostCalculatorFields = {
  category: string;
  stateCode: string;
  complexity: string;
};
const PERSISTENCE_ALLOWED_FIELDS: readonly (keyof PersistedCostCalculatorFields)[] = [
  "category",
  "stateCode",
  "complexity",
];

export function CostCalculator({ initialCategory, initialState }: CostCalculatorProps) {
  const [category, setCategory] = useState(initialCategory || "");
  const [stateCode, setStateCode] = useState(initialState || "");
  const [complexity, setComplexity] = useState("moderate");

  const { loading, error, results, calculate } = useCalculateCost();
  const resultRef = useRef<HTMLDivElement>(null);
  const termsGate = useTermsGate();

  // T16 — localStorage persistence, OFF by default beyond the allowlisted
  // non-sensitive selector fields above (sensitive-site rule). Storage key
  // uses a FIXED "cost_calculator" namespace (not the dynamically-selected
  // category) — this is a single calculator whose own selected category is
  // itself one of the saved/restored fields, so the storage slot must be
  // stable across category changes rather than re-keyed per category.
  const persistence = useCalculatorPersistence<PersistedCostCalculatorFields>({
    calcType: "cost_calculator",
    allowedFields: PERSISTENCE_ALLOWED_FIELDS,
  });

  // T03 guard: calculator_complete must NEVER fire on default/SSR render or
  // any automatic lifecycle — only after a REAL user-driven input change.
  // This component has no default-computed result (results start null and
  // are only set inside runCalculate), so the ref additionally guards against
  // firing calculator_complete before the user has touched a control at all.
  const hasUserInteractedRef = useRef(false);
  const lastCompleteAtRef = useRef<Record<string, number>>({});

  const markInteracted = useCallback(() => {
    if (hasUserInteractedRef.current) return;
    hasUserInteractedRef.current = true;
    trackEvent("calc_input_start", { calc_type: category || "unset" });
  }, [category]);

  const runCalculate = useCallback(async () => {
    const outcome = await calculate({ category, state: stateCode, complexity });
    if (outcome.hasResults) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);

      if (category) {
        const now = Date.now();
        if (shouldFireCalculatorComplete(hasUserInteractedRef.current, lastCompleteAtRef.current[category], now)) {
          lastCompleteAtRef.current[category] = now;
          // SENSITIVE SITE (legalcostcalc): never include result_bucket or
          // any input-derived value — event name + calc_type + site only.
          trackEvent("calculator_complete", { calc_type: category });
        }
      }

      // T16 — auto-save the allowlisted selector fields on a successful,
      // user-driven calculation, and record this calc_type on the homepage
      // "Recent calculations" list (calc_type + date only, no result values).
      // Pass the actual selected category as the recorded/reported calc_type
      // (the hook's own "cost_calculator" is just the storage namespace).
      persistence.save({ category, stateCode, complexity });
      persistence.recordRecent(category);
    }
  }, [category, stateCode, complexity, calculate, persistence]);

  const handleCalculate = useCallback(async () => {
    // Clickwrap gate: before the FIRST calculation, require active consent.
    if (!termsGate.hasConsented) return;
    await runCalculate();
  }, [termsGate.hasConsented, runCalculate]);

  const handleGateAccept = useCallback(() => {
    const accepted = termsGate.accept();
    if (accepted) void runCalculate();
  }, [termsGate, runCalculate]);

  // T16 — apply a saved calculator state onto this component's own input
  // state. Marks interacted (a restored session is user-driven context, but
  // does NOT itself run a calculation or fire calculator_complete — the user
  // still presses Calculate).
  const handleApplySavedState = useCallback(() => {
    persistence.restore((fields) => {
      if (fields.category !== undefined) setCategory(fields.category);
      if (fields.stateCode !== undefined) setStateCode(fields.stateCode);
      if (fields.complexity !== undefined) setComplexity(fields.complexity);
    }, persistence.savedState?.fields.category);
  }, [persistence]);

  return (
    <div className="space-y-6">
      {persistence.savedState && (
        <ContinueBanner
          onApply={handleApplySavedState}
          onDismiss={persistence.dismissBanner}
        />
      )}

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calculator className="h-5 w-5 text-teal-600" aria-hidden="true" />
            Legal Cost Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="category">Legal Category</Label>
              <Select
                value={category}
                onValueChange={(v) => {
                  markInteracted();
                  setCategory(v ?? "");
                }}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.slug} value={cat.slug}>
                      {cat.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Select
                value={stateCode}
                onValueChange={(v) => {
                  markInteracted();
                  setStateCode(v ?? "");
                }}
              >
                <SelectTrigger id="state">
                  <SelectValue placeholder="Select state..." />
                </SelectTrigger>
                <SelectContent>
                  {STATES.map((state) => (
                    <SelectItem key={state.code} value={state.code}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="complexity">Case Complexity</Label>
              <Select
                value={complexity}
                onValueChange={(v) => {
                  markInteracted();
                  setComplexity(v ?? "moderate");
                }}
              >
                <SelectTrigger id="complexity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="complex">Complex</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleCalculate}
                disabled={!category || !stateCode || loading || !termsGate.hasConsented}
                className="w-full"
              >
                {loading ? "Calculating..." : "Calculate Cost"}
              </Button>
            </div>
          </div>

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
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <div aria-live="polite" aria-label="Cost calculation results">
      {results && results.length > 0 && (
        <div ref={resultRef}>
        <CostResult
          results={results}
          stateName={STATES.find((s) => s.code === stateCode)?.name || stateCode}
          categoryName={CATEGORIES.find((c) => c.slug === category)?.displayName || category}
          categorySlug={category}
          stateCode={stateCode}
          stateSlug={STATE_MAP.get(stateCode)?.slug}
        />
        </div>
      )}

      {results && results.length === 0 && (
        <Card className="border-slate-200">
          <CardContent className="py-8 text-center text-slate-500">
            No cost data available for this combination. Data is being collected and will be available soon.
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}
