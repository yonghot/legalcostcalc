"use client";

import { ExternalLink } from "lucide-react";
import {
  getPartnersForCategory,
  getAffiliateTrackingUrl,
  type AffiliatePartner,
} from "@/lib/constants/affiliates";
import { CARD_HOVER, FOCUS_RING } from "@/lib/utils/styles";
import { isSafeUrl } from "@/lib/utils/sanitize";
import { AffiliateDisclosure } from "@/components/compliance/AffiliateDisclosure";
import { trackEvent } from "@/lib/analytics";

function handleOutboundClick(url: string) {
  const linkDomain = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  })();
  trackEvent("outbound_click", { link_domain: linkDomain, link_type: "affiliate" });
}

interface AffiliateCTAProps {
  categorySlug?: string;
  stateName?: string;
}

/**
 * AffiliateCTA — renders partner links ONLY when the owner has set the
 * corresponding NEXT_PUBLIC_AFFILIATE_<SLUG>_URL environment variable to a
 * valid HTTPS tracking URL.
 *
 * When no partner has a configured tracking URL, this component renders nothing
 * (returns null). There is no fallback to a hardcoded affiliate URL or a UTM-
 * tagged public site URL.
 *
 * Gate summary:
 *   1. getPartnersForCategory() filters by category relevance.
 *   2. getAffiliateTrackingUrl() reads the env var and isSafeUrl-guards it.
 *   3. Only partners whose env var is set AND passes isSafeUrl render a link.
 *   4. Partners without a configured URL are silently omitted.
 *   5. If no partners have a configured URL, the entire block renders null.
 */
export function AffiliateCTA({ categorySlug, stateName }: AffiliateCTAProps) {
  const candidates = getPartnersForCategory(categorySlug);

  // Resolve the tracking URL for each candidate — only keep those with a
  // valid, owner-supplied env var.
  const activePartners: Array<{ partner: AffiliatePartner; trackingUrl: string }> =
    candidates.flatMap((partner) => {
      const trackingUrl = getAffiliateTrackingUrl(partner, isSafeUrl);
      return trackingUrl ? [{ partner, trackingUrl }] : [];
    });

  // Nothing to show — owner has not configured any affiliate programs yet.
  if (activePartners.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-slate-900">
        Legal Service Providers{stateName ? ` in ${stateName}` : ""}
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        Legal service providers that offer services relevant to this category.
        Listing here is advertising, not a referral or recommendation.
      </p>

      {/* FTC advertiser disclosure — placed immediately above the CTA links, since
          this block is only reached once at least one partner link will render. */}
      <AffiliateDisclosure className="mt-3" />

      <div className="mt-4 space-y-3">
        {activePartners.map(({ partner, trackingUrl }) => (
          <a
            key={partner.slug}
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={() => handleOutboundClick(trackingUrl)}
            className={`flex flex-col gap-3 rounded-lg border border-slate-200 p-4 ${CARD_HOVER} ${FOCUS_RING} sm:flex-row sm:items-center sm:justify-between`}
          >
            <div>
              <span className="font-medium text-slate-900">{partner.name}</span>
              <p className="mt-0.5 text-sm text-slate-500">{partner.description}</p>
            </div>
            <div className="flex flex-shrink-0 items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700">
              {partner.ctaText}
              <ExternalLink className="h-5 w-5" aria-hidden="true" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
