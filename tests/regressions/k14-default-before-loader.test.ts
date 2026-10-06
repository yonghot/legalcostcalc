import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import vm from "node:vm";
import { setPathname } from "./helpers/render";
import RootLayout from "@/app/layout";
import HomePage from "@/app/page";
import StateCategoryPage from "@/app/[state]/[slug]/page";
import { OPT_IN_COUNTRIES } from "@/components/consent/consent-config";

const SIGNALS = ["ad_storage", "ad_user_data", "ad_personalization", "analytics_storage"];

async function inLayout(pathname: string, element: ReactNode | Promise<ReactNode>): Promise<string> {
  setPathname(pathname);
  return renderToStaticMarkup(createElement(RootLayout, null, await element));
}

function defaultScript(html: string): string {
  const match = html.match(/<script id="consent-mode-defaults">([\s\S]*?)<\/script>/);
  expect(match, "consent-mode-defaults script is rendered").not.toBeNull();
  return match![1]!;
}

type GtagCall = unknown[];

function runInSandbox(script: string): GtagCall[] {
  const sandbox: Record<string, unknown> = {};
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(script, sandbox);
  const queue = Array.from(sandbox.dataLayer as ArrayLike<ArrayLike<unknown>>);
  return JSON.parse(JSON.stringify(queue.map((entry) => Array.from(entry))));
}

describe("K14: the Consent Mode default is region-scoped and precedes the loader", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_CLIENT_ID", "ca-pub-2222222222222222");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("issues a denied default for the EEA, UK and Switzerland, then a granted default for everyone else", async () => {
    const calls = runInSandbox(defaultScript(await inLayout("/", HomePage())));
    const defaults = calls.filter((c) => c[0] === "consent" && c[1] === "default");
    expect(defaults).toHaveLength(2);

    const [scoped, global] = defaults.map((c) => c[2] as Record<string, unknown>);
    for (const signal of SIGNALS) expect(scoped![signal], `scoped ${signal}`).toBe("denied");
    expect(scoped!.wait_for_update).toBe(500);
    const region = scoped!.region as string[];
    for (const code of ["GB", "CH", "DE", "FR", "IS", "NO", "LI", "ES", "IT", "NL", "PL", "SE"]) {
      expect(region, code).toContain(code);
    }
    expect(new Set(region).size).toBe(region.length);
    expect([...region].sort()).toEqual([...OPT_IN_COUNTRIES].sort());
    for (const code of region) expect(code).toMatch(/^[A-Z]{2}$/);
    expect(region).not.toContain("US");

    for (const signal of SIGNALS) expect(global![signal], `global ${signal}`).toBe("granted");
    expect(global).not.toHaveProperty("region");
    expect(global).not.toHaveProperty("wait_for_update");
  });

  it("defines window.gtag and pushes nothing else", async () => {
    const script = defaultScript(await inLayout("/", HomePage()));
    expect(script).toContain("window.gtag=window.gtag||gtag");
    const calls = runInSandbox(script);
    expect(calls.every((c) => c[0] === "consent")).toBe(true);
  });

  it("is still emitted when the env values are empty strings", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_CLIENT_ID", "");
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "");
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", " ");
    const html = await inLayout("/", HomePage());
    expect(runInSandbox(defaultScript(html))).toHaveLength(2);
  });

  it("appears in <head> before the AdSense loader on the home page and on a state page", async () => {
    for (const [path, page] of [
      ["/", () => HomePage()],
      ["/california/divorce-cost", () => StateCategoryPage({ params: Promise.resolve({ state: "california", slug: "divorce-cost" }) })],
    ] as const) {
      const html = await inLayout(path, page());
      const defaultsAt = html.indexOf('id="consent-mode-defaults"');
      const loaderAt = html.indexOf('id="adsense-loader"');
      expect(defaultsAt, path).toBeGreaterThan(-1);
      expect(loaderAt, path).toBeGreaterThan(-1);
      expect(defaultsAt, path).toBeLessThan(loaderAt);
      expect(defaultsAt, path).toBeLessThan(html.indexOf("</head>"));
      expect(html.slice(html.indexOf("<head"), html.indexOf("</head>"))).not.toContain("adsbygoogle");
    }
  });
});
