"use client";

import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { CARD_HOVER, FOCUS_RING } from "@/lib/utils/styles";
import { trackEvent } from "@/lib/analytics";

interface HubLinksBarProps {
  stateSlug: string;
  stateName: string;
  categorySlug: string;
  categoryName: string;
}

function handleHubClick(linkUrl: string) {
  trackEvent("related_click", { link_module: "hub", link_url: linkUrl });
}

/**
 * T07 — spoke-page hub links (link type #2 of the required 3 automated link
 * types per spoke: breadcrumb parent, hub link, sibling cross-links).
 * Server-rendered plain <Link>s; "use client" only wires click tracking.
 */
export function HubLinksBar({ stateSlug, stateName, categorySlug, categoryName }: HubLinksBarProps) {
  const stateHubHref = `/${stateSlug}`;
  const categoryHubHref = `/category/${categorySlug}`;

  return (
    <section className="border-t border-slate-100 bg-white py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-3">
          <Link
            href={stateHubHref}
            onClick={() => handleHubClick(stateHubHref)}
            className={`inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 ${CARD_HOVER} ${FOCUS_RING}`}
          >
            <LayoutGrid className="h-4 w-4 text-teal-600" aria-hidden="true" />
            All legal costs in {stateName}
          </Link>
          <Link
            href={categoryHubHref}
            onClick={() => handleHubClick(categoryHubHref)}
            className={`inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 ${CARD_HOVER} ${FOCUS_RING}`}
          >
            <LayoutGrid className="h-4 w-4 text-teal-600" aria-hidden="true" />
            {categoryName} cost by state
          </Link>
        </div>
      </div>
    </section>
  );
}
