/**
 * Tests for src/lib/analytics.ts
 *
 * Covers:
 *   - trackEvent is a no-op when window is undefined (SSR/node environment,
 *     the default in this vitest config — no stubbing needed for this case)
 *   - trackEvent is a no-op when window.gtag is not a function
 *   - trackEvent merges { site, ...params } and calls gtag('event', name, params)
 *   - trackEvent adds traffic_type:'internal' when the localStorage marker is set
 *   - trackEvent adds debug_mode:true when NEXT_PUBLIC_GA_DEBUG=1
 *   - initTrafficMarker sets/clears the localStorage marker from ?crew=1 / ?crew=0
 *   - EventName union / SITE_ID / IS_SENSITIVE_SITE sanity
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// This suite runs under vitest's "node" environment (see vitest.config.ts),
// so `window` is undefined by default — exercising the real SSR no-op path
// with zero stubbing required.

describe("analytics: SSR no-op (no window)", () => {
  it("trackEvent does not throw and performs no gtag call when window is undefined", async () => {
    expect(typeof window).toBe("undefined");
    const { trackEvent } = await import("@/lib/analytics");
    expect(() => trackEvent("calc_input_start", { calc_type: "divorce" })).not.toThrow();
  });

  it("initTrafficMarker does not throw when window is undefined", async () => {
    const { initTrafficMarker } = await import("@/lib/analytics");
    expect(() => initTrafficMarker()).not.toThrow();
  });
});

describe("analytics: with a stubbed window", () => {
  interface FakeStorage {
    store: Map<string, string>;
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
  }

  function makeFakeStorage(): FakeStorage {
    const store = new Map<string, string>();
    return {
      store,
      getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    };
  }

  let fakeWindow: {
    localStorage: FakeStorage;
    location: { search: string };
    gtag?: (...args: unknown[]) => void;
  };

  beforeEach(() => {
    vi.resetModules();
    fakeWindow = {
      localStorage: makeFakeStorage(),
      location: { search: "" },
    };
    vi.stubGlobal("window", fakeWindow);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("trackEvent is a no-op when window.gtag is not a function", async () => {
    const { trackEvent } = await import("@/lib/analytics");
    expect(() => trackEvent("calculator_complete", { calc_type: "divorce" })).not.toThrow();
    // No gtag defined at all — nothing to assert a call against; the point is
    // it must not throw trying to invoke a non-function.
  });

  it("trackEvent merges { site, ...params } and calls gtag('event', name, params)", async () => {
    const calls: unknown[][] = [];
    fakeWindow.gtag = (...args: unknown[]) => {
      calls.push(args);
    };

    const { trackEvent, SITE_ID } = await import("@/lib/analytics");
    trackEvent("related_click", { link_module: "result_related", link_url: "/x" });

    expect(calls).toHaveLength(1);
    const [eventName, name, params] = calls[0] as [string, string, Record<string, unknown>];
    expect(eventName).toBe("event");
    expect(name).toBe("related_click");
    expect(params).toMatchObject({
      site: SITE_ID,
      link_module: "result_related",
      link_url: "/x",
    });
    // No traffic marker set -> traffic_type must be absent.
    expect(params.traffic_type).toBeUndefined();
  });

  it("trackEvent adds traffic_type:'internal' when the localStorage marker is set", async () => {
    const calls: unknown[][] = [];
    fakeWindow.gtag = (...args: unknown[]) => {
      calls.push(args);
    };
    fakeWindow.localStorage.setItem("cc_traffic_type", "internal");

    const { trackEvent } = await import("@/lib/analytics");
    trackEvent("calc_input_start", { calc_type: "divorce" });

    const [, , params] = calls[0] as [string, string, Record<string, unknown>];
    expect(params.traffic_type).toBe("internal");
  });

  it("trackEvent adds debug_mode:true when NEXT_PUBLIC_GA_DEBUG=1", async () => {
    vi.stubEnv("NEXT_PUBLIC_GA_DEBUG", "1");
    const calls: unknown[][] = [];
    fakeWindow.gtag = (...args: unknown[]) => {
      calls.push(args);
    };

    const { trackEvent } = await import("@/lib/analytics");
    trackEvent("calculator_complete", { calc_type: "divorce" });

    const [, , params] = calls[0] as [string, string, Record<string, unknown>];
    expect(params.debug_mode).toBe(true);
  });

  it("initTrafficMarker sets the marker on ?crew=1 and clears it on ?crew=0", async () => {
    fakeWindow.location.search = "?crew=1";
    const { initTrafficMarker } = await import("@/lib/analytics");
    initTrafficMarker();
    expect(fakeWindow.localStorage.getItem("cc_traffic_type")).toBe("internal");

    fakeWindow.location.search = "?crew=0";
    initTrafficMarker();
    expect(fakeWindow.localStorage.getItem("cc_traffic_type")).toBeNull();
  });

  it("initTrafficMarker leaves the marker untouched when ?crew is absent", async () => {
    fakeWindow.location.search = "?foo=bar";
    const { initTrafficMarker } = await import("@/lib/analytics");
    initTrafficMarker();
    expect(fakeWindow.localStorage.getItem("cc_traffic_type")).toBeNull();
  });
});

describe("analytics: module contract", () => {
  it("IS_SENSITIVE_SITE is true for legalcostcalc", async () => {
    const { IS_SENSITIVE_SITE } = await import("@/lib/analytics");
    expect(IS_SENSITIVE_SITE).toBe(true);
  });

  it("SITE_ID defaults to 'legalcostcalc' when env unset", async () => {
    const { SITE_ID } = await import("@/lib/analytics");
    expect(SITE_ID).toBe("legalcostcalc");
  });
});
