"use client";

/**
 * "Do Not Sell or Share My Personal Information / Manage Consent" control.
 *
 * Clears the stored consent choice and re-opens the cookie banner so the
 * visitor can change their decision (CCPA "Do Not Sell or Share" + general
 * consent management). Rendered in the footer.
 */

import { reopenConsent } from "./consent-config";

export function ManageConsentLink({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => reopenConsent()}
      className={className}
    >
      Do Not Sell or Share My Personal Information / Manage Consent
    </button>
  );
}
