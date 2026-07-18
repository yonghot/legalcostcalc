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
import { CALCULATOR_PRESETS, type CalculatorPreset } from "@/lib/constants/presets";
import { FOCUS_RING } from "@/lib/utils/styles";

interface CostCalculatorProps {
  initialCategory?: string;
  initialState?: string;
  /**
   * True on embed/iframe surfaces (/embed/[state]/[slug]) — threads through
   * CostResult to ResultMonetization so no ads/CTA/partner content ever
   * renders inside a third-party iframe. Defaults to false everywhere else.
   */
  monetizationDisabled?: boolean;
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

export function CostCalculator({
  initialCategory,
  initialState,
  monetizationDisabled,
}: CostCalculatorProps) {
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

  // Accepts optional overrides so a preset click (which sets category/
  // stateCode/complexity via setState just before calling this) can compute
  // with the EXACT preset values immediately, rather than the stale
  // pre-render closure values React hasn't committed yet. A manual
  // Calculate-button click (no overrides) behaves exactly as before, reading
  // the already-committed state.
  const runCalculate = useCallback(
    async (overrides?: { category: string; stateCode: string; complexity: string }) => {
      const effCategory = overrides?.category ?? category;
      const effStateCode = overrides?.stateCode ?? stateCode;
      const effComplexity = overrides?.complexity ?? complexity;

      const outcome = await calculate({ category: effCategory, state: effStateCode, complexity: effComplexity });
      if (outcome.hasResults) {
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 100);

        if (effCategory) {
          const now = Date.now();
          if (shouldFireCalculatorComplete(hasUserInteractedRef.current, lastCompleteAtRef.current[effCategory], now)) {
            lastCompleteAtRef.current[effCategory] = now;
            // SENSITIVE SITE (legalcostcalc): never include result_bucket,
            // preset id, or any input-derived value — event name + calc_type
            // + site only. Identical for a preset-driven or manual completion.
            trackEvent("calculator_complete", { calc_type: effCategory });
          }
        }

        // T16 — auto-save the allowlisted selector fields on a successful,
        // user-driven calculation, and record this calc_type on the homepage
        // "Recent calculations" list (calc_type + date only, no result values).
        // Pass the actual selected category as the recorded/reported calc_type
        // (the hook's own "cost_calculator" is just the storage namespace).
        persistence.save({ category: effCategory, stateCode: effStateCode, complexity: effComplexity });
        persistence.recordRecent(effCategory);
      }
    },
    [category, stateCode, complexity, calculate, persistence],
  );

  const handleCalculate = useCallback(async () => {
    // Clickwrap gate: before the FIRST calculation, require active consent.
    if (!termsGate.hasConsented) return;
    await runCalculate();
  }, [termsGate.hasConsented, runCalculate]);

  // U-01 — preset one-click scenario. Injects all three inputs through the
  // SAME path a real dropdown edit takes: markInteracted() first (so the
  // existing T03 hasUserInteractedRef/calc_input_start guard fires exactly
  // as it would for a human-driven change), then the three setState calls.
  // Compliance: this NEVER touches TermsGate's consent state directly (no
  // call to termsGate.accept()/localStorage) — it only ever invokes the
  // already-gated runCalculate(), and only when consent was already
  // recorded. If consent has not been given yet, the fields fill in and the
  // existing clickwrap TermsGateInline below still requires an explicit,
  // separate accept before any calculation runs — presets never bypass it.
  const handlePresetClick = useCallback(
    (preset: CalculatorPreset) => {
      markInteracted();
      setCategory(preset.category);
      setStateCode(preset.stateCode);
      setComplexity(preset.complexity);
      if (termsGate.hasConsented) {
        void runCalculate({
          category: preset.category,
          stateCode: preset.stateCode,
          complexity: preset.complexity,
        });
      }
    },
    [markInteracted, termsGate.hasConsented, runCalculate],
  );

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

      {/* K05 — passive marker (no behavior change) identifying the
          inputs+Calculate-button widget as an ad-exclusion zone. Documented
          in docs/ad-exclusion-zones.md for the owner to register with
          AdSense Auto ads' page-level exclusion tool once approved. */}
      <Card className="border-slate-200 shadow-sm" data-ad-exclusion-zone="calculator-widget">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calculator className="h-5 w-5 text-teal-600" aria-hidden="true" />
            Legal Cost Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* U-01 — preset one-click scenarios. Above-fold, directly adjacent
              to the inputs below (same Card, same ad-exclusion zone as K05
              above — well inside the >=150px ad-proximity buffer since no ad
              marker renders anywhere in this component before a result
              exists; see tests/ad-proximity.test.ts and
              tests/calculator-presets.test.ts). Outline pill styling (teal
              tokens, no fill, no shadow) so these read as example shortcuts,
              never as ad units. Values are real dataset rows — see
              src/lib/constants/presets.ts and its dataset-equality test. */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Try an example:</span>
            {CALCULATOR_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetClick(preset)}
                className={`rounded-full border border-teal-200 bg-white px-3 py-1 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-50 ${FOCUS_RING}`}
              >
                {preset.label}
              </button>
            ))}
          </div>

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
          monetizationDisabled={monetizationDisabled}
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
