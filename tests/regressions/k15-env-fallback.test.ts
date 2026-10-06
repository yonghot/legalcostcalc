import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import "./helpers/render";
import { firstConfigured, resolveAdsenseClient } from "@/lib/env";
import { AdsenseLoader } from "@/components/ads/adsense-loader";

const PUBLIC_ID = "ca-pub-1378312299412437";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

function loaderMarkup(): string {
  return renderToStaticMarkup(createElement(AdsenseLoader));
}

async function layoutAdsenseMeta(): Promise<unknown> {
  vi.resetModules();
  const { metadata } = await import("@/app/layout");
  return (metadata.other as Record<string, unknown> | undefined)?.["google-adsense-account"];
}

describe("K15: firstConfigured", () => {
  it("skips undefined, empty and whitespace-only values", () => {
    expect(firstConfigured(undefined, "", "   ", "\t", "value")).toBe("value");
  });

  it("returns the trimmed value", () => {
    expect(firstConfigured("  ca-pub-1  ")).toBe("ca-pub-1");
  });

  it("returns undefined when nothing is configured", () => {
    expect(firstConfigured(undefined, "", " ")).toBeUndefined();
    expect(firstConfigured()).toBeUndefined();
  });
});

describe("K15: resolveAdsenseClient", () => {
  it("falls back to the public publisher id when the env value is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_CLIENT_ID", undefined);
    expect(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID).toBeUndefined();
    expect(resolveAdsenseClient()).toBe(PUBLIC_ID);
  });

  it.each(["", " ", "   \t"])("falls back to the public publisher id for %j", (value) => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_CLIENT_ID", value);
    expect(resolveAdsenseClient()).toBe(PUBLIC_ID);
  });

  it("uses a configured value, trimmed and normalized to the ca- form", () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_CLIENT_ID", " ca-pub-0000000000000000 ");
    expect(resolveAdsenseClient()).toBe("ca-pub-0000000000000000");
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_CLIENT_ID", "pub-0000000000000000");
    expect(resolveAdsenseClient()).toBe("ca-pub-0000000000000000");
  });
});

describe("K15: an empty env value never drops the loader or the account meta", () => {
  it.each(["", " "])("loader renders with the public id for %j", (value) => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_CLIENT_ID", value);
    const html = loaderMarkup();
    expect(html).toContain('id="adsense-loader"');
    expect(html).toContain(`adsbygoogle.js?client=${PUBLIC_ID}`);
  });

  it("loader uses a valid configured value, not the fallback", () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_CLIENT_ID", "ca-pub-0000000000000000");
    const html = loaderMarkup();
    expect(html).toContain("adsbygoogle.js?client=ca-pub-0000000000000000");
    expect(html).not.toContain(PUBLIC_ID);
  });

  it.each(["", " "])("google-adsense-account meta keeps the public id for %j", async (value) => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_CLIENT_ID", value);
    expect(await layoutAdsenseMeta()).toBe(PUBLIC_ID);
  });

  it("google-adsense-account meta uses a valid configured value", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_CLIENT_ID", "ca-pub-0000000000000000");
    expect(await layoutAdsenseMeta()).toBe("ca-pub-0000000000000000");
  });

  it("the root layout reads the AdSense client id only through the resolver", () => {
    const source = readFileSync(join(__dirname, "..", "..", "src", "app", "layout.tsx"), "utf8");
    expect(source).not.toMatch(/process\.env\.NEXT_PUBLIC_ADSENSE_CLIENT_ID/);
  });
});
