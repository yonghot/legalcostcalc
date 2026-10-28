/**
 * tests/code-02-loader-server-rendered.test.ts — CODE-02/CODE-10 (부속W).
 *
 * The ad-health audit found this site serving NO AdSense loader on any page
 * while eight of its nine siblings served one. The loader had been injected from
 * a useEffect with createElement, so it existed only after hydration — invisible
 * to AdSense's site review and useless for Auto ads, both of which read the
 * served HTML.
 *
 * This suite pins the fix at the source level (the layout renders a real
 * <script>) and pins the ordering property that makes it safe: Consent Mode v2
 * defaults are emitted earlier in the document and still start DENIED, so
 * shipping the library does not ship personalized ads.
 *
 * R4 (2026-10-28): the loader is the client component AdsenseLoader in the root
 * layout <head>, right after the Consent Mode defaults, gated by pathname
 * (lib/ad-eligibility-rules.ts). These assertions read the component and layout
 * source and the rendered layout (the order of the defaults and the loader is
 * pinned on rendered HTML).
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { setPathname } from "./regressions/helpers/render";
import RootLayout from "@/app/layout";

const ROOT = path.resolve(__dirname, "..");
const LOADER = readFileSync(path.join(ROOT, "src", "components", "ads", "adsense-loader.tsx"), "utf8");
const LAYOUT = readFileSync(path.join(ROOT, "src", "app", "layout.tsx"), "utf8");
setPathname("/");
const RENDERED = renderToStaticMarkup(createElement(RootLayout, null, null));
const CONSENTED = readFileSync(
  path.join(ROOT, "src", "components", "consent", "consented-analytics.tsx"),
  "utf8",
);

describe("CODE-02 — AdSense loader is server-rendered", () => {
  it("the loader component renders a native parser-visible script", () => {
    expect(LOADER).not.toMatch(/from "next\/script"/);
    expect(LOADER).toMatch(/<script\s+id="adsense-loader"/);
    expect(LOADER).toMatch(/pagead2\.googlesyndication\.com|LOADER_ORIGIN/);
    expect(LOADER).toMatch(/\/pagead\/js\/adsbygoogle\.js\?client=/);
    expect(RENDERED).toMatch(/<script id="adsense-loader"[^>]*src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-/);
  });

  it("uses an async native script rather than Next loading strategies", () => {
    expect(LOADER).toMatch(/\basync\b/);
    expect(LOADER).not.toMatch(/strategy=/);
    expect(LOADER).toMatch(/crossOrigin="anonymous"/);
    expect(LOADER).toMatch(/onLoad=\{noop\}/);
  });

  it("no longer injects the loader from an effect", () => {
    expect(CONSENTED).not.toMatch(/injectScript\(\s*`?https:\/\/pagead2\.googlesyndication\.com/);
    expect(CONSENTED).not.toMatch(/plausible\.io/);
    expect(CONSENTED).toMatch(/googletagmanager\.com/);
  });

  it("never drops the loader on an empty env value (client id resolved with a fallback)", () => {
    expect(LAYOUT).toMatch(/client=\{resolveAdsenseClient\(\)\}/);
    expect(LOADER).not.toMatch(/process\.env/);
  });

  it("emits Consent Mode denied defaults BEFORE the loader in the rendered document", () => {
    const defaultsAt = RENDERED.indexOf('id="consent-mode-defaults"');
    const loaderAt = RENDERED.indexOf('id="adsense-loader"');
    expect(defaultsAt).toBeGreaterThan(-1);
    expect(loaderAt).toBeGreaterThan(-1);
    expect(defaultsAt).toBeLessThan(loaderAt);
    expect(RENDERED).toMatch(/ad_storage:'denied'/);
    expect(RENDERED).toMatch(/ad_personalization:'denied'/);
    expect(RENDERED).toMatch(/ad_user_data:'denied'/);
  });

  it("does not gate the loader on a consent decision (Consent Mode governs that)", () => {
    expect(LOADER).not.toMatch(/hasConsent|consentGranted|accepted\s*&&/);
  });
});
