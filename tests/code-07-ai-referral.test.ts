/**
 * Tests for CODE-07 (부속P §4) — AI-referral & rich-context detection in
 * src/lib/analytics.ts.
 *
 * Covers:
 *   - classifyReferralSource (pure classifier): AI engine referrers
 *     (chatgpt/perplexity/gemini/copilot + AI-Overview query pattern),
 *     embed-referral via ?host= param, known directory/community referrers,
 *     and the "nothing matches" fallthrough.
 *   - "ai_referral" is part of the EventName union (compile-time check via
 *     a direct trackEvent call).
 *   - trackReferralSource (browser side-effect wrapper): fires the correct
 *     tagged GA4 event through the existing trackEvent()/gtag pipeline for
 *     each referral kind, is idempotent per session (sessionStorage guard),
 *     and is a no-op when nothing matches or window is undefined.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("classifyReferralSource: AI engine referrers", () => {
  it("classifies chatgpt.com as ai/chatgpt", () => {
    return import("@/lib/analytics").then(({ classifyReferralSource }) => {
      expect(classifyReferralSource("https://chatgpt.com/")).toEqual({
        kind: "ai",
        source: "chatgpt",
      });
    });
  });

  it("classifies chat.openai.com as ai/chatgpt", async () => {
    const { classifyReferralSource } = await import("@/lib/analytics");
    expect(classifyReferralSource("https://chat.openai.com/c/abc")).toEqual({
      kind: "ai",
      source: "chatgpt",
    });
  });

  it("classifies perplexity.ai as ai/perplexity", async () => {
    const { classifyReferralSource } = await import("@/lib/analytics");
    expect(classifyReferralSource("https://www.perplexity.ai/search?q=x")).toEqual(
      { kind: "ai", source: "perplexity" },
    );
  });

  it("classifies gemini.google.com as ai/gemini", async () => {
    const { classifyReferralSource } = await import("@/lib/analytics");
    expect(classifyReferralSource("https://gemini.google.com/app")).toEqual({
      kind: "ai",
      source: "gemini",
    });
  });

  it("classifies copilot.microsoft.com as ai/copilot", async () => {
    const { classifyReferralSource } = await import("@/lib/analytics");
    expect(classifyReferralSource("https://copilot.microsoft.com/")).toEqual({
      kind: "ai",
      source: "copilot",
    });
  });

  it("classifies bing.com (Copilot surface) as ai/copilot", async () => {
    const { classifyReferralSource } = await import("@/lib/analytics");
    expect(classifyReferralSource("https://www.bing.com/search?q=x")).toEqual({
      kind: "ai",
      source: "copilot",
    });
  });

  it("classifies a Google referrer with udm=50 (AI Mode) as ai/ai-overview", async () => {
    const { classifyReferralSource } = await import("@/lib/analytics");
    expect(
      classifyReferralSource(
        "https://www.google.com/search?q=divorce+cost&udm=50",
      ),
    ).toEqual({ kind: "ai", source: "ai-overview" });
  });

  it("classifies a Google referrer with utm_source=aiovw as ai/ai-overview", async () => {
    const { classifyReferralSource } = await import("@/lib/analytics");
    expect(
      classifyReferralSource(
        "https://www.google.com/search?q=x&utm_source=aiovw",
      ),
    ).toEqual({ kind: "ai", source: "ai-overview" });
  });

  it("does NOT classify a bare Google organic-search referrer as AI", async () => {
    const { classifyReferralSource } = await import("@/lib/analytics");
    expect(
      classifyReferralSource("https://www.google.com/search?q=divorce+cost"),
    ).toEqual({ kind: null, source: null });
  });
});

describe("classifyReferralSource: embed-referral", () => {
  it("classifies a ?host= param on the current URL as embed regardless of referrer", async () => {
    const { classifyReferralSource } = await import("@/lib/analytics");
    expect(
      classifyReferralSource(
        "",
        "https://legalcostcalc.co/california/divorce-cost?host=example-partner.com",
      ),
    ).toEqual({ kind: "embed", source: "example-partner.com" });
  });

  it("prioritizes embed ?host= over an AI referrer when both are present", async () => {
    const { classifyReferralSource } = await import("@/lib/analytics");
    expect(
      classifyReferralSource(
        "https://chatgpt.com/",
        "https://legalcostcalc.co/california/divorce-cost?host=partner.com",
      ),
    ).toEqual({ kind: "embed", source: "partner.com" });
  });
});

describe("classifyReferralSource: directory/community referrers", () => {
  it("classifies reddit.com as directory/reddit", async () => {
    const { classifyReferralSource } = await import("@/lib/analytics");
    expect(classifyReferralSource("https://www.reddit.com/r/legaladvice/")).toEqual(
      { kind: "directory", source: "reddit" },
    );
  });

  it("classifies old.reddit.com as directory/reddit", async () => {
    const { classifyReferralSource } = await import("@/lib/analytics");
    expect(classifyReferralSource("https://old.reddit.com/r/personalfinance/")).toEqual(
      { kind: "directory", source: "reddit" },
    );
  });

  it("classifies producthunt.com as directory/producthunt", async () => {
    const { classifyReferralSource } = await import("@/lib/analytics");
    expect(classifyReferralSource("https://www.producthunt.com/posts/x")).toEqual({
      kind: "directory",
      source: "producthunt",
    });
  });

  it("classifies pinterest.com as directory/pinterest", async () => {
    const { classifyReferralSource } = await import("@/lib/analytics");
    expect(classifyReferralSource("https://pinterest.com/pin/123")).toEqual({
      kind: "directory",
      source: "pinterest",
    });
  });
});

describe("classifyReferralSource: fallthrough", () => {
  it("returns kind:null for an empty referrer and no host param", async () => {
    const { classifyReferralSource } = await import("@/lib/analytics");
    expect(classifyReferralSource("")).toEqual({ kind: null, source: null });
  });

  it("returns kind:null for an unrecognized referrer host", async () => {
    const { classifyReferralSource } = await import("@/lib/analytics");
    expect(classifyReferralSource("https://some-random-blog.example/")).toEqual({
      kind: null,
      source: null,
    });
  });

  it("returns kind:null (never throws) for a malformed referrer string", async () => {
    const { classifyReferralSource } = await import("@/lib/analytics");
    expect(classifyReferralSource("not a url")).toEqual({
      kind: null,
      source: null,
    });
  });

  it("returns kind:null (never throws) for a malformed currentUrl", async () => {
    const { classifyReferralSource } = await import("@/lib/analytics");
    expect(() => classifyReferralSource("", "not a url###")).not.toThrow();
  });
});

describe("EventName: ai_referral is a valid event name", () => {
  it("trackEvent accepts 'ai_referral' without a TypeScript error (compile-time contract)", async () => {
    const { trackEvent } = await import("@/lib/analytics");
    // Runs in the SSR (no window) path — asserts only that it's callable and
    // doesn't throw; the real value of this test is that 'ai_referral' type-
    // checks as an EventName at all (tsc/build would fail otherwise).
    expect(() => trackEvent("ai_referral", { source: "perplexity" })).not.toThrow();
  });
});

describe("trackReferralSource: browser side-effect wrapper", () => {
  it("does not throw when window is undefined (SSR)", async () => {
    expect(typeof window).toBe("undefined");
    const { trackReferralSource } = await import("@/lib/analytics");
    expect(() => trackReferralSource()).not.toThrow();
  });
});

describe("trackReferralSource: with a stubbed window", () => {
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
    sessionStorage: FakeStorage;
    location: { search: string; href: string };
    gtag?: (...args: unknown[]) => void;
  };

  beforeEach(() => {
    vi.resetModules();
    fakeWindow = {
      localStorage: makeFakeStorage(),
      sessionStorage: makeFakeStorage(),
      location: { search: "", href: "https://legalcostcalc.co/california/divorce-cost" },
    };
    vi.stubGlobal("window", fakeWindow);
    vi.stubGlobal("document", { referrer: "" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("fires ai_referral with source=perplexity when referrer is perplexity.ai", async () => {
    vi.stubGlobal("document", { referrer: "https://www.perplexity.ai/search?q=x" });
    const calls: unknown[][] = [];
    fakeWindow.gtag = (...args: unknown[]) => {
      calls.push(args);
    };

    const { trackReferralSource } = await import("@/lib/analytics");
    trackReferralSource();

    expect(calls).toHaveLength(1);
    const [eventType, name, params] = calls[0] as [string, string, Record<string, unknown>];
    expect(eventType).toBe("event");
    expect(name).toBe("ai_referral");
    expect(params.source).toBe("perplexity");
  });

  it("fires embed_loaded/referral_kind=embed_referral for a ?host= current URL", async () => {
    fakeWindow.location.href =
      "https://legalcostcalc.co/california/divorce-cost?host=partner-blog.com";
    const calls: unknown[][] = [];
    fakeWindow.gtag = (...args: unknown[]) => {
      calls.push(args);
    };

    const { trackReferralSource } = await import("@/lib/analytics");
    trackReferralSource();

    expect(calls).toHaveLength(1);
    const [, name, params] = calls[0] as [string, string, Record<string, unknown>];
    expect(name).toBe("embed_loaded");
    expect(params.host_domain).toBe("partner-blog.com");
    expect(params.referral_kind).toBe("embed_referral");
  });

  it("fires outbound_click/referral_kind=directory for a reddit.com referrer", async () => {
    vi.stubGlobal("document", { referrer: "https://www.reddit.com/r/legaladvice/" });
    const calls: unknown[][] = [];
    fakeWindow.gtag = (...args: unknown[]) => {
      calls.push(args);
    };

    const { trackReferralSource } = await import("@/lib/analytics");
    trackReferralSource();

    expect(calls).toHaveLength(1);
    const [, name, params] = calls[0] as [string, string, Record<string, unknown>];
    expect(name).toBe("outbound_click");
    expect(params.referral_kind).toBe("directory");
    expect(params.source).toBe("reddit");
  });

  it("does not fire any event when referrer/URL match nothing", async () => {
    vi.stubGlobal("document", { referrer: "https://some-random-blog.example/" });
    const calls: unknown[][] = [];
    fakeWindow.gtag = (...args: unknown[]) => {
      calls.push(args);
    };

    const { trackReferralSource } = await import("@/lib/analytics");
    trackReferralSource();

    expect(calls).toHaveLength(0);
  });

  it("is idempotent per session — a second call does not re-fire", async () => {
    vi.stubGlobal("document", { referrer: "https://chatgpt.com/" });
    const calls: unknown[][] = [];
    fakeWindow.gtag = (...args: unknown[]) => {
      calls.push(args);
    };

    const { trackReferralSource } = await import("@/lib/analytics");
    trackReferralSource();
    trackReferralSource();

    expect(calls).toHaveLength(1);
  });
});
