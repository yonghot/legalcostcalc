import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CostDisplay } from "@/components/shared/cost-display";
import { Disclaimer } from "@/components/shared/disclaimer";
import { LegalCostData } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/format";
import { isSafeUrl } from "@/lib/utils/sanitize";
import { Clock, DollarSign, FileText, ExternalLink } from "lucide-react";

interface CostResultProps {
  results: LegalCostData[];
  stateName: string;
  categoryName: string;
}

export const CostResult = memo(function CostResult({
  results,
  stateName,
  categoryName,
}: CostResultProps) {
  // Show the first result (filtered by complexity)
  const cost = results[0];

  if (!cost) return null;

  const safeSourceUrls = cost.sources.filter(isSafeUrl);

  return (
    <div className="space-y-4">
      <Disclaimer variant="full" />

      <Card className="overflow-hidden border-slate-200 shadow-md">
        <CardHeader className="bg-gradient-to-r from-teal-600 to-teal-700 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {categoryName} Cost in {stateName}
            </CardTitle>
            <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
              {cost.complexity.charAt(0).toUpperCase() + cost.complexity.slice(1)} Case
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Main cost display */}
          <div className="mb-6">
            <CostDisplay costRange={cost.costRange} label="Estimated Total Cost" />
          </div>

          <Separator className="my-6" />

          {/* Details grid */}
          <div className="grid gap-6 sm:grid-cols-3">
            {/* Hourly Rate */}
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                <DollarSign className="h-4 w-4" aria-hidden="true" />
                Hourly Rate
              </div>
              <p className="font-mono text-lg font-semibold text-slate-900">
                {formatCurrency(cost.hourlyRate.low)} – {formatCurrency(cost.hourlyRate.high)}
              </p>
              <p className="mt-1 font-mono text-xs text-slate-500">
                Median: {formatCurrency(cost.hourlyRate.median)}/hr
              </p>
            </div>

            {/* Duration */}
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                <Clock className="h-4 w-4" aria-hidden="true" />
                Typical Duration
              </div>
              <p className="text-lg font-semibold text-slate-900">
                {cost.typicalDuration}
              </p>
            </div>

            {/* Common Fees */}
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                <FileText className="h-4 w-4" aria-hidden="true" />
                Common Fees
              </div>
              <ul className="space-y-1">
                {cost.commonFees.slice(0, 4).map((fee, i) => (
                  <li key={i} className="text-sm text-slate-700">
                    {fee}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sources -- only render verified safe URLs */}
          {safeSourceUrls.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-medium text-slate-500">Data Sources:</p>
              <div className="flex flex-wrap gap-2">
                {safeSourceUrls.map((source, i) => (
                  <a
                    key={i}
                    href={source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                  >
                    Source {i + 1}
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Data freshness */}
          {cost.lastVerifiedAt && (
            <p className="mt-4 text-xs text-slate-400">
              Last verified: {new Date(cost.lastVerifiedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
              })}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
});
