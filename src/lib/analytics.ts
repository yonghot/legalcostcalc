/**
 * Shared analytics module — GA4 event tracking with a typo-proof event
 * catalog, site identification, and internal-traffic marking.
 *
 * All events flow through the EXISTING consent-gated gtag pipeline set up by
 * ConsentedAnalytics (src/components/consent/consented-analytics.tsx) — this
 * module never injects scripts, never touches Consent Mode, and never bypasses
 * the hostname/environment gate in T01. It only calls `window.gtag(...)` when
 * that global already exists.
 *
 * SENSITIVE SITE (legalcostcalc): never send raw calculator inputs, legal
 * matter details, or a `result_bucket` in event params (see IS_SENSITIVE_SITE
 * below and the T03 calculator funnel implementation).
 */

/** Per-repo site identifier, stamped on every event as the `site` param. */
export const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || "legalcostcalc";

/**
 * Sensitive sites never transmit input values, result buckets, or other
 * state-derived details in event params, URLs, or localStorage.
 */
export const IS_SENSITIVE_SITE = true;

/**
 * String-literal union of every event name this site fires. Using a union
 * (rather than `string`) means a misnamed event fails `tsc` at compile time
 * instead of silently never registering in GA4 — the documented silent-
 * failure mode this module exists to prevent.
 */
export type EventName =
  | "calc_input_start"
  | "calculator_complete"
  | "related_click"
  | "outbound_click"
  | "result_share"
  | "embed_loaded"
  | "state_restored"
  | "web_vitals"
  | "email_signup";

const MAX_PARAMS = 25;
const TRAFFIC_MARKER_KEY = "cc_traffic_type";

type EventParams = Record<string, string | number | boolean>;

function hasGtag(): boolean {
  return typeof window !== "undefined" && typeof window.gtag === "function";
}

function isInternalTraffic(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(TRAFFIC_MARKER_KEY) === "internal";
  } catch {
    // localStorage unavailable (private mode, quota, disabled) — never throw
    // from a tracking call.
    return false;
  }
}

/**
 * Fire a GA4 event through the existing gtag pipeline.
 *
 * No-op when:
 *  - running on the server (typeof window === 'undefined'), or
 *  - `window.gtag` is not yet a function (GA hasn't loaded — e.g. pre-consent,
 *    or T01's hostname gate skipped injection on this deploy).
 *
 * Events fired pre-gtag are simply dropped (not queued) — the pipeline this
 * module wraps already handles the dataLayer/consent-gating ordering
 * upstream; this function does not attempt to duplicate that queueing logic.
 */
export function trackEvent(name: EventName, params?: EventParams): void {
  if (typeof window === "undefined") return;
  if (!hasGtag()) return;

  const merged: EventParams = {
    site: SITE_ID,
    ...(params ?? {}),
  };

  if (isInternalTraffic()) {
    merged.traffic_type = "internal";
  }

  if (process.env.NEXT_PUBLIC_GA_DEBUG === "1") {
    merged.debug_mode = true;
  }

  // Enforce the <=25 param budget (GA4 event param limit) — trim extras
  // rather than silently dropping the whole event.
  const entries = Object.entries(merged).slice(0, MAX_PARAMS);
  const safeParams = Object.fromEntries(entries);

  window.gtag!("event", name, safeParams);
}

/**
 * Reads `?crew=1` / `?crew=0` from the current URL once (call on mount from a
 * root-level client component) and persists the internal-traffic marker to
 * localStorage so all subsequent trackEvent() calls (this visit and future
 * ones on this device) carry `traffic_type: 'internal'`.
 *
 * ?crew=1 sets the marker; ?crew=0 clears it. Also immediately calls
 * `window.gtag('set', { traffic_type: 'internal' })` when the flag is set, so
 * the marker takes effect on GA's own session state right away (not just on
 * trackEvent() calls made by this module).
 */
export function initTrafficMarker(): void {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const crew = params.get("crew");

  try {
    if (crew === "1") {
      window.localStorage.setItem(TRAFFIC_MARKER_KEY, "internal");
    } else if (crew === "0") {
      window.localStorage.removeItem(TRAFFIC_MARKER_KEY);
    }
  } catch {
    // localStorage unavailable — the marker simply won't persist; non-fatal.
  }

  if (isInternalTraffic() && hasGtag()) {
    window.gtag!("set", { traffic_type: "internal" });
  }
}
