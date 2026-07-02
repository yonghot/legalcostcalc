"use client";

import Link from "next/link";
import { CARD_HOVER, FOCUS_RING } from "@/lib/utils/styles";
import { trackEvent } from "@/lib/analytics";
import { formatCurrency } from "@/lib/utils/format";

export interface DivorceHubRow {
  key: string;
  stateName: string;
  href: string;
  /** Real "simple" (uncontested) complexity-tier median cost, or null if unavailable. */
  uncontested: number | null;
  /** Real "complex" (contested) complexity-tier median cost, or null if unavailable. */
  contested: number | null;
}

interface DivorceHubTableProps {
  rows: DivorceHubRow[];
}

function handleRowClick(linkUrl: string) {
  trackEvent("related_click", { link_module: "divorce_hub", link_url: linkUrl });
}

/**
 * K07 — the all-51-state divorce cost comparison table (uncontested vs.
 * contested), server-rendered plain <Link>s so the table is crawlable
 * without JS; "use client" only wires the click tracker, matching the
 * existing HubLinks (T07) pattern used by the state/category hub pages.
 */
export function DivorceHubTable({ rows }: DivorceHubTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <caption className="sr-only">
          Estimated divorce cost by state — uncontested vs. contested
        </caption>
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              State
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Uncontested (typical)
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Contested (typical)
            </th>
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">View details</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.key} className="transition-colors hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">{row.stateName}</td>
              <td className="px-4 py-3 font-mono text-slate-700">
                {row.uncontested != null ? formatCurrency(row.uncontested) : "—"}
              </td>
              <td className="px-4 py-3 font-mono text-slate-700">
                {row.contested != null ? formatCurrency(row.contested) : "—"}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={row.href}
                  onClick={() => handleRowClick(row.href)}
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
