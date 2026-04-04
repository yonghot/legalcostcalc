"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Disclaimer } from "@/components/shared/disclaimer";
import { CATEGORIES } from "@/lib/constants/categories";
import { STATES } from "@/lib/constants/states";
import { CostComparisonResult, LegalCostData } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/format";
import { ArrowLeftRight } from "lucide-react";

export default function ComparePage() {
  const [state1, setState1] = useState("");
  const [state2, setState2] = useState("");
  const [category, setCategory] = useState("");
  const [result, setResult] = useState<CostComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async () => {
    if (!state1 || !state2 || !category) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        states: `${state1},${state2}`,
        category,
      });
      const res = await fetch(`/api/costs/compare?${params}`);
      const json = await res.json();

      if (json.error) {
        setError(json.error);
        setResult(null);
      } else {
        setResult(json.data);
      }
    } catch {
      setError("Failed to compare costs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getCostByComplexity = (costs: LegalCostData[], complexity: string) =>
    costs.find((c) => c.complexity === complexity);

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Disclaimer />

        <div className="mt-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Compare Legal Costs Between States
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            See how legal costs differ between two states for the same type of legal matter.
          </p>
        </div>

        {/* Comparison Form */}
        <Card className="mt-8 border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
              <div className="space-y-2">
                <Label>State 1</Label>
                <Select value={state1} onValueChange={(v) => setState1(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {STATES.map((s) => (
                      <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="hidden lg:flex items-center justify-center">
                <ArrowLeftRight className="h-5 w-5 text-slate-400" aria-hidden="true" />
              </div>

              <div className="space-y-2">
                <Label>State 2</Label>
                <Select value={state2} onValueChange={(v) => setState2(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {STATES.map((s) => (
                      <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.slug} value={c.slug}>{c.displayName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleCompare}
                disabled={!state1 || !state2 || !category || loading}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {loading ? "Comparing..." : "Compare"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Results */}
        {result && result.states.length === 2 && (
          <div className="mt-8 space-y-6">
            <h2 className="text-xl font-bold text-slate-900">
              {CATEGORIES.find((c) => c.slug === result.category)?.displayName} Cost Comparison
            </h2>

            {(["simple", "moderate", "complex"] as const).map((complexity) => {
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
                          <div key={i} className="text-center">
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

        <div className="mt-12">
          <Disclaimer />
        </div>
      </div>
    </div>
  );
}
