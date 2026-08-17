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
 * <Script>) and pins the ordering property that makes it safe: Consent Mode v2
 * defaults are emitted earlier in the document and still start DENIED, so
 * shipping the library does not ship personalized ads.
 *
 * Source-level rather than render-level because the layout is a server component
 * whose <head> content Next.js hoists at build time; asserting on the source is
 * what actually distinguishes "rendered" from "injected later", which is the
 * whole point of the fix.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const LAYOUT = readFileSync(path.join(ROOT, "src", "app", "layout.tsx"), "utf8");
const CONSENTED = readFileSync(
  path.join(ROOT, "src", "components", "consent", "consented-analytics.tsx"),
  "utf8",
);

describe("CODE-02 — AdSense loader is server-rendered", () => {
  it("the layout renders the loader through next/script", () => {
    expect(LAYOUT).toMatch(/from "next\/script"/);
    expect(LAYOUT).toMatch(/id="adsense-loader"/);
    expect(LAYOUT).toMatch(/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=/);
  });

  it("uses afterInteractive (not lazyOnload, which delays the ad request)", () => {
    const scriptTag = LAYOUT.slice(LAYOUT.indexOf('id="adsense-loader"'));
    expect(scriptTag).toMatch(/strategy="afterInteractive"/);
    expect(scriptTag).toMatch(/crossOrigin="anonymous"/);
  });

  it("no longer injects the loader from an effect", () => {
    expect(CONSENTED).not.toMatch(/injectScript\(\s*`?https:\/\/pagead2\.googlesyndication\.com/);
    // The other two loaders are still injected there — that is unchanged.
    expect(CONSENTED).toMatch(/plausible\.io/);
    expect(CONSENTED).toMatch(/googletagmanager\.com/);
  });

  it("keeps the loader env-guarded (no client id, no script tag)", () => {
    expect(LAYOUT).toMatch(/\{normalizedCaPub && \(/);
  });

  it("emits Consent Mode denied defaults BEFORE the loader", () => {
    const defaultsAt = LAYOUT.indexOf("consent-mode-defaults");
    const loaderAt = LAYOUT.indexOf('id="adsense-loader"');
    expect(defaultsAt).toBeGreaterThan(-1);
    expect(loaderAt).toBeGreaterThan(-1);
    expect(defaultsAt).toBeLessThan(loaderAt);
    expect(LAYOUT).toMatch(/ad_storage:'denied'/);
    expect(LAYOUT).toMatch(/ad_personalization:'denied'/);
    expect(LAYOUT).toMatch(/ad_user_data:'denied'/);
  });

  it("does not gate the loader on a consent decision (Consent Mode governs that)", () => {
    const tagStart = LAYOUT.indexOf('id="adsense-loader"');
    const window = LAYOUT.slice(Math.max(0, tagStart - 400), tagStart);
    expect(window).not.toMatch(/hasConsent|consentGranted|accepted\s*&&/);
  });
});
