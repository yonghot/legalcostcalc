"use client";

import Link from "next/link";
import { FOCUS_RING } from "@/lib/utils/styles";
import { trackEvent } from "@/lib/analytics";

/**
 * K07 — the divorce-cost-by-state hub's single FAQ link back to the home
 * calculator. Split into its own client component (matching the existing
 * pattern used elsewhere in this repo, e.g. HubLinks/Breadcrumbs) because
 * the page itself is a server component and "use client" cannot be scoped
 * to a single inline function.
 */
export function DivorceHubFaqLink() {
  return (
    <Link
      href="/"
      className={`underline hover:text-teal-700 ${FOCUS_RING} rounded-sm`}
      onClick={() =>
        trackEvent("related_click", { link_module: "divorce_hub_faq", link_url: "/" })
      }
    >
      divorce cost calculator
    </Link>
  );
}
