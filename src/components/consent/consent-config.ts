/**
 * Shared consent configuration & helpers.
 *
 * Centralises the geo-differentiated consent model so the banner and the
 * analytics loader agree on a single source of truth (no duplicated logic).
 *
 * Model (owner-approved):
 *  - EEA / UK / Swiss visitors  → consent stays DENIED until explicit Accept.
 *    The cookie banner is shown as the opt-in. (Google's certified CMP, enabled
 *    later in the AdSense dashboard, also covers these regions.)
 *  - Everyone else (US default, incl. unknown country) → consent is GRANTED
 *    immediately on load (US notice + opt-out / CCPA posture). The banner may
 *    still display as a notice but does NOT block ads/analytics.
 */

export const CONSENT_KEY = "cookie_consent";
export const COUNTRY_COOKIE = "visitor_country";

export type ConsentValue = "accepted" | "declined" | null;

/**
 * Countries requiring explicit opt-in (GDPR / UK GDPR / Swiss FADP).
 * EEA member states + Iceland, Liechtenstein, Norway + GB + CH.
 */
export const OPT_IN_COUNTRIES = new Set<string>([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE", "IS", "LI", "NO", "GB", "CH",
]);

/** Read the visitor country set by middleware.ts (defaults to "XX" unknown). */
export function getVisitorCountry(): string {
  if (typeof document === "undefined") return "XX";
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COUNTRY_COOKIE}=`));
  return match ? decodeURIComponent(match.split("=")[1]).toUpperCase() : "XX";
}

/** True when the visitor is in a region that requires explicit opt-in. */
export function requiresOptIn(country: string = getVisitorCountry()): boolean {
  return OPT_IN_COUNTRIES.has(country);
}

/** Read the stored consent value without triggering a React re-render. */
export function getStoredConsent(): ConsentValue {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(CONSENT_KEY);
  if (v === "accepted" || v === "declined") return v;
  return null;
}

/** Persist the visitor's choice and broadcast a custom event so other
 *  components (ConsentedAnalytics) can react without a full page reload. */
export function persistConsent(value: "accepted" | "declined") {
  localStorage.setItem(CONSENT_KEY, value);
  window.dispatchEvent(new CustomEvent("consentChange", { detail: value }));
}

/**
 * Clear the stored consent choice and re-open the banner.
 * Used by the "Do Not Sell or Share / Manage Consent" footer control.
 */
export function reopenConsent() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CONSENT_KEY);
  window.dispatchEvent(new CustomEvent("consentReopen"));
}

/* ---- Consent Mode v2 gtag helpers (shared) ---------------------------- */

type GtagArgs =
  | ["consent", "default" | "update", Record<string, unknown>]
  | ["js", Date]
  | ["config", string, Record<string, unknown>?];

// Window.dataLayer / Window.gtag / Window.__gtagInitialised are declared
// globally in src/types/window.d.ts.

/** Push a Consent Mode v2 command, falling back to dataLayer if gtag()
 *  hasn't been defined yet (e.g. the inline defaults script in <head>). */
function pushConsent(...args: GtagArgs) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag(...args);
    return;
  }
  window.dataLayer = window.dataLayer || [];
  // gtag.js parses IArguments-shaped entries; an array is accepted by the queue.
  window.dataLayer.push(args);
}

const GRANTED = {
  ad_storage: "granted",
  ad_user_data: "granted",
  ad_personalization: "granted",
  analytics_storage: "granted",
} as const;

/** Grant all consent categories (US/opt-out default, or EEA after Accept). */
export function grantConsent() {
  pushConsent("consent", "update", { ...GRANTED });
}
