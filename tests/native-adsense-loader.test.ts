import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { setPathname } from "./regressions/helpers/render";
import RootLayout from "@/app/layout";

const LOADER = readFileSync(resolve(process.cwd(), "src/components/ads/adsense-loader.tsx"), "utf8");
const LAYOUT = readFileSync(resolve(process.cwd(), "src/app/layout.tsx"), "utf8");

setPathname("/");
const RENDERED = renderToStaticMarkup(createElement(RootLayout, null, null));
const HEAD = RENDERED.slice(RENDERED.indexOf("<head"), RENDERED.indexOf("</head>"));

describe("native AdSense loader", () => {
  it("renders a parser-visible script instead of Next Script", () => {
    expect(LOADER).toMatch(/<script\s+id="adsense-loader"/);
    expect(LOADER).toContain("adsbygoogle.js?client=");
    expect(LOADER).not.toMatch(/<Script\b/);
  });

  it("sits in <head> after the Consent Mode defaults, and carries onLoad so React cannot hoist it above them", () => {
    expect(LOADER).toMatch(/onLoad=\{noop\}/);
    expect(HEAD.indexOf('id="consent-mode-defaults"')).toBeGreaterThan(-1);
    expect(HEAD.indexOf('id="adsense-loader"')).toBeGreaterThan(HEAD.indexOf('id="consent-mode-defaults"'));
    expect(RENDERED.slice(RENDERED.indexOf("</head>"))).not.toContain("adsbygoogle");
  });

  it("is a client component gated by the pathname, not a server component mounted by pages", () => {
    expect(LOADER.trimStart().startsWith('"use client"')).toBe(true);
    expect(LOADER).toMatch(/usePathname\(\)/);
    expect(LOADER).toMatch(/isAdEligiblePath\(/);
  });

  it("tolerates third-party Auto ads nodes appended to the document body", () => {
    expect(LAYOUT).toMatch(/<body\s+[^>]*suppressHydrationWarning/);
  });
});
