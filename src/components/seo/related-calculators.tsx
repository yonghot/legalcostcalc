"use client";

import { ArrowUpRight } from "lucide-react";
import { SIBLING_SITES } from "@/lib/constants/sibling-sites";
import { CARD_HOVER, FOCUS_RING } from "@/lib/utils/styles";
import { trackEvent } from "@/lib/analytics";

function handleOutboundClick(url: string) {
  const linkDomain = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  })();
  trackEvent("outbound_click", { link_domain: linkDomain, link_type: "crosslink" });
}

/**
 * "More free cost calculators" cross-link module linking the sibling network
 * sites (self excluded). Tasteful, contextual anchors — not a sitewide
 * identical block. External links are nofollow per affiliate/network hygiene.
 */
export function RelatedCalculators() {
  return (
    <section
      className="border-t border-slate-100 bg-white py-12"
      aria-labelledby="related-calculators-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2
          id="related-calculators-heading"
          className="text-lg font-semibold text-slate-900"
        >
          More Free Cost Calculators
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Researching costs in another area? These free tools from our network may help.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SIBLING_SITES.map((site) => (
            <a
              key={site.url}
              href={site.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              onClick={() => handleOutboundClick(site.url)}
              className={`flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 ${CARD_HOVER} ${FOCUS_RING}`}
            >
              <span>
                <span className="font-medium text-slate-900">{site.name}</span>
                <span className="mt-0.5 block text-sm text-slate-500">
                  {site.description}
                </span>
              </span>
              <ArrowUpRight
                className="h-5 w-5 flex-shrink-0 text-slate-300"
                aria-hidden="true"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
