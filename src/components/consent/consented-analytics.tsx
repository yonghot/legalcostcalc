"use client";

/**
 * ConsentedAnalytics
 *
 * Loads Plausible, Google AdSense and GA4 (gtag.js) scripts UNCONDITIONALLY
 * (env-guarded) on every page — they are NOT gated behind the cookie banner.
 * Whether personalized ads / analytics actually fire is governed by Google
 * Consent Mode v2 (defaults set inline in <head>, before any Google script).
 *
 * GA4 hostname/environment gate (resolveGaLoadDecision, below): GA only loads
 * when NEXT_PUBLIC_VERCEL_ENV === 'production' AND the hostname matches the
 * canonical NEXT_PUBLIC_APP_URL host (bare or www.), which keeps
 * preview/localhost/mirror traffic out of GA4 reports entirely. Set
 * NEXT_PUBLIC_GA_DEBUG=1 on a Vercel Preview deploy to opt that deploy back
 * in for DebugView verification — traffic is tagged debug_mode + traffic_type
 * 'internal' so it never lands in production reports. AdSense loading and the
 * consent flow below are untouched by this gate.
 *
 * Geo-differentiated consent (owner-approved) — see consent-config.ts:
 *  - EEA / UK / Swiss: leave consent DENIED on load; the banner is the opt-in.
 *    On Accept, the banner calls grantConsent(). If a returning EEA visitor had
 *    previously accepted, we re-grant here on load.
 *  - Everyone else (US default, incl. unknown country): grant consent
 *    immediately on load (US notice + opt-out / CCPA), unless the visitor has
 *    explicitly declined — then we respect that and leave consent denied.
 *
 * Scripts still require their respective NEXT_PUBLIC_* env vars to be present;
 * with no env set, this component injects nothing and the free site is unchanged.
 */

import { useEffect } from "react";
import {
  getStoredConsent,
  requiresOptIn,
  grantConsent,
} from "./consent-config";

function injectScript(src: string, attrs: Record<string, string> = {}) {
  if (document.querySelector(`script[src="${src}"]`)) return; // already injected
  const el = document.createElement("script");
  el.src = src;
  el.async = true;
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  document.head.appendChild(el);
}

/**
 * Determines whether GA4 should load on the current hostname, and whether it
 * should load in "debug" mode (preview deploys only).
 *
 * - production on the canonical host (or www. variant) -> load normally.
 * - anywhere else (localhost, *.vercel.app preview, mirrors) -> skip GA
 *   entirely UNLESS NEXT_PUBLIC_GA_DEBUG=1 (set only on Vercel Preview env),
 *   in which case GA loads WITH debug_mode + traffic_type:'internal' so the
 *   traffic lands in DebugView / the internal filter and never in reports.
 *
 * This gate wraps ONLY the GA script-injection step — it does not touch the
 * CMP/consent flow or Consent Mode v2 defaults, which already run upstream.
 */
function resolveGaLoadDecision(): { shouldLoad: boolean; debugMode: boolean } {
  if (typeof window === "undefined") return { shouldLoad: false, debugMode: false };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://legalcostcalc.co";
  let canonicalHost: string;
  try {
    canonicalHost = new URL(appUrl).hostname;
  } catch {
    canonicalHost = "legalcostcalc.co";
  }

  const currentHost = window.location.hostname;
  const isCanonicalHost =
    currentHost === canonicalHost || currentHost === `www.${canonicalHost}`;
  const isProductionEnv = process.env.NEXT_PUBLIC_VERCEL_ENV === "production";

  const allowed = isProductionEnv && isCanonicalHost;
  if (allowed) return { shouldLoad: true, debugMode: false };

  const debugEnabled = process.env.NEXT_PUBLIC_GA_DEBUG === "1";
  return { shouldLoad: debugEnabled, debugMode: debugEnabled };
}

/** Inject the third-party loaders (env-guarded, idempotent). */
function loadScripts() {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (plausibleDomain) {
    injectScript("https://plausible.io/js/script.js", {
      defer: "",
      "data-domain": plausibleDomain,
    });
  }

  const rawAdSenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  if (rawAdSenseClient) {
    // The AdSense script URL requires the "ca-pub-…" form.
    const adSenseClient = rawAdSenseClient.startsWith("ca-")
      ? rawAdSenseClient
      : `ca-${rawAdSenseClient}`;
    injectScript(
      `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseClient}`,
      { crossorigin: "anonymous" },
    );
  }

  // GA measurement id: support both NEXT_PUBLIC_GA_ID and the newer
  // NEXT_PUBLIC_GA_MEASUREMENT_ID name.
  const gaId =
    process.env.NEXT_PUBLIC_GA_ID ||
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  // Hostname/environment gate — see resolveGaLoadDecision() above. Kills
  // preview/localhost/mirror noise so every later GA4 metric is honest.
  const { shouldLoad, debugMode } = resolveGaLoadDecision();

  if (gaId && shouldLoad) {
    injectScript(`https://www.googletagmanager.com/gtag/js?id=${gaId}`);

    if (!window.__gtagInitialised) {
      window.__gtagInitialised = true;
      window.dataLayer = window.dataLayer ?? [];
      // Standard Google gtag bootstrap — must push the `arguments` IArguments
      // object (not a plain array) so gtag.js can parse the command queue.
      // The rest param is for the type signature only; the body deliberately
      // pushes the real `arguments` object as gtag.js expects.
      const gtag = function (...args: unknown[]) {
        void args;
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer.push(arguments);
      };
      // Expose for shared consent helpers (consent-config.ts).
      window.gtag = gtag;
      gtag("js", new Date());
      if (debugMode) {
        // Preview-only escape hatch: tag every event debug_mode so it lands
        // in GA4 DebugView, and mark the traffic internal so it never
        // pollutes the Active/production reports.
        gtag("config", gaId, { debug_mode: true });
        gtag("set", { traffic_type: "internal" });
      } else {
        gtag("config", gaId);
      }
    }
  }
}

/** Apply the consent decision for the current region on load. */
function applyInitialConsent() {
  const stored = getStoredConsent();

  // Visitor explicitly declined — honour it everywhere, leave consent denied.
  if (stored === "declined") return;

  if (requiresOptIn()) {
    // EEA/UK/CH: only grant if the visitor previously accepted; otherwise wait
    // for the banner's Accept (handled in cookie-consent-banner).
    if (stored === "accepted") grantConsent();
    return;
  }

  // US / opt-out / unknown: grant on first visit so personalized ads + analytics
  // serve immediately. The banner still shows as a notice.
  grantConsent();
}

export function ConsentedAnalytics() {
  useEffect(() => {
    // 1) Load the third-party scripts unconditionally (env-guarded).
    loadScripts();

    // 2) Apply the region-appropriate consent state.
    applyInitialConsent();

    // 3) React to later consent changes (banner Accept/Decline, re-open flow).
    function handleConsentChange(e: Event) {
      const consent = (e as CustomEvent<"accepted" | "declined">).detail;
      if (consent === "accepted") grantConsent();
      // On "declined" we intentionally do not push an update here; the banner
      // records the choice and Consent Mode remains at its current (or default
      // denied) state. A page reload re-evaluates via applyInitialConsent.
    }
    window.addEventListener("consentChange", handleConsentChange);
    return () => {
      window.removeEventListener("consentChange", handleConsentChange);
    };
  }, []);

  // Renders nothing — side-effect only.
  return null;
}
