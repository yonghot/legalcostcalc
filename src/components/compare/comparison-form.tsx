"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CATEGORIES } from "@/lib/constants/categories";
import { STATES } from "@/lib/constants/states";
import { ArrowLeftRight, BarChart3, MapPin } from "lucide-react";

export type CompareMode = "states" | "categories";

interface ComparisonFormProps {
  mode: CompareMode;
  onModeChange: (mode: CompareMode) => void;
  state1: string;
  onState1Change: (value: string) => void;
  state2: string;
  onState2Change: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  category2: string;
  onCategory2Change: (value: string) => void;
  onCompare: () => void;
  isFormValid: boolean;
  loading: boolean;
}

export function ComparisonForm({
  mode,
  onModeChange,
  state1,
  onState1Change,
  state2,
  onState2Change,
  category,
  onCategoryChange,
  category2,
  onCategory2Change,
  onCompare,
  isFormValid,
  loading,
}: ComparisonFormProps) {
  return (
    <>
      {/* Mode Toggle */}
      <div className="mt-6 flex justify-center gap-2">
        <Button
          variant={mode === "states" ? "default" : "outline"}
          onClick={() => onModeChange("states")}
          className={mode === "states" ? "bg-teal-600 hover:bg-teal-700" : ""}
        >
          <MapPin className="mr-2 h-5 w-5" aria-hidden="true" />
          Compare States
        </Button>
        <Button
          variant={mode === "categories" ? "default" : "outline"}
          onClick={() => onModeChange("categories")}
          className={mode === "categories" ? "bg-teal-600 hover:bg-teal-700" : ""}
        >
          <BarChart3 className="mr-2 h-5 w-5" aria-hidden="true" />
          Compare Categories
        </Button>
      </div>

      {/* Comparison Form */}
      <Card className="mt-6 border-slate-200 shadow-sm">
        <CardContent className="p-6">
          {mode === "states" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
              <div className="space-y-2">
                <Label>State 1</Label>
                <Select value={state1} onValueChange={(v) => onState1Change(v ?? "")}>
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
                <Select value={state2} onValueChange={(v) => onState2Change(v ?? "")}>
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
                <Select value={category} onValueChange={(v) => onCategoryChange(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.slug} value={c.slug}>{c.displayName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={onCompare}
                disabled={!isFormValid || loading}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {loading ? "Comparing..." : "Compare"}
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
              <div className="space-y-2">
                <Label>State</Label>
                <Select value={state1} onValueChange={(v) => onState1Change(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {STATES.map((s) => (
                      <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Category 1</Label>
                <Select value={category} onValueChange={(v) => onCategoryChange(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.slug} value={c.slug}>{c.displayName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="hidden lg:flex items-center justify-center">
                <ArrowLeftRight className="h-5 w-5 text-slate-400" aria-hidden="true" />
              </div>

              <div className="space-y-2">
                <Label>Category 2</Label>
                <Select value={category2} onValueChange={(v) => onCategory2Change(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.filter((c) => c.slug !== category).map((c) => (
                      <SelectItem key={c.slug} value={c.slug}>{c.displayName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={onCompare}
                disabled={!isFormValid || loading}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {loading ? "Comparing..." : "Compare"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
