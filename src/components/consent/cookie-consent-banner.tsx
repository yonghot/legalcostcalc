"use client";

/**
 * Cookie Consent Banner
 *
 * Stores the visitor's choice in localStorage under the key "cookie_consent"
 * with values "accepted" | "declined".
 *
 * Geo-differentiated model (owner-approved) — see consent-config.ts:
 *  - EEA / UK / Swiss visitors: consent stays DENIED until they click Accept.
 *    The banner is the opt-in. On Accept, Consent Mode is updated to granted.
 *  - Everyone else (US default, incl. unknown country): consent is granted
 *    immediately on load by ConsentedAnalytics; the banner is shown only as a
 *    notice (Accept simply dismisses it) and never blocks ads/analytics.
 *
 * Ad/analytics SCRIPTS load unconditionally (env-guarded) via ConsentedAnalytics;
 * whether personalized ads serve is governed by Consent Mode v2, not by whether
 * the banner was accepted.
 *
 * EEA / UK AdSense consent:
 *   Google additionally requires a certified Consent Management Platform (CMP)
 *   for TCF v2.2. Enable Google's own CMP in the AdSense dashboard →
 *   Privacy & messaging using your publisher ID. That overlay coexists with
 *   this banner for EEA/UK visitors.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { FOCUS_RING } from "@/lib/utils/styles";
import {
  getStoredConsent,
  persistConsent,
  requiresOptIn,
  grantConsent,
  type ConsentValue,
} from "./consent-config";

// Re-export for backward compatibility with existing importers.
export { getStoredConsent };
export type { ConsentValue };

export function CookieConsentBanner() {
  // Single state object so we never call multiple setState calls synchronously
  // in the mount effect. `optIn` toggles the EEA/UK notice copy.
  const [state, setState] = useState<{ visible: boolean; optIn: boolean }>({
    visible: false,
    optIn: false,
  });
  const { visible, optIn } = state;

  useEffect(() => {
    // Show the banner only if the user hasn't made a choice yet. Computing
    // optIn here (post-mount) avoids an SSR/CSR hydration mismatch since the
    // visitor_country cookie is only readable on the client.
    if (getStoredConsent() === null) {
      // Intentional: visibility depends on localStorage + the visitor_country
      // cookie, which are only readable on the client, so it must be decided
      // post-mount. Runs once ([] deps); no cascading-render concern.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ visible: true, optIn: requiresOptIn() });
    }

    // The "Manage Consent / Do Not Sell" footer control re-opens the banner.
    function handleReopen() {
      setState({ visible: true, optIn: requiresOptIn() });
    }
    window.addEventListener("consentReopen", handleReopen);
    return () => window.removeEventListener("consentReopen", handleReopen);
  }, []);

  function handleAccept() {
    persistConsent("accepted");
    // For opt-in (EEA/UK/CH) visitors this is the moment consent is granted.
    // For opt-out visitors consent was already granted on load; this is a no-op
    // beyond re-affirming it.
    grantConsent();
    setState((s) => ({ ...s, visible: false }));
  }

  function handleDecline() {
    persistConsent("declined");
    setState((s) => ({ ...s, visible: false }));
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white px-4 py-4 shadow-md sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-700">
          We use cookies to measure site traffic and to display ads (Google
          AdSense). {optIn
            ? "We only enable personalized ads and analytics after you accept."
            : "You can opt out at any time via “Manage Consent” in the footer."}{" "}
          See our{" "}
          <Link href="/privacy" className="text-teal-700 underline">
            Privacy Policy
          </Link>{" "}
          for details.
        </p>
        <div className="flex flex-shrink-0 gap-3">
          <button
            onClick={handleDecline}
            className={`rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 ${FOCUS_RING}`}
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className={`rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 ${FOCUS_RING}`}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
