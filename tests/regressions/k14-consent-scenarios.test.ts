import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import "./helpers/render";
import { CookieConsentBanner } from "@/components/consent/cookie-consent-banner";
import {
  CONSENT_KEY,
  OPT_IN_COUNTRIES,
  bannerMode,
  getStoredConsent,
  initConsent,
  manageConsentAction,
  openManageConsent,
  persistConsent,
  planInitialConsent,
  subscribeConsentReopen,
} from "@/components/consent/consent-config";

const DIRECT_REGIONS = ["GB", "DE", "CH", "FR", "IS", "NO", "LI", "ES"];
const OTHER_REGIONS = ["US", "XX", "CA", "BR", "KR", "AU", "JP"];

interface Env {
  gtagCalls: unknown[][];
  store: Map<string, string>;
  win: EventTarget & Record<string, unknown>;
}

function setup(country: string, stored: string | null, opts: { storageThrows?: boolean } = {}): Env {
  const gtagCalls: unknown[][] = [];
  const store = new Map<string, string>();
  if (stored) store.set(CONSENT_KEY, stored);
  const win = new EventTarget() as EventTarget & Record<string, unknown>;
  win.dataLayer = [];
  win.gtag = (...args: unknown[]) => {
    gtagCalls.push(args);
  };
  const storage = opts.storageThrows
    ? {
        getItem: () => {
          throw new Error("denied");
        },
        setItem: () => {
          throw new Error("denied");
        },
        removeItem: () => {
          throw new Error("denied");
        },
      }
    : {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => void store.set(key, value),
        removeItem: (key: string) => void store.delete(key),
      };
  vi.stubGlobal("window", win);
  vi.stubGlobal("document", { cookie: `other=1; visitor_country=${country}` });
  vi.stubGlobal("localStorage", storage);
  return { gtagCalls, store, win };
}

const updates = (calls: unknown[][]) => calls.filter((c) => c[0] === "consent" && c[1] === "update");
const granted = (calls: unknown[][]) =>
  updates(calls).filter((c) => (c[2] as Record<string, string>).ad_storage === "granted");
const denied = (calls: unknown[][]) =>
  updates(calls).filter((c) => (c[2] as Record<string, string>).ad_storage === "denied");

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("K14: pure decisions", () => {
  it("OPT_IN_COUNTRIES is the 32-code EEA + IS/LI/NO + GB + CH list", () => {
    expect(OPT_IN_COUNTRIES.size).toBe(32);
    for (const code of DIRECT_REGIONS) expect(OPT_IN_COUNTRIES.has(code)).toBe(true);
    for (const code of OTHER_REGIONS) expect(OPT_IN_COUNTRIES.has(code)).toBe(false);
  });

  it.each(OTHER_REGIONS)("%s: no update on a first visit or after Accept; update(denied) after a stored Decline", (country) => {
    expect(planInitialConsent(country, null)).toBe("none");
    expect(planInitialConsent(country, "accepted")).toBe("none");
    expect(planInitialConsent(country, "declined")).toBe("update-denied");
  });

  it.each(DIRECT_REGIONS)("%s: never plans anything, whatever is stored", (country) => {
    for (const stored of [null, "accepted", "declined"] as const) {
      expect(planInitialConsent(country, stored)).toBe("none");
    }
  });

  it("the banner mode and the Manage consent action follow the region", () => {
    for (const country of DIRECT_REGIONS) {
      expect(bannerMode(country)).toBe("cmp");
      expect(manageConsentAction(country)).toBe("cmp");
    }
    for (const country of OTHER_REGIONS) {
      expect(bannerMode(country)).toBe("own");
      expect(manageConsentAction(country)).toBe("banner");
    }
  });
});

describe("K14: client scenarios", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it.each(["US", "XX"])("%s first visit: no banner and no consent update", (country) => {
    const { gtagCalls } = setup(country, null);
    initConsent();
    expect(updates(gtagCalls)).toHaveLength(0);
    expect(renderToStaticMarkup(createElement(CookieConsentBanner))).toBe("");
  });

  it("US with a stored Decline: the revisit sends update(denied) and nothing granted", () => {
    const { gtagCalls } = setup("US", "declined");
    initConsent();
    expect(denied(gtagCalls)).toHaveLength(1);
    expect(granted(gtagCalls)).toHaveLength(0);
    const signals = denied(gtagCalls)[0]![2] as Record<string, string>;
    for (const key of ["ad_storage", "ad_user_data", "ad_personalization", "analytics_storage"]) {
      expect(signals[key]).toBe("denied");
    }
  });

  it("US with a stored Accept: stays granted by the default, no update is sent", () => {
    const { gtagCalls } = setup("US", "accepted");
    initConsent();
    expect(updates(gtagCalls)).toHaveLength(0);
  });

  it.each(DIRECT_REGIONS)("%s: no update(granted) from our code, with any stored value", (country) => {
    for (const stored of [null, "accepted", "declined"]) {
      const { gtagCalls } = setup(country, stored);
      initConsent();
      expect(granted(gtagCalls), `${country}/${stored}`).toHaveLength(0);
      vi.unstubAllGlobals();
    }
  });

  it.each(DIRECT_REGIONS)("%s: even a consentChange accepted event never grants", (country) => {
    const { gtagCalls, win } = setup(country, null);
    initConsent();
    win.dispatchEvent(new CustomEvent("consentChange", { detail: "accepted" }));
    expect(granted(gtagCalls)).toHaveLength(0);
  });

  it("US: Decline persists and sends update(denied); Accept persists and sends update(granted)", () => {
    const { gtagCalls, store } = setup("US", null);
    initConsent();
    persistConsent("declined");
    expect(store.get(CONSENT_KEY)).toBe("declined");
    expect(denied(gtagCalls)).toHaveLength(1);
    persistConsent("accepted");
    expect(store.get(CONSENT_KEY)).toBe("accepted");
    expect(granted(gtagCalls)).toHaveLength(1);
  });

  it("the banner opens from the footer link outside the EEA and never inside it", () => {
    for (const country of DIRECT_REGIONS) {
      const { win } = setup(country, null);
      const open = vi.fn();
      const stop = subscribeConsentReopen(open);
      win.dispatchEvent(new CustomEvent("consentReopen"));
      expect(open, country).not.toHaveBeenCalled();
      stop();
      vi.unstubAllGlobals();
    }
    for (const country of OTHER_REGIONS) {
      const { win } = setup(country, null);
      const open = vi.fn();
      const stop = subscribeConsentReopen(open);
      win.dispatchEvent(new CustomEvent("consentReopen"));
      expect(open, country).toHaveBeenCalledTimes(1);
      stop();
      win.dispatchEvent(new CustomEvent("consentReopen"));
      expect(open, country).toHaveBeenCalledTimes(1);
      vi.unstubAllGlobals();
    }
  });

  it.each(DIRECT_REGIONS)("%s: Manage consent queues the Google CMP revocation message", (country) => {
    const { win } = setup(country, null);
    const reopened = vi.fn();
    win.addEventListener("consentReopen", reopened);
    const showRevocationMessage = vi.fn();
    openManageConsent();
    const fc = win.googlefc as { callbackQueue: Array<() => void>; showRevocationMessage?: () => void };
    expect(Array.isArray(fc.callbackQueue)).toBe(true);
    expect(fc.callbackQueue).toHaveLength(1);
    fc.showRevocationMessage = showRevocationMessage;
    fc.callbackQueue[0]!();
    expect(showRevocationMessage).toHaveBeenCalledTimes(1);
    expect(reopened).not.toHaveBeenCalled();
  });

  it("Manage consent keeps a queue that Google's script already created", () => {
    const { win } = setup("DE", null);
    const existing = vi.fn();
    win.googlefc = { callbackQueue: [existing] };
    openManageConsent();
    expect((win.googlefc as { callbackQueue: unknown[] }).callbackQueue).toHaveLength(2);
    expect((win.googlefc as { callbackQueue: unknown[] }).callbackQueue[0]).toBe(existing);
  });

  it.each(OTHER_REGIONS)("%s: Manage consent reopens the banner and does not touch the Google CMP", (country) => {
    const { win, store } = setup(country, "declined");
    const reopened = vi.fn();
    win.addEventListener("consentReopen", reopened);
    openManageConsent();
    expect(reopened).toHaveBeenCalledTimes(1);
    expect(win.googlefc).toBeUndefined();
    expect(store.get(CONSENT_KEY)).toBe("declined");
  });

  it("unreadable or unwritable browser storage never crashes and never blocks a choice", () => {
    const { gtagCalls } = setup("US", null, { storageThrows: true });
    expect(getStoredConsent()).toBeNull();
    expect(() => initConsent()).not.toThrow();
    expect(() => persistConsent("declined")).not.toThrow();
    expect(denied(gtagCalls)).toHaveLength(1);
    expect(() => openManageConsent()).not.toThrow();
  });

  it("the banner renders nothing on the server in any region", () => {
    for (const country of [...DIRECT_REGIONS, ...OTHER_REGIONS]) {
      setup(country, null);
      expect(renderToStaticMarkup(createElement(CookieConsentBanner)), country).toBe("");
      vi.unstubAllGlobals();
    }
  });
});
