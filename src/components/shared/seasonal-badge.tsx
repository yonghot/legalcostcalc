import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { FOCUS_RING } from "@/lib/utils/styles";

/**
 * U-04 — season/revisit hook (부속U §4/§5). A subtle, token-styled pill on
 * the homepage pointing at the observed annual peak in divorce-related
 * search interest, framed neutrally (no advice verb, no fabricated number).
 *
 * SOURCE (real, web-search-verified 2026-07-18 — not a fabricated stat):
 * Google Trends data cited by family-law publications shows "divorce" /
 * "divorce attorney" search interest peaks in the first weeks of January
 * each year (post-holiday timing) — reported independently by:
 *   - Susan Gray Law, "Google searches for 'divorce' peak in January"
 *     (citing Google Trends): https://susangraylaw.com/blog/2019/12/google-searches-for-divorce-peak-in-january/
 *   - Forbes, "Is January Really 'Divorce Month'?" (Dec 23, 2025):
 *     https://www.forbes.com/sites/patriciafersch/2025/12/23/is-january-really-divorce-month/
 * This component reproduces only the general seasonality pattern both
 * sources report — no specific percentage/count from either source is
 * quoted here, and this is a general information note, not legal advice.
 *
 * Links to the real, already-indexed /divorce-cost-by-state hub (the
 * "guide/section" this hook points toward — see 부속U §4 U-04). Styled as a
 * plain teal-token pill (mirrors UpdatedBadge), never a modal, interstitial,
 * or ad-shaped unit.
 */
export function SeasonalBadge() {
  return (
    <Link
      href="/divorce-cost-by-state"
      className={`inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-100 ${FOCUS_RING}`}
    >
      <CalendarClock className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
      January is the busiest month for divorce-related searches — save your estimate now
    </Link>
  );
}
