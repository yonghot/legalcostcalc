import { memo } from "react";
import { formatCurrency } from "@/lib/utils/format";
import { CostRange } from "@/lib/types";

interface CostDisplayProps {
  costRange: CostRange;
  label?: string;
}

export const CostDisplay = memo(function CostDisplay({ costRange, label }: CostDisplayProps) {
  return (
    <div className="text-center">
      {label && (
        <p className="mb-2 text-sm font-medium text-slate-500">{label}</p>
      )}
      <div className="flex items-baseline justify-center gap-1">
        <span className="font-mono text-lg text-slate-500">
          {formatCurrency(costRange.low)}
        </span>
        <span className="text-slate-400">–</span>
        <span className="font-mono text-3xl font-bold text-teal-600">
          {formatCurrency(costRange.median)}
        </span>
        <span className="text-slate-400">–</span>
        <span className="font-mono text-lg text-slate-500">
          {formatCurrency(costRange.high)}
        </span>
      </div>
      <div className="mt-1 flex justify-center gap-6 text-xs text-slate-400">
        <span>Low</span>
        <span>Median</span>
        <span>High</span>
      </div>
    </div>
  );
});
