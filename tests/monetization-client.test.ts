import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { transformSync } from "next/dist/build/swc";
import { describe, expect, it } from "vitest";

const BUILD_ENV: Record<string, string> = {
  NEXT_PUBLIC_AD_PROVIDER: "adsense",
  NEXT_PUBLIC_PRIMARY_CTA_TYPE: "cpl",
  NEXT_PUBLIC_PPC_NUMBER: "+18005551234",
  NEXT_PUBLIC_PPC_LABEL: "Contact a provider",
  NEXT_PUBLIC_CPL_URL: " https://example.com/lead ",
  NEXT_PUBLIC_CPL_LABEL: "Contact a provider",
  NEXT_PUBLIC_SPONSOR_BACKFILL_URL: "https://example.com/sponsor",
  NEXT_PUBLIC_EMAIL_CAPTURE: "on",
  NEXT_PUBLIC_POSTAL_ADDRESS: "Test postal address",
  NEXT_PUBLIC_AFFILIATE_LEGALZOOM_URL: "https://example.com/affiliate/0",
  NEXT_PUBLIC_AFFILIATE_ROCKETLAWYER_URL: "https://example.com/affiliate/1",
  NEXT_PUBLIC_AFFILIATE_LEGALMATCH_URL: "https://example.com/affiliate/2",
  NEXT_PUBLIC_AFFILIATE_AVVO_URL: "https://example.com/affiliate/3",
  NEXT_PUBLIC_AFFILIATE_NOLO_URL: "https://example.com/affiliate/4",
  NEXT_PUBLIC_AFFILIATE_LAWDEPOT_URL: "https://example.com/affiliate/5",
};

function compileForBrowser<T>(file: string): T {
  const { code } = transformSync(readFileSync(resolve(process.cwd(), file), "utf8"), {
    filename: file,
    jsc: {
      parser: { syntax: "typescript" },
      transform: {
        optimizer: {
          globals: {
            envs: Object.fromEntries(
              Object.entries(BUILD_ENV).map(([key, value]) => [key, JSON.stringify(value)]),
            ),
          },
        },
      },
    },
    module: { type: "commonjs" },
  });
  const exports = {};
  runInNewContext(code, { exports, process: { env: {} } });
  return exports as T;
}

const browserMonetization = compileForBrowser<typeof import("@/lib/monetization")>(
  "src/lib/monetization.ts",
);
const browserAffiliates = compileForBrowser<typeof import("@/lib/constants/affiliates")>(
  "src/lib/constants/affiliates.ts",
);

describe("monetization in a browser without server environment variables", () => {
  it("retains configured call, sponsor, and email settings after compilation", () => {
    const { getMonetizationConfig } = browserMonetization;
    const config = getMonetizationConfig();
    expect(config.primaryCTAType).toBe("cpl");
    expect(config.ppcNumber).toBe("+18005551234");
    expect(config.ppcLabel).toBe("Contact a provider");
    expect(config.sponsorBackfillUrl).toBe("https://example.com/sponsor");
    expect(config.emailCaptureEnabled).toBe(true);
    expect(config.postalAddress).toBe("Test postal address");
    expect(config.featuredPartners).toEqual([]);
  });

  it("retains configured CPL settings and trims public values", () => {
    const { getMonetizationConfig } = browserMonetization;
    expect(getMonetizationConfig()).toMatchObject({
      primaryCTAType: "cpl",
      cplUrl: "https://example.com/lead",
      cplLabel: "Contact a provider",
      ppcNumber: "+18005551234",
    });
  });

  it("retains all six configured affiliate URLs and rejects unsafe or absent URLs", () => {
    const { AFFILIATE_PARTNERS, getAffiliateTrackingUrl } = browserAffiliates;
    const isSafeUrl = (url: string) => url.startsWith("https://");
    for (const partner of AFFILIATE_PARTNERS) {
      expect(BUILD_ENV).toHaveProperty(partner.affiliateUrlEnvVar);
      expect(getAffiliateTrackingUrl(partner, isSafeUrl)).toBe(BUILD_ENV[partner.affiliateUrlEnvVar]);
      expect(getAffiliateTrackingUrl(partner, () => false)).toBeUndefined();
    }
    expect(getAffiliateTrackingUrl({
      ...AFFILIATE_PARTNERS[0], affiliateUrlEnvVar: "NEXT_PUBLIC_UNCONFIGURED_URL",
    }, isSafeUrl)).toBeUndefined();
  });
});
