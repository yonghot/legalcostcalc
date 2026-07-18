import { memo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CostDisplay } from "@/components/shared/cost-display";
import { Disclaimer } from "@/components/shared/disclaimer";
import { ResultDisclaimer } from "@/components/compliance/ResultDisclaimer";
import { LegalCostData } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/format";
import { isSafeUrl } from "@/lib/utils/sanitize";
import { checkDataFreshness } from "@/lib/utils/data-freshness";
import { Clock, DollarSign, FileText, ExternalLink, Percent } from "lucide-react";
import { FOCUS_RING } from "@/lib/utils/styles";
import { ResultMonetization } from "@/components/monetization/ResultMonetization";
import { trackEvent } from "@/lib/analytics";
import { RelatedMatters } from "@/components/seo/related-matters";
import { ResultShare } from "@/components/shared/result-share";
import { EmailMyResults } from "@/components/shared/email-my-results";

function handleSourceClick(url: string) {
  const linkDomain = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  })();
  trackEvent("outbound_click", { link_domain: linkDomain, link_type: "citation" });
}

interface CostResultProps {
  results: LegalCostData[];
  stateName: string;
  categoryName: string;
  /** Optional category slug for monetization partner filtering. */
  categorySlug?: string;
  /** Optional state code + slug — enables the T06 RelatedMatters module when both are present. */
  stateCode?: string;
  stateSlug?: string;
  /** True on embed/iframe surfaces — suppresses the ResultMonetization stack entirely. */
  monetizationDisabled?: boolean;
}

export const CostResult = memo(function CostResult({
  results,
  stateName,
  categoryName,
  categorySlug,
  stateCode,
  stateSlug,
  monetizationDisabled,
}: CostResultProps) {
  // Show the first result (filtered by complexity)
  const cost = results[0];

  if (!cost) return null;

  const safeSourceUrls = cost.sources.filter(isSafeUrl);

  // Personal-injury attorneys charge contingency fees, not hourly rates.
  // When all hourly values are 0 and contingency data is available, show the
  // Contingency Fee card instead of the (misleadingly zero) Hourly Rate card.
  const isContingencyBasis =
    cost.hourlyRate.low === 0 &&
    cost.hourlyRate.median === 0 &&
    cost.hourlyRate.high === 0;

  return (
    <div className="space-y-4">
      <Disclaimer variant="full" />

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="bg-teal-600 text-white">
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
            {/* Hourly Rate — hidden when the category bills on contingency */}
            {!isContingencyBasis && (
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                  <DollarSign className="h-5 w-5" aria-hidden="true" />
                  Hourly Rate
                </div>
                <p className="font-mono text-lg font-semibold text-slate-900">
                  {formatCurrency(cost.hourlyRate.low)} – {formatCurrency(cost.hourlyRate.high)}
                </p>
                <p className="mt-1 font-mono text-xs text-slate-500">
                  Median: {formatCurrency(cost.hourlyRate.median)}/hr
                </p>
              </div>
            )}

            {/* Contingency Fee — shown instead of Hourly Rate for personal-injury */}
            {isContingencyBasis && cost.contingencyFee && (
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                  <Percent className="h-5 w-5" aria-hidden="true" />
                  Contingency Fee
                </div>
                <p className="font-mono text-lg font-semibold text-slate-900">
                  {cost.contingencyFee.low}% – {cost.contingencyFee.high}%
                </p>
                <p className="mt-1 font-mono text-xs text-slate-500">
                  Median: {cost.contingencyFee.median}% of settlement
                </p>
              </div>
            )}

            {/* Contingency basis — shown when no contingency data is available */}
            {isContingencyBasis && !cost.contingencyFee && (
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                  <Percent className="h-5 w-5" aria-hidden="true" />
                  Attorney Fees
                </div>
                <p className="text-sm text-slate-700">
                  Contingency basis — see Common Fees
                </p>
              </div>
            )}

            {/* Duration */}
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                <Clock className="h-5 w-5" aria-hidden="true" />
                Typical Duration
              </div>
              <p className="text-lg font-semibold text-slate-900">
                {cost.typicalDuration}
              </p>
            </div>

            {/* Common Fees */}
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                <FileText className="h-5 w-5" aria-hidden="true" />
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
                    onClick={() => handleSourceClick(source)}
                    className={`inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 transition-colors ${FOCUS_RING}`}
                  >
                    Source {i + 1}
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Data freshness */}
          {cost.lastVerifiedAt && (() => {
            const { isStale, formattedDate } = checkDataFreshness(cost.lastVerifiedAt);

            return (
              <div className="mt-4">
                {isStale && (
                  <p className="mb-1 text-xs font-medium text-amber-600">
                    This data may be outdated. Last verified over 1 year ago.
                  </p>
                )}
                <p className="text-xs text-slate-400">
                  Last verified: {formattedDate}
                </p>
                {safeSourceUrls.length < 2 && (
                  <p className="mt-1 text-xs italic text-slate-400">
                    Estimated range (single source)
                  </p>
                )}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* T15 — ResultShare: "Copy link"/Web Share for this result. SENSITIVE
          SITE: shares the current clean category/state URL (usePathname())
          with ZERO query params / input state — only rendered when we're on
          an actual /[state]/[slug] spoke page (categorySlug present), since
          that pathname IS the category-level clean share target. Not shown
          from the homepage's generic calculator (no stable category URL to
          share there). */}
      {categorySlug && (
        <ResultShare calcType={categorySlug} className="justify-center sm:justify-start" />
      )}

      {/* ResultDisclaimer — layered UPL disclaimer ADJACENT to the result
          (never footer-only), supplementing the top Disclaimer above. Shows
          the figures' last-verified date and, when available, the first
          verified source link. */}
      <ResultDisclaimer
        lastVerified={cost.lastVerifiedAt ?? undefined}
        sourceUrl={safeSourceUrls[0]}
      />

      {/* U-05 (부속U §4/§5) — guide link at the result moment. Plain text
          link (no card/border), clearly distinct from the ad markers in
          ResultMonetization below it — informational cross-link only, not a
          monetization surface. */}
      <p className="text-sm text-slate-500">
        New to how attorney fees work?{" "}
        <Link
          href="/how-legal-fees-work"
          className="font-medium text-teal-700 underline hover:text-teal-800"
        >
          Read the legal fees guide
        </Link>{" "}
        — hourly, flat, and contingency billing explained.
      </p>

      {/* T06 — RelatedMatters: internal sibling matter-type links at the
          result moment. Renders only after this user-driven result exists
          (CostResult itself only mounts once `results` is set — see the
          hasUserInteractedRef guard in cost-calculator.tsx), directly BELOW
          the result block and clearly ABOVE the ResultMonetization ad slot
          with >=24px separation (mt-8 on this block + ResultMonetization's
          own mt-8 gives >=32px). Visually distinct card styling (bordered
          white card, "More calculators" label) — never styled like an ad. */}
      {stateCode && stateSlug && categorySlug && (
        <RelatedMatters
          stateCode={stateCode}
          stateSlug={stateSlug}
          stateName={stateName}
          categorySlug={categorySlug}
        />
      )}

      {/* T17 — EmailMyResults: env-gated transactional "email my results"
          form (EMAIL_CAPTURE_ENDPOINT + NEXT_PUBLIC_EMAIL_CAPTURE_ENABLED='1').
          Renders nothing when unset. Distinct from ResultMonetization's
          marketing EmailCapture below (gated by NEXT_PUBLIC_EMAIL_CAPTURE +
          NEXT_PUBLIC_POSTAL_ADDRESS) — this one sends ONLY the result
          permalink, zero promo, via /api/email-results. */}
      {categorySlug && <EmailMyResults calcType={categorySlug} />}

      {/* ResultMonetization — inserted directly below the cost result card.
          Never above the result (protects LCP). Disclaimer top+bottom remain
          intact via the Disclaimer component at the top of this component and
          on the page-level layout. Each block renders null when its env var is
          unset (no empty boxes, no broken links). On the embed widget
          (monetizationDisabled) the whole stack renders null — ads must never
          load inside a third-party iframe. */}
      <ResultMonetization
        context={`${categoryName} cost in ${stateName}`}
        categorySlug={categorySlug}
        stateName={stateName}
        monetizationDisabled={monetizationDisabled}
      />
    </div>
  );
});
