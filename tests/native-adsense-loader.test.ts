import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import "./regressions/helpers/render";
import RootLayout from "@/app/layout";
import { AdsenseLoader } from "@/components/ads/adsense-loader";

const LOADER = readFileSync(resolve(process.cwd(), "src/components/ads/adsense-loader.tsx"), "utf8");
const LAYOUT = readFileSync(resolve(process.cwd(), "src/app/layout.tsx"), "utf8");
const RENDERED = renderToStaticMarkup(createElement(RootLayout, null, createElement(AdsenseLoader)));

describe("native AdSense loader", () => {
  it("renders a parser-visible script instead of Next Script", () => {
    expect(LOADER).toMatch(/<script id="adsense-loader"/);
    expect(LOADER).toContain("adsbygoogle.js?client=${client}");
    expect(LOADER).not.toMatch(/<Script\b/);
  });

  it("keeps the third-party loader out of the document head, so React cannot hoist it above the Consent Mode defaults", () => {
    const head = RENDERED.slice(RENDERED.indexOf("<head"), RENDERED.indexOf("</head>"));
    expect(head).toContain('id="consent-mode-defaults"');
    expect(head).not.toContain("adsense-loader");
    expect(RENDERED.slice(RENDERED.indexOf("</head>"))).toContain('id="adsense-loader"');
  });

  it("tolerates third-party Auto ads nodes appended to the document body", () => {
    expect(LAYOUT).toMatch(/<body\s+[^>]*suppressHydrationWarning/);
  });
});
