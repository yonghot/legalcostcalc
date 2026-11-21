import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import "./helpers/render";
import { renderPage } from "./helpers/render";
import PrivacyPage from "@/app/privacy/page";
import { ConsentNotice, moveFocusInto } from "@/components/consent/cookie-consent-banner";
import {
  CMP_WAIT_MS,
  CONSENT_KEY,
  DECLINE_ONLY_EVENT,
  answerNotice,
  initConsent,
  openManageConsent,
  planInitialConsent,
  subscribeConsentNotice,
  type NoticeMode,
} from "@/components/consent/consent-config";

const UNKNOWN = ["XX", ""];
const EEA = ["DE", "GB", "CH", "FR"];
const SIGNALS = ["ad_personalization", "ad_storage", "ad_user_data", "analytics_storage"];

interface FakeFc {
  callbackQueue?: Array<() => void>;
  showRevocationMessage?: () => void;
}

function loadedFc(show: () => void): FakeFc {
  return { showRevocationMessage: show, callbackQueue: { push: (fn: () => void) => fn() } as unknown as Array<() => void> };
}

function visit(country: string, googlefc?: FakeFc, loaderOnPage?: boolean) {
  const gtagCalls: unknown[][] = [];
  const store = new Map<string, string>();
  const win = new EventTarget() as EventTarget & Record<string, unknown>;
  win.dataLayer = [];
  win.gtag = (...args: unknown[]) => void gtagCalls.push(args);
  if (googlefc) win.googlefc = googlefc;
  vi.stubGlobal("window", win);
  vi.stubGlobal("document", {
    cookie: `other=1; visitor_country=${country}`,
    ...(loaderOnPage === undefined ? {} : { querySelector: () => (loaderOnPage ? {} : null) }),
  });
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  });
  const modes: NoticeMode[] = [];
  subscribeConsentNotice((mode) => modes.push(mode));
  return { gtagCalls, store, win, modes };
}

const updates = (calls: unknown[][]) => calls.filter((c) => c[0] === "consent" && c[1] === "update");
const grantedIn = (calls: unknown[][]) =>
  updates(calls).filter((c) => Object.values(c[2] as Record<string, string>).includes("granted"));

const noop = () => {};
const notice = (mode: NoticeMode) => renderToStaticMarkup(createElement(ConsentNotice, { mode, onChoose: noop }));
const visibleText = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&#x27;|&#39;|&apos;/g, "'").replace(/\s+/g, " ");

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("K14-c: Manage consent with an unknown country is never a dead control", () => {
  it("waits at most 2 seconds for Google's CMP", () => {
    expect(CMP_WAIT_MS).toBeLessThanOrEqual(2000);
    expect(CMP_WAIT_MS).toBeGreaterThan(0);
  });

  it.each(UNKNOWN)("country %j, googlefc absent: our decline-only notice opens within the wait", (country) => {
    const { modes } = visit(country);
    openManageConsent();
    expect(modes).toEqual([]);
    vi.advanceTimersByTime(CMP_WAIT_MS);
    expect(modes).toEqual(["decline-only"]);
  });

  it("the decline-only notice has one Decline button, a link to the privacy cookie section, and no Accept", () => {
    const html = notice("decline-only");
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).toContain(">Decline</button>");
    expect(visibleText(html)).not.toMatch(/accept/i);
    expect(html).toContain('href="/privacy#cookies"');
    expect(html).toContain('data-consent-mode="decline-only"');
  });

  it("the full notice keeps its Accept button", () => {
    const html = notice("full");
    expect(html.match(/<button/g)).toHaveLength(2);
    expect(html).toContain(">Accept</button>");
    expect(html).toContain(">Decline</button>");
  });

  it.each(UNKNOWN)("country %j, googlefc ready: the CMP opens and our notice never renders", (country) => {
    const show = vi.fn();
    const { modes } = visit(country, loadedFc(show));
    openManageConsent();
    expect(show).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(10 * CMP_WAIT_MS);
    expect(modes).toEqual([]);
  });

  it("googlefc becoming ready inside the wait: the CMP opens and our notice never renders", () => {
    const show = vi.fn();
    const { win, modes } = visit("XX");
    openManageConsent();
    vi.advanceTimersByTime(CMP_WAIT_MS - 1);
    const fc = win.googlefc as FakeFc;
    fc.showRevocationMessage = show;
    fc.callbackQueue!.forEach((fn) => fn());
    vi.advanceTimersByTime(10 * CMP_WAIT_MS);
    expect(show).toHaveBeenCalledTimes(1);
    expect(modes).toEqual([]);
  });

  it("a CMP that loads after our notice opened does not open a second consent UI", () => {
    const show = vi.fn();
    const { win, modes } = visit("XX");
    openManageConsent();
    vi.advanceTimersByTime(CMP_WAIT_MS);
    const fc = win.googlefc as FakeFc;
    fc.showRevocationMessage = show;
    fc.callbackQueue!.forEach((fn) => fn());
    expect(modes).toEqual(["decline-only"]);
    expect(show).not.toHaveBeenCalled();
  });

  it("a googlefc object that cannot show the revocation message still ends in our notice", () => {
    const { modes } = visit("XX", loadedFc(undefined as unknown as () => void));
    openManageConsent();
    vi.advanceTimersByTime(CMP_WAIT_MS);
    expect(modes).toEqual(["decline-only"]);
  });

  it.each(EEA)("%s: the link only queues the CMP; no fallback notice, no timer", (country) => {
    const { win, modes } = visit(country);
    openManageConsent();
    expect((win.googlefc as FakeFc).callbackQueue).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(10 * CMP_WAIT_MS);
    expect(modes).toEqual([]);
  });

  it.each(EEA)("%s on a page with no AdSense loader: the CMP can never arrive, so the link ends in our decline-only notice, which only denies", (country) => {
    const { gtagCalls, modes } = visit(country, undefined, false);
    initConsent();
    openManageConsent();
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(CMP_WAIT_MS);
    expect(modes).toEqual(["decline-only"]);
    expect(answerNotice("decline-only", "accepted")).toBe(false);
    expect(grantedIn(gtagCalls)).toEqual([]);
    expect(answerNotice("decline-only", "declined")).toBe(true);
    expect(grantedIn(gtagCalls)).toEqual([]);
    expect(updates(gtagCalls)).toHaveLength(1);
  });

  it.each(EEA)("%s on a page that carries the loader: still no fallback notice, no timer", (country) => {
    const { modes } = visit(country, undefined, true);
    openManageConsent();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(10 * CMP_WAIT_MS);
    expect(modes).toEqual([]);
  });

  it("a known non-EEA country still gets the full notice at once and never touches the CMP", () => {
    const { win, modes } = visit("US");
    openManageConsent();
    expect(modes).toEqual(["full"]);
    expect(win.googlefc).toBeUndefined();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("K14-c: the decline-only notice can only deny", () => {
  it("Decline sends one denied update for the four consent types and stores the choice", () => {
    const { gtagCalls, store } = visit("XX");
    initConsent();
    expect(answerNotice("decline-only", "declined")).toBe(true);
    const sent = updates(gtagCalls);
    expect(sent).toHaveLength(1);
    const payload = sent[0]![2] as Record<string, string>;
    expect(Object.keys(payload).sort()).toEqual(SIGNALS);
    expect(Object.values(payload).every((v) => v === "denied")).toBe(true);
    expect(store.get(CONSENT_KEY)).toBe("declined");
    expect(gtagCalls.filter((c) => c[0] !== "consent")).toEqual([]);
  });

  it("an Accept answered in decline-only mode is refused: nothing stored, nothing sent", () => {
    const { gtagCalls, store } = visit("XX");
    initConsent();
    expect(answerNotice("decline-only", "accepted")).toBe(false);
    expect(updates(gtagCalls)).toHaveLength(0);
    expect(store.size).toBe(0);
  });

  it.each(UNKNOWN)("country %j: even a forged accepted event never reaches a granted update", (country) => {
    const { gtagCalls, win } = visit(country);
    initConsent();
    win.dispatchEvent(new CustomEvent("consentChange", { detail: "accepted" }));
    expect(grantedIn(gtagCalls)).toHaveLength(0);
  });

  it("the whole path from the click to Decline sends a denied update and no granted one", () => {
    const { gtagCalls, modes } = visit("XX");
    initConsent();
    openManageConsent();
    vi.advanceTimersByTime(CMP_WAIT_MS);
    expect(modes).toEqual(["decline-only"]);
    expect(answerNotice(modes[0]!, "declined")).toBe(true);
    expect(updates(gtagCalls)).toHaveLength(1);
    expect(grantedIn(gtagCalls)).toHaveLength(0);
  });

  it("the decline is respected on the next visit", () => {
    expect(planInitialConsent("XX", "declined")).toBe("update-denied");
    expect(planInitialConsent("XX", null)).toBe("none");
  });

  it("answering with no notice open does nothing", () => {
    const { gtagCalls, store } = visit("XX");
    initConsent();
    expect(answerNotice(null, "declined")).toBe(false);
    expect(updates(gtagCalls)).toHaveLength(0);
    expect(store.size).toBe(0);
  });
});

describe("K14-c: wiring and the privacy policy", () => {
  const root = join(__dirname, "..", "..");

  it("the banner listens for the decline-only event through subscribeConsentNotice and answers through answerNotice", () => {
    const banner = readFileSync(join(root, "src/components/consent/cookie-consent-banner.tsx"), "utf8");
    expect(banner).toMatch(/useEffect\(\(\) => subscribeConsentNotice\(setMode\), \[\]\)/);
    expect(banner).toMatch(/answerNotice\(mode, value\)/);
    expect(banner).not.toMatch(/persistConsent/);
    expect(DECLINE_ONLY_EVENT).toBe("consentDeclineOnly");
  });

  it("the notice link lands on a real id in the privacy page and the policy describes the fallback", async () => {
    const html = await renderPage(PrivacyPage);
    const target = notice("decline-only").match(/href="\/privacy#([^"]+)"/)?.[1];
    expect(target).toBe("cookies");
    expect(html).toMatch(/<section id="cookies"/);
    const text = visibleText(html);
    expect(text).toMatch(/has not opened within two seconds[^.]*notice of ours[^.]*Decline button and no Accept button/i);
    expect(CMP_WAIT_MS).toBe(2000);
  });
});

describe("K14-c follow-up (r1-contract-F2): repeated clicks never stack a second consent UI", () => {
  const cmpLoads = (win: Record<string, unknown>, show: () => void) => {
    const fc = win.googlefc as FakeFc;
    fc.showRevocationMessage = show;
    fc.callbackQueue!.forEach((fn) => fn());
  };

  it("a second click inside the wait leaves no callback that opens the CMP over our notice", () => {
    const show = vi.fn();
    const { win, modes } = visit("XX");
    openManageConsent();
    vi.advanceTimersByTime(1000);
    openManageConsent();
    vi.advanceTimersByTime(CMP_WAIT_MS - 1000 + 100);
    expect(modes).toEqual(["decline-only"]);
    cmpLoads(win, show);
    expect(show).not.toHaveBeenCalled();
  });

  it("a click while our notice is open queues no CMP callback", () => {
    const show = vi.fn();
    const { win, modes } = visit("XX");
    openManageConsent();
    vi.advanceTimersByTime(CMP_WAIT_MS);
    vi.advanceTimersByTime(3000);
    openManageConsent();
    vi.advanceTimersByTime(10 * CMP_WAIT_MS);
    expect(modes).toEqual(["decline-only"]);
    cmpLoads(win, show);
    expect(show).not.toHaveBeenCalled();
  });

  it("after the notice is answered, a click reaches a CMP that has loaded since", () => {
    const show = vi.fn();
    const { win } = visit("XX");
    openManageConsent();
    vi.advanceTimersByTime(CMP_WAIT_MS);
    expect(answerNotice("decline-only", "declined")).toBe(true);
    cmpLoads(win, show);
    expect(show).not.toHaveBeenCalled();
    (win.googlefc as FakeFc).callbackQueue = { push: (fn: () => void) => fn() } as unknown as Array<() => void>;
    openManageConsent();
    expect(show).toHaveBeenCalledTimes(1);
  });

  it("an EEA visitor who clicks twice before the CMP loads gets one revocation message", () => {
    const show = vi.fn();
    const { win } = visit("DE");
    openManageConsent();
    openManageConsent();
    cmpLoads(win, show);
    expect(show).toHaveBeenCalledTimes(1);
  });
});

describe("K14-c follow-up (r1-contract-F1): the notice takes focus and gives it back", () => {
  it("the dialog is focusable and its message is its accessible description", () => {
    for (const mode of ["decline-only", "full"] as const) {
      const html = notice(mode);
      expect(html).toContain('tabindex="-1"');
      const id = html.match(/aria-describedby="([^"]+)"/)?.[1];
      expect(id).toBeTruthy();
      expect(html).toContain(`<p id="${id}"`);
    }
  });

  it("moveFocusInto focuses the dialog and its cleanup returns focus to the opener while it is still in the page", () => {
    const dialog = { focus: vi.fn() };
    const opener = { focus: vi.fn(), isConnected: true };
    const restore = moveFocusInto(dialog as unknown as HTMLElement, opener as unknown as HTMLElement);
    expect(dialog.focus).toHaveBeenCalledTimes(1);
    expect(opener.focus).not.toHaveBeenCalled();
    restore();
    expect(opener.focus).toHaveBeenCalledTimes(1);
  });

  it("an opener that left the page or never existed is not focused and nothing throws", () => {
    const dialog = { focus: vi.fn() };
    const gone = { focus: vi.fn(), isConnected: false };
    moveFocusInto(dialog as unknown as HTMLElement, gone as unknown as HTMLElement)();
    expect(gone.focus).not.toHaveBeenCalled();
    expect(() => moveFocusInto(null, null)()).not.toThrow();
  });

  it("the notice component runs moveFocusInto on mount", () => {
    const banner = readFileSync(join(__dirname, "..", "..", "src/components/consent/cookie-consent-banner.tsx"), "utf8");
    expect(banner).toMatch(/useEffect\(\(\) => moveFocusInto\(\w+\.current, document\.activeElement as HTMLElement \| null\), \[\]\)/);
  });
});
