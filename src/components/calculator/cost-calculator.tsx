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
import { STATES } from "@/lib/constants/states";
import { CostResult } from "./cost-result";
import { Calculator } from "lucide-react";
import { useCalculateCost } from "@/lib/hooks/use-calculate-cost";

interface CostCalculatorProps {
  initialCategory?: string;
  initialState?: string;
}

export function CostCalculator({ initialCategory, initialState }: CostCalculatorProps) {
  const [category, setCategory] = useState(initialCategory || "");
  const [stateCode, setStateCode] = useState(initialState || "");
  const [complexity, setComplexity] = useState("moderate");

  const { loading, error, results, calculate } = useCalculateCost();
  const resultRef = useRef<HTMLDivElement>(null);

  const handleCalculate = useCallback(async () => {
    const outcome = await calculate({ category, state: stateCode, complexity });
    if (outcome.hasResults) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    }
  }, [category, stateCode, complexity, calculate]);

  return (
    <div className="space-y-6">
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
              <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
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
              <Select value={stateCode} onValueChange={(v) => setStateCode(v ?? "")}>
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
              <Select value={complexity} onValueChange={(v) => setComplexity(v ?? "moderate")}>
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
                disabled={!category || !stateCode || loading}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                {loading ? "Calculating..." : "Calculate Cost"}
              </Button>
            </div>
          </div>
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
