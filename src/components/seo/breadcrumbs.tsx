"use client";

import Link from "next/link";
import { FOCUS_RING } from "@/lib/utils/styles";
import { trackEvent } from "@/lib/analytics";

export interface BreadcrumbTrailItem {
  name: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbTrailItem[];
  className?: string;
}

function handleBreadcrumbClick(linkUrl: string) {
  trackEvent("related_click", { link_module: "breadcrumb", link_url: linkUrl });
}

/**
 * Shared visible breadcrumb trail (T07). Server-rendered plain <Link>s in the
 * HTML (crawlable without JS) — the "use client" directive only wires the
 * click-tracking handler, it does not gate initial markup. Pair with
 * <BreadcrumbSchema> for the BreadcrumbList JSON-LD on the same page.
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={`text-sm text-slate-500 ${className ?? ""}`}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={item.href}>
            {isLast ? (
              <span aria-current="page">{item.name}</span>
            ) : (
              <Link
                href={item.href}
                onClick={() => handleBreadcrumbClick(item.href)}
                className={`hover:text-teal-600 ${FOCUS_RING} rounded-sm`}
              >
                {item.name}
              </Link>
            )}
            {!isLast && <span className="mx-2" aria-hidden="true">/</span>}
          </span>
        );
      })}
    </nav>
  );
}
