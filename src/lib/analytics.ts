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
  | "email_signup"
  | "ai_referral";

const MAX_PARAMS = 25;
const TRAFFIC_MARKER_KEY = "cc_traffic_type";

/**
 * CODE-07 — AI-referral & rich-context detection.
 *
 * Hostname -> canonical `source` label for known AI-answer engines. Matched
 * against `document.referrer`'s hostname (exact host or any subdomain, e.g.
 * `www.perplexity.ai` and `chat.openai.com` both match) on first load only.
 * Pure measurement: this table drives ONLY which GA4 `ai_referral{source}`
 * event fires — no UI, no ranking logic, no user-facing copy.
 */
const AI_ENGINE_HOSTS: Record<string, string> = {
  "chatgpt.com": "chatgpt",
  "chat.openai.com": "chatgpt",
  "openai.com": "chatgpt",
  "perplexity.ai": "perplexity",
  "gemini.google.com": "gemini",
  "bard.google.com": "gemini",
  "copilot.microsoft.com": "copilot",
  "bing.com": "copilot",
};

/** Known directory/aggregator and community/social referrer hostnames (CODE-07). */
const DIRECTORY_COMMUNITY_HOSTS: Record<string, string> = {
  "reddit.com": "reddit",
  "old.reddit.com": "reddit",
  "producthunt.com": "producthunt",
  "quora.com": "quora",
  "pinterest.com": "pinterest",
  "news.ycombinator.com": "hackernews",
  "betalist.com": "betalist",
};

/**
 * Matches `hostname` against a lookup table by exact match or as a subdomain
 * of a registered key (e.g. hostname `chat.openai.com` matches key
 * `openai.com`). Returns the mapped label, or `undefined` if no entry matches.
 */
function matchHost(
  hostname: string,
  table: Record<string, string>,
): string | undefined {
  const normalized = hostname.toLowerCase();
  if (normalized in table) return table[normalized];
  for (const key of Object.keys(table)) {
    if (normalized.endsWith(`.${key}`)) return table[key];
  }
  return undefined;
}

/**
 * Detects Google AI Overview / AI-mode referral patterns that don't come
 * through a distinct engine hostname — Google surfaces AI Overview clicks as
 * a `google.*` referrer (or no referrer at all, for some SGE/AI Mode
 * surfaces) carrying recognizable query-string markers. Conservative on
 * purpose: only classifies as `ai-overview` when an explicit AI-mode marker
 * is present, never guesses from a bare Google referrer (that stays regular
 * organic search, unclassified here).
 */
function isAiOverviewPattern(referrerUrl: URL): boolean {
  const host = referrerUrl.hostname.toLowerCase();
  if (!(host === "google.com" || host.endsWith(".google.com"))) return false;

  const params = referrerUrl.searchParams;
  // udm=50 is Google's documented "AI Mode" search-mode parameter; some AI
  // Overview surfaces also propagate a utm_source=aiovw style marker.
  if (params.get("udm") === "50") return true;
  const utmSource = (params.get("utm_source") || "").toLowerCase();
  if (utmSource.includes("aiovw") || utmSource.includes("ai-overview")) return true;
  return false;
}

export type ReferralSourceKind = "ai" | "embed" | "directory" | null;

export interface ReferralClassification {
  kind: ReferralSourceKind;
  source: string | null;
}

/**
 * Pure classifier: given a referrer URL string (typically `document.referrer`)
 * and the current page's own URL (for reading the embed-referral `host`
 * query param CODE-03 attaches to outbound embed-attribution links), returns
 * which referral bucket — if any — this session's first load falls into.
 *
 * No side effects, no window access beyond the two strings passed in — kept
 * this way so it is independently unit-testable and reusable both from the
 * browser classifier below and from tests.
 */
export function classifyReferralSource(
  referrer: string,
  currentUrl?: string,
): ReferralClassification {
  // Embed-referral takes priority: CODE-03's attribution link/copy-embed flow
  // appends ?host=<partner-domain> when a visitor clicks through FROM an
  // embedded widget back to the canonical page. This is a same-site query
  // param, not a cross-origin referrer, so it's checked against currentUrl.
  if (currentUrl) {
    try {
      const host = new URL(currentUrl, "http://placeholder.invalid").searchParams.get(
        "host",
      );
      if (host) return { kind: "embed", source: host.toLowerCase() };
    } catch {
      // Malformed currentUrl — fall through to referrer-based classification.
    }
  }

  if (!referrer) return { kind: null, source: null };

  let referrerUrl: URL;
  try {
    referrerUrl = new URL(referrer);
  } catch {
    return { kind: null, source: null };
  }

  const aiMatch = matchHost(referrerUrl.hostname, AI_ENGINE_HOSTS);
  if (aiMatch) return { kind: "ai", source: aiMatch };

  if (isAiOverviewPattern(referrerUrl)) {
    return { kind: "ai", source: "ai-overview" };
  }

  const directoryMatch = matchHost(referrerUrl.hostname, DIRECTORY_COMMUNITY_HOSTS);
  if (directoryMatch) return { kind: "directory", source: directoryMatch };

  return { kind: null, source: null };
}

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

const REFERRAL_TAGGED_KEY = "cc_referral_tagged";

/**
 * CODE-07 — first-load AI-referral / embed-referral / directory-community
 * referral classifier.
 *
 * Reads `document.referrer` (and, for the embed-referral case, the current
 * page's own `?host=` query param — see CODE-03's attribution link) ONCE per
 * browser session and fires a single tagged GA4 event through the existing
 * consent-gated `trackEvent()` pipeline:
 *   - AI engine referrer (chatgpt/perplexity/gemini/copilot/ai-overview)
 *     -> `ai_referral` with `source`
 *   - embed-referral (`?host=partner-domain`) -> `embed_loaded` with
 *     `host_domain` (reuses the existing embed_loaded event name so embed
 *     referral sessions are measurable in the same funnel as CODE-03's
 *     in-iframe tracker, tagged `referral_kind: 'embed_referral'` to
 *     distinguish a click-through from the iframe mount event itself)
 *   - known directory/community referrer (reddit/producthunt/quora/pinterest/
 *     hackernews/betalist) -> `outbound_click` with `link_url`/`source`
 *     re-purposed as a lightweight referral tag (`referral_kind: 'directory'`)
 *
 * Pure measurement, no UI. Idempotent within a session via a sessionStorage
 * guard so a client-side route change never re-fires the same classification
 * (document.referrer only reflects the ORIGINAL cross-site navigation).
 */
export function trackReferralSource(): void {
  if (typeof window === "undefined") return;

  try {
    if (window.sessionStorage.getItem(REFERRAL_TAGGED_KEY) === "1") return;
  } catch {
    // sessionStorage unavailable — proceed without the once-per-session
    // guard rather than skip classification entirely.
  }

  const classification = classifyReferralSource(
    document.referrer,
    window.location.href,
  );

  if (classification.kind === "ai" && classification.source) {
    trackEvent("ai_referral", { source: classification.source });
  } else if (classification.kind === "embed" && classification.source) {
    trackEvent("embed_loaded", {
      host_domain: classification.source,
      referral_kind: "embed_referral",
    });
  } else if (classification.kind === "directory" && classification.source) {
    trackEvent("outbound_click", {
      referral_kind: "directory",
      source: classification.source,
    });
  } else {
    return; // Nothing to tag — don't burn the once-per-session guard.
  }

  try {
    window.sessionStorage.setItem(REFERRAL_TAGGED_KEY, "1");
  } catch {
    // Non-fatal — worst case the classifier re-evaluates (and no-ops, since
    // referrer/URL are unchanged) on the next mount within this session.
  }
}
