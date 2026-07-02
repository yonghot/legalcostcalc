"use client";

import Link from "next/link";
import { CARD_HOVER, FOCUS_RING } from "@/lib/utils/styles";
import { trackEvent } from "@/lib/analytics";
import { formatCurrency } from "@/lib/utils/format";

export interface HubLinkRow {
  key: string;
  label: string;
  href: string;
  /** Real per-row moderate-complexity median cost (the hub table's unique content). */
  medianCost: number | null;
}

interface HubLinksProps {
  rows: HubLinkRow[];
  /** Column header for the `label` field, e.g. "Legal Matter" or "State". */
  labelHeader: string;
}

function handleHubClick(linkUrl: string) {
  trackEvent("related_click", { link_module: "hub", link_url: linkUrl });
}

/**
 * T07 hub data table — the REAL per-row price comparison that makes a hub
 * page's unique content (not filler). Server-rendered plain <Link>s so the
 * table is crawlable without JS; "use client" only wires the click tracker.
 */
export function HubLinks({ rows, labelHeader }: HubLinksProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <caption className="sr-only">Cost comparison table</caption>
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              {labelHeader}
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Median Cost
            </th>
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">View</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.key} className={`transition-colors hover:bg-slate-50`}>
              <td className="px-4 py-3 font-medium text-slate-900">{row.label}</td>
              <td className="px-4 py-3 font-mono text-slate-700">
                {row.medianCost != null ? formatCurrency(row.medianCost) : "—"}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={row.href}
                  onClick={() => handleHubClick(row.href)}
                  className={`inline-flex items-center gap-1 rounded-md bg-teal-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-700 ${CARD_HOVER} ${FOCUS_RING}`}
                >
                  View details
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
