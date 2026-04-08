"use client";

import { ExternalLink } from "lucide-react";
import { getPartnersForCategory, type AffiliatePartner } from "@/lib/constants/affiliates";

interface AffiliateCTAProps {
  categorySlug?: string;
  stateName?: string;
}

export function AffiliateCTA({ categorySlug, stateName }: AffiliateCTAProps) {
  const partners = getPartnersForCategory(categorySlug);

  if (partners.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-slate-900">
        Need Legal Help{stateName ? ` in ${stateName}` : ""}?
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        Connect with trusted legal service providers. These are affiliate links — we may earn a commission at no extra cost to you.
      </p>

      <div className="mt-4 space-y-3">
        {partners.map((partner: AffiliatePartner) => (
          <a
            key={partner.slug}
            href={buildAffiliateUrl(partner, categorySlug)}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 transition-all hover:border-teal-200 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 sm:flex-row sm:items-center sm:justify-between"
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

      <p className="mt-3 text-xs text-slate-400">
        Affiliate disclosure: LegalCostCalc may receive compensation from the companies listed above.
        This does not influence our cost data or estimates.
      </p>
    </div>
  );
}

function buildAffiliateUrl(partner: AffiliatePartner, categorySlug?: string): string {
  const url = new URL(partner.url);
  url.searchParams.set("utm_source", "legalcostcalc");
  url.searchParams.set("utm_medium", "referral");
  if (categorySlug) {
    url.searchParams.set("utm_campaign", categorySlug);
  }
  return url.toString();
}
