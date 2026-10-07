"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FOCUS_RING } from "@/lib/utils/styles";
import { persistConsent, subscribeConsentReopen } from "./consent-config";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => subscribeConsentReopen(() => setVisible(true)), []);

  function choose(value: "accepted" | "declined") {
    persistConsent(value);
    setVisible(false);
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
          AdSense). You can opt out at any time via “Manage Consent” in the footer.{" "}
          See our{" "}
          <Link href="/privacy" className="text-teal-700 underline">
            Privacy Policy
          </Link>{" "}
          for details.
        </p>
        <div className="flex flex-shrink-0 gap-3">
          <button
            onClick={() => choose("declined")}
            className={`min-h-11 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 ${FOCUS_RING}`}
          >
            Decline
          </button>
          <button
            onClick={() => choose("accepted")}
            className={`min-h-11 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 ${FOCUS_RING}`}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
