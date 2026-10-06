// EEA/UK/CH consent UI is Google's CMP; our code must never send update(granted) there or it conflicts with the TCF decision.

export const CONSENT_KEY = "cookie_consent";
export const COUNTRY_COOKIE = "visitor_country";

export type ConsentValue = "accepted" | "declined" | null;

export const OPT_IN_COUNTRIES = new Set<string>([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE", "IS", "LI", "NO", "GB", "CH",
]);

export function getVisitorCountry(): string {
  if (typeof document === "undefined") return "XX";
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COUNTRY_COOKIE}=`));
  return match ? decodeURIComponent(match.split("=")[1]).toUpperCase() : "XX";
}

export function requiresOptIn(country: string = getVisitorCountry()): boolean {
  return OPT_IN_COUNTRIES.has(country);
}

export function getStoredConsent(): ConsentValue {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    if (v === "accepted" || v === "declined") return v;
  } catch {
    return null;
  }
  return null;
}

export function persistConsent(value: "accepted" | "declined") {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // the choice still applies to this page view through the event below
  }
  window.dispatchEvent(new CustomEvent("consentChange", { detail: value }));
}

export type InitialConsentPlan = "none" | "update-denied";

export function planInitialConsent(country: string, stored: ConsentValue): InitialConsentPlan {
  if (requiresOptIn(country)) return "none";
  return stored === "declined" ? "update-denied" : "none";
}

export function bannerMode(country: string): "cmp" | "own" {
  return requiresOptIn(country) ? "cmp" : "own";
}

export function manageConsentAction(country: string): "cmp" | "banner" {
  return requiresOptIn(country) ? "cmp" : "banner";
}

type GtagArgs = ["consent", "update", Record<string, unknown>];

// Window.dataLayer / Window.gtag are declared globally in src/types/window.d.ts.

function pushConsent(...args: GtagArgs) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag(...args);
    return;
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

const GRANTED = {
  ad_storage: "granted",
  ad_user_data: "granted",
  ad_personalization: "granted",
  analytics_storage: "granted",
} as const;

const DENIED = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
} as const;

export function grantConsent() {
  pushConsent("consent", "update", { ...GRANTED });
}

export function denyConsent() {
  pushConsent("consent", "update", { ...DENIED });
}

function applyConsentChange(country: string, value: "accepted" | "declined") {
  if (value === "declined") {
    denyConsent();
    return;
  }
  if (bannerMode(country) === "own") grantConsent();
}

export function initConsent(): () => void {
  if (planInitialConsent(getVisitorCountry(), getStoredConsent()) === "update-denied") denyConsent();
  const onChange = (event: Event) => {
    const value = (event as CustomEvent<"accepted" | "declined">).detail;
    if (value === "accepted" || value === "declined") applyConsentChange(getVisitorCountry(), value);
  };
  window.addEventListener("consentChange", onChange);
  return () => window.removeEventListener("consentChange", onChange);
}

export function subscribeConsentReopen(onOpen: () => void): () => void {
  const handler = () => {
    if (bannerMode(getVisitorCountry()) === "own") onOpen();
  };
  window.addEventListener("consentReopen", handler);
  return () => window.removeEventListener("consentReopen", handler);
}

interface GoogleFc {
  callbackQueue?: Array<() => void>;
  showRevocationMessage?: () => void;
}

export function openManageConsent() {
  if (typeof window === "undefined") return;
  if (manageConsentAction(getVisitorCountry()) === "cmp") {
    const w = window as Window & { googlefc?: GoogleFc };
    w.googlefc = w.googlefc || {};
    const fc = w.googlefc;
    fc.callbackQueue = fc.callbackQueue || [];
    fc.callbackQueue.push(() => w.googlefc?.showRevocationMessage?.());
    return;
  }
  window.dispatchEvent(new CustomEvent("consentReopen"));
}
