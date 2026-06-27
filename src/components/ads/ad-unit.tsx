"use client";

import { useEffect } from "react";

interface AdUnitProps {
  /** data-ad-slot value from your AdSense dashboard (per ad unit). */
  slot: string;
  /** AdSense format: "auto" (responsive), "fluid", "rectangle", etc. */
  format?: string;
  responsive?: boolean;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

/**
 * A single AdSense display unit. Renders nothing unless NEXT_PUBLIC_ADSENSE_CLIENT
 * is set, so the app is safe to ship before AdSense approval.
 *
 * Note: for a zero-config start you can skip manual units entirely and enable
 * **Auto ads** in the AdSense dashboard — the script in layout.tsx is enough.
 * Use this component only when you want to control exact ad placements/slots.
 *
 * AdSense policy: ads must be clearly distinguishable from content and must NOT
 * sit immediately adjacent to the cost figures or the legal disclaimer in a way
 * that invites accidental clicks. Keep the "Advertisement" label.
 */
export function AdUnit({ slot, format = "auto", responsive = true, className }: AdUnitProps) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  useEffect(() => {
    if (!client) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // adsbygoogle not ready yet; the script retries on its own.
    }
  }, [client]);

  if (!client) return null;

  return (
    <div className={className} aria-hidden="true">
      <p className="mb-1 text-center text-[10px] font-medium uppercase tracking-wide text-slate-400">
        Advertisement
      </p>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
