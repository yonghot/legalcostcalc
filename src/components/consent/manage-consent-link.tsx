"use client";

import { openManageConsent } from "./consent-config";

export function ManageConsentLink({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => openManageConsent()}
      className={className}
    >
      Do Not Sell or Share My Personal Information / Manage Consent
    </button>
  );
}
