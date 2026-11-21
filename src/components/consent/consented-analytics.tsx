"use client";

/**
 * ConsentedAnalytics
 *
 * Loads the GA4 (gtag.js) script UNCONDITIONALLY (env-guarded) on every page —
 * it is NOT gated behind the cookie banner.
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
 * Consent: the region-scoped Consent Mode default is set inline in <head>
 * (EEA/UK/CH denied, elsewhere granted); initConsent() only applies a stored
 * Decline and later banner choices. See consent-config.ts.
 *
 * Scripts still require their respective NEXT_PUBLIC_* env vars to be present;
 * with no env set, this component injects nothing and the free site is unchanged.
 */

import { useEffect } from "react";
import { resolveGaId } from "@/lib/env";
import { decideGaLoad } from "@/lib/ga-gate";
import { initConsent } from "./consent-config";

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
  // NEXT_PUBLIC_* reads stay literal here so the bundler inlines them; decideGaLoad (lib/ga-gate.ts) is the tested rule.
  return decideGaLoad({
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    vercelEnv: process.env.NEXT_PUBLIC_VERCEL_ENV,
    gaDebug: process.env.NEXT_PUBLIC_GA_DEBUG,
    hostname: typeof window === "undefined" ? undefined : window.location.hostname,
  });
}

/** Inject the GA4 loader (env-guarded, idempotent). */
function loadScripts() {
  // The AdSense loader is NOT injected here. The AdsenseLoader component
  // renders it into the root layout <head> (CODE-02): an effect-injected
  // script is invisible to AdSense's site review and to Auto ads. Consent
  // Mode v2 defaults in the layout head still run first.

  const gaId = resolveGaId();

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

export function ConsentedAnalytics() {
  useEffect(() => {
    // A stored decline must reach the queue before gtag.js processes config.
    const stopConsent = initConsent();
    loadScripts();
    return stopConsent;
  }, []);

  // Renders nothing — side-effect only.
  return null;
}
