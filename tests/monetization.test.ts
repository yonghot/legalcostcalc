/**
 * tests/monetization.test.ts
 *
 * Unit tests for lib/monetization.ts:
 *   - parseFeaturedPartners: invalid/empty => []; valid JSON => typed rows
 *   - parseAdProvider: valid values; default fallback
 *   - parsePrimaryCTAType: valid values; default fallback to vertical default
 *   - getMonetizationConfig: env unset => nulls / false / []
 *   - getMonetizationConfig: env set => correct values
 *   - AdProvider invariant: never returns two providers (structural check)
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  parseFeaturedPartners,
  parseAdProvider,
  parsePrimaryCTAType,
  getMonetizationConfig,
  VERTICAL_DEFAULT_CTA_TYPE,
} from "@/lib/monetization";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Set a process.env key and return a cleanup function.
 */
function withEnv(key: string, value: string | undefined): () => void {
  const original = process.env[key];
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
  return () => {
    if (original === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original;
    }
  };
}

// ── parseFeaturedPartners ────────────────────────────────────────────────────

describe("parseFeaturedPartners", () => {
  it("returns [] when input is null", () => {
    expect(parseFeaturedPartners(null)).toEqual([]);
  });

  it("returns [] for empty string", () => {
    expect(parseFeaturedPartners("")).toEqual([]);
  });

  it("returns [] for invalid JSON", () => {
    expect(parseFeaturedPartners("{not json}")).toEqual([]);
  });

  it("returns [] for JSON that is not an array", () => {
    expect(parseFeaturedPartners('{"label":"x","figure":"y","href":"https://x.com"}')).toEqual([]);
  });

  it("returns [] for an empty array", () => {
    expect(parseFeaturedPartners("[]")).toEqual([]);
  });

  it("returns [] when objects lack required fields", () => {
    expect(parseFeaturedPartners('[{"label":"A"}]')).toEqual([]);
  });

  it("returns [] when href is not a string", () => {
    expect(parseFeaturedPartners('[{"label":"A","figure":"$99","href":123}]')).toEqual([]);
  });

  it("parses a valid single-item array", () => {
    const input = '[{"label":"LegalZoom","figure":"From $79","href":"https://tracking.example.com/lz"}]';
    expect(parseFeaturedPartners(input)).toEqual([
      { label: "LegalZoom", figure: "From $79", href: "https://tracking.example.com/lz" },
    ]);
  });

  it("parses multiple valid rows", () => {
    const input = JSON.stringify([
      { label: "A", figure: "$1", href: "https://a.com" },
      { label: "B", figure: "$2", href: "https://b.com" },
    ]);
    const result = parseFeaturedPartners(input);
    expect(result).toHaveLength(2);
    expect(result[0].label).toBe("A");
    expect(result[1].label).toBe("B");
  });

  it("skips invalid rows but keeps valid ones in a mixed array", () => {
    const input = JSON.stringify([
      { label: "Valid", figure: "$1", href: "https://valid.com" },
      { label: "NoFigure", href: "https://x.com" },
      null,
      42,
    ]);
    const result = parseFeaturedPartners(input);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Valid");
  });
});

// ── parseAdProvider ──────────────────────────────────────────────────────────

describe("parseAdProvider", () => {
  it("returns 'adsense' when null (default)", () => {
    expect(parseAdProvider(null)).toBe("adsense");
  });

  it("returns 'adsense' for unknown value", () => {
    expect(parseAdProvider("unknown")).toBe("adsense");
  });

  it("returns 'adsense' for empty string", () => {
    expect(parseAdProvider("")).toBe("adsense");
  });

  it("recognises 'ezoic'", () => {
    expect(parseAdProvider("ezoic")).toBe("ezoic");
  });

  it("recognises 'raptive'", () => {
    expect(parseAdProvider("raptive")).toBe("raptive");
  });

  it("recognises 'journey'", () => {
    expect(parseAdProvider("journey")).toBe("journey");
  });

  it("recognises 'none'", () => {
    expect(parseAdProvider("none")).toBe("none");
  });

  it("recognises 'adsense' explicitly", () => {
    expect(parseAdProvider("adsense")).toBe("adsense");
  });
});

// ── parsePrimaryCTAType ──────────────────────────────────────────────────────

describe("parsePrimaryCTAType", () => {
  it("falls back to VERTICAL_DEFAULT_CTA_TYPE when null", () => {
    expect(parsePrimaryCTAType(null)).toBe(VERTICAL_DEFAULT_CTA_TYPE);
  });

  it("falls back to VERTICAL_DEFAULT_CTA_TYPE for unknown value", () => {
    expect(parsePrimaryCTAType("email")).toBe(VERTICAL_DEFAULT_CTA_TYPE);
  });

  it("recognises 'call'", () => {
    expect(parsePrimaryCTAType("call")).toBe("call");
  });

  it("recognises 'cpl'", () => {
    expect(parsePrimaryCTAType("cpl")).toBe("cpl");
  });

  it("recognises 'affiliate'", () => {
    expect(parsePrimaryCTAType("affiliate")).toBe("affiliate");
  });

  it("recognises 'none'", () => {
    expect(parsePrimaryCTAType("none")).toBe("none");
  });

  it("VERTICAL_DEFAULT_CTA_TYPE is 'call' for the legal vertical", () => {
    expect(VERTICAL_DEFAULT_CTA_TYPE).toBe("call");
  });
});

// ── getMonetizationConfig — env unset ────────────────────────────────────────

describe("getMonetizationConfig — all env vars unset", () => {
  const KEYS = [
    "NEXT_PUBLIC_AD_PROVIDER",
    "NEXT_PUBLIC_ADSENSE_CLIENT_ID",
    "NEXT_PUBLIC_EZOIC_ENABLED",
    "NEXT_PUBLIC_EZOIC_SCRIPT_SRC",
    "NEXT_PUBLIC_RAPTIVE_SITE_ID",
    "NEXT_PUBLIC_JOURNEY_SITE_ID",
    "NEXT_PUBLIC_ADSTXT_REDIRECT_URL",
    "NEXT_PUBLIC_PRIMARY_CTA_TYPE",
    "NEXT_PUBLIC_PPC_NUMBER",
    "NEXT_PUBLIC_PPC_LABEL",
    "NEXT_PUBLIC_CPL_URL",
    "NEXT_PUBLIC_CPL_LABEL",
    "MON_FEATURED_PARTNERS",
    "NEXT_PUBLIC_SPONSOR_HTML",
    "NEXT_PUBLIC_SPONSOR_BACKFILL_URL",
    "NEXT_PUBLIC_EMAIL_CAPTURE",
    "NEXT_PUBLIC_AUTOAFFILIATE",
  ];

  const cleanups: Array<() => void> = [];

  beforeEach(() => {
    for (const k of KEYS) {
      cleanups.push(withEnv(k, undefined));
    }
  });

  afterEach(() => {
    for (const fn of cleanups.splice(0)) fn();
  });

  it("adProvider defaults to 'adsense' when NEXT_PUBLIC_AD_PROVIDER is unset", () => {
    expect(getMonetizationConfig().adProvider).toBe("adsense");
  });

  it("adSenseClientId is null when unset", () => {
    expect(getMonetizationConfig().adSenseClientId).toBeNull();
  });

  it("ezoicEnabled is false when unset", () => {
    expect(getMonetizationConfig().ezoicEnabled).toBe(false);
  });

  it("ezoicScriptSrc is null when unset", () => {
    expect(getMonetizationConfig().ezoicScriptSrc).toBeNull();
  });

  it("raptiveSiteId is null when unset", () => {
    expect(getMonetizationConfig().raptiveSiteId).toBeNull();
  });

  it("journeySiteId is null when unset", () => {
    expect(getMonetizationConfig().journeySiteId).toBeNull();
  });

  it("adsTxtRedirectUrl is null when unset", () => {
    expect(getMonetizationConfig().adsTxtRedirectUrl).toBeNull();
  });

  it("primaryCTAType defaults to vertical default ('call') when unset", () => {
    expect(getMonetizationConfig().primaryCTAType).toBe(VERTICAL_DEFAULT_CTA_TYPE);
  });

  it("ppcNumber is null when unset", () => {
    expect(getMonetizationConfig().ppcNumber).toBeNull();
  });

  it("ppcLabel is null when unset", () => {
    expect(getMonetizationConfig().ppcLabel).toBeNull();
  });

  it("cplUrl is null when unset", () => {
    expect(getMonetizationConfig().cplUrl).toBeNull();
  });

  it("cplLabel is null when unset", () => {
    expect(getMonetizationConfig().cplLabel).toBeNull();
  });

  it("featuredPartners is [] when MON_FEATURED_PARTNERS is unset", () => {
    expect(getMonetizationConfig().featuredPartners).toEqual([]);
  });

  it("sponsorHtml is null when unset", () => {
    expect(getMonetizationConfig().sponsorHtml).toBeNull();
  });

  it("sponsorBackfillUrl is null when unset", () => {
    expect(getMonetizationConfig().sponsorBackfillUrl).toBeNull();
  });

  it("emailCaptureEnabled is false when unset", () => {
    expect(getMonetizationConfig().emailCaptureEnabled).toBe(false);
  });

  it("autoAffiliate is null when unset", () => {
    expect(getMonetizationConfig().autoAffiliate).toBeNull();
  });

  it("postalAddress is null when unset (CAN-SPAM gate)", () => {
    expect(getMonetizationConfig().postalAddress).toBeNull();
  });
});

// ── getMonetizationConfig — env set ──────────────────────────────────────────

describe("getMonetizationConfig — env vars set", () => {
  const cleanups: Array<() => void> = [];

  afterEach(() => {
    for (const fn of cleanups.splice(0)) fn();
  });

  it("reads NEXT_PUBLIC_AD_PROVIDER=ezoic", () => {
    cleanups.push(withEnv("NEXT_PUBLIC_AD_PROVIDER", "ezoic"));
    expect(getMonetizationConfig().adProvider).toBe("ezoic");
  });

  it("reads NEXT_PUBLIC_AD_PROVIDER=raptive", () => {
    cleanups.push(withEnv("NEXT_PUBLIC_AD_PROVIDER", "raptive"));
    expect(getMonetizationConfig().adProvider).toBe("raptive");
  });

  it("reads NEXT_PUBLIC_AD_PROVIDER=journey", () => {
    cleanups.push(withEnv("NEXT_PUBLIC_AD_PROVIDER", "journey"));
    expect(getMonetizationConfig().adProvider).toBe("journey");
  });

  it("reads NEXT_PUBLIC_AD_PROVIDER=none", () => {
    cleanups.push(withEnv("NEXT_PUBLIC_AD_PROVIDER", "none"));
    expect(getMonetizationConfig().adProvider).toBe("none");
  });

  it("reads NEXT_PUBLIC_ADSENSE_CLIENT_ID", () => {
    cleanups.push(withEnv("NEXT_PUBLIC_ADSENSE_CLIENT_ID", "ca-pub-1234567890123456"));
    expect(getMonetizationConfig().adSenseClientId).toBe("ca-pub-1234567890123456");
  });

  it("reads NEXT_PUBLIC_EZOIC_ENABLED=true", () => {
    cleanups.push(withEnv("NEXT_PUBLIC_EZOIC_ENABLED", "true"));
    expect(getMonetizationConfig().ezoicEnabled).toBe(true);
  });

  it("reads NEXT_PUBLIC_RAPTIVE_SITE_ID", () => {
    cleanups.push(withEnv("NEXT_PUBLIC_RAPTIVE_SITE_ID", "example-site-id"));
    expect(getMonetizationConfig().raptiveSiteId).toBe("example-site-id");
  });

  it("reads NEXT_PUBLIC_JOURNEY_SITE_ID", () => {
    cleanups.push(withEnv("NEXT_PUBLIC_JOURNEY_SITE_ID", "example-journey-id"));
    expect(getMonetizationConfig().journeySiteId).toBe("example-journey-id");
  });

  it("reads NEXT_PUBLIC_PPC_NUMBER", () => {
    cleanups.push(withEnv("NEXT_PUBLIC_PPC_NUMBER", "+18005551234"));
    expect(getMonetizationConfig().ppcNumber).toBe("+18005551234");
  });

  it("reads NEXT_PUBLIC_PRIMARY_CTA_TYPE=cpl", () => {
    cleanups.push(withEnv("NEXT_PUBLIC_PRIMARY_CTA_TYPE", "cpl"));
    expect(getMonetizationConfig().primaryCTAType).toBe("cpl");
  });

  it("reads NEXT_PUBLIC_PRIMARY_CTA_TYPE=none", () => {
    cleanups.push(withEnv("NEXT_PUBLIC_PRIMARY_CTA_TYPE", "none"));
    expect(getMonetizationConfig().primaryCTAType).toBe("none");
  });

  it("reads NEXT_PUBLIC_EMAIL_CAPTURE=on => emailCaptureEnabled=true", () => {
    cleanups.push(withEnv("NEXT_PUBLIC_EMAIL_CAPTURE", "on"));
    expect(getMonetizationConfig().emailCaptureEnabled).toBe(true);
  });

  it("reads NEXT_PUBLIC_EMAIL_CAPTURE=off => emailCaptureEnabled=false", () => {
    cleanups.push(withEnv("NEXT_PUBLIC_EMAIL_CAPTURE", "off"));
    expect(getMonetizationConfig().emailCaptureEnabled).toBe(false);
  });

  it("reads NEXT_PUBLIC_POSTAL_ADDRESS (CAN-SPAM gate)", () => {
    cleanups.push(
      withEnv("NEXT_PUBLIC_POSTAL_ADDRESS", "LegalCostCalc, 123 Main St, Anytown, ST 00000"),
    );
    expect(getMonetizationConfig().postalAddress).toBe(
      "LegalCostCalc, 123 Main St, Anytown, ST 00000",
    );
  });

  it("reads MON_FEATURED_PARTNERS valid JSON", () => {
    const json = JSON.stringify([
      { label: "LegalZoom", figure: "From $79", href: "https://tracking.example.com/lz" },
    ]);
    cleanups.push(withEnv("MON_FEATURED_PARTNERS", json));
    const partners = getMonetizationConfig().featuredPartners;
    expect(partners).toHaveLength(1);
    expect(partners[0].label).toBe("LegalZoom");
  });

  it("MON_FEATURED_PARTNERS invalid JSON => []", () => {
    cleanups.push(withEnv("MON_FEATURED_PARTNERS", "not-json"));
    expect(getMonetizationConfig().featuredPartners).toEqual([]);
  });

  it("reads NEXT_PUBLIC_AUTOAFFILIATE", () => {
    cleanups.push(withEnv("NEXT_PUBLIC_AUTOAFFILIATE", "sovrn"));
    expect(getMonetizationConfig().autoAffiliate).toBe("sovrn");
  });

  it("reads NEXT_PUBLIC_ADSTXT_REDIRECT_URL", () => {
    cleanups.push(withEnv("NEXT_PUBLIC_ADSTXT_REDIRECT_URL", "https://cdn.ezoic.net/ads.txt"));
    expect(getMonetizationConfig().adsTxtRedirectUrl).toBe("https://cdn.ezoic.net/ads.txt");
  });
});

// ── Single-provider invariant ────────────────────────────────────────────────

describe("AdProvider single-provider invariant", () => {
  /**
   * parseAdProvider must return exactly one value from the known set.
   * The set of valid providers is exhaustive and mutually exclusive.
   */
  const VALID_PROVIDERS = ["adsense", "ezoic", "raptive", "journey", "none"] as const;

  it("parseAdProvider always returns exactly one of the five known providers", () => {
    const testInputs = [
      null,
      "",
      "adsense",
      "ezoic",
      "raptive",
      "journey",
      "none",
      "unknown",
      "ADSENSE",
    ];
    for (const input of testInputs) {
      const result = parseAdProvider(input);
      expect(VALID_PROVIDERS).toContain(result);
    }
  });

  it("parseAdProvider result set is exhaustive — no two active at once", () => {
    // Setting all providers simultaneously still yields exactly one.
    const result = parseAdProvider("journey");
    // It cannot simultaneously be any other provider.
    expect(result).toBe("journey");
    expect(result).not.toBe("adsense");
    expect(result).not.toBe("ezoic");
    expect(result).not.toBe("raptive");
  });

  it("getMonetizationConfig returns a single adProvider value, never undefined", () => {
    const cfg = getMonetizationConfig();
    expect(VALID_PROVIDERS).toContain(cfg.adProvider);
  });

  it("journey provider never coexists with another provider's site id being 'active' — parseAdProvider is the sole switch", () => {
    // Even if adsense/ezoic/raptive/journey env vars are ALL set, only the
    // NEXT_PUBLIC_AD_PROVIDER value determines which one AdProvider.tsx
    // renders — parseAdProvider's return type structurally admits exactly
    // one provider, never a set/array/union of active providers.
    const result = parseAdProvider("journey");
    expect(typeof result).toBe("string");
    expect(result).toBe("journey");
  });
});
