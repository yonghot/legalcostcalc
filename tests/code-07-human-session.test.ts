/**
 * tests/code-07-human-session.test.ts — CODE-07 (부속W §5).
 *
 * Pins the two properties that make `human_session` worth trusting in GA4:
 *   1. It does NOT fire for a load-and-leave session (the shape of the
 *      data-center traffic that currently dominates these reports).
 *   2. It fires exactly once per session, on the first qualifying engagement
 *      (25% scroll depth or a real input interaction) — never twice, and never
 *      on a timer, because an idle bot holding a page open would qualify.
 *
 * The no-cloaking half of CODE-07's acceptance (ad modules never read the user
 * agent) is asserted in tests/ad-density.test.ts.
 *
 * This suite runs in the repo's `node` vitest environment against a hand-rolled
 * DOM stub rather than pulling in jsdom: the signal touches only four DOM
 * surfaces (scroll geometry, two event targets, sessionStorage), the stub makes
 * the contract explicit, and it keeps the dependency list unchanged.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initHumanSessionSignal } from "@/lib/analytics";

type GtagCall = [string, string, Record<string, unknown>?];
type Listener = (event: unknown) => void;

/** Minimal EventTarget: records listeners so removal can be asserted too. */
function makeTarget() {
  const listeners = new Map<string, Set<Listener>>();
  return {
    listeners,
    addEventListener(type: string, fn: Listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(fn);
    },
    removeEventListener(type: string, fn: Listener) {
      listeners.get(type)?.delete(fn);
    },
    dispatch(type: string) {
      for (const fn of [...(listeners.get(type) ?? [])]) fn({ type });
    },
    countFor(type: string) {
      return listeners.get(type)?.size ?? 0;
    },
  };
}

function makeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
  };
}

describe("CODE-07 — human_session engagement signal", () => {
  let calls: GtagCall[];
  let win: ReturnType<typeof makeTarget> & Record<string, unknown>;
  let doc: ReturnType<typeof makeTarget> & Record<string, unknown>;
  const storage = makeStorage();

  beforeEach(() => {
    calls = [];
    storage.clear();

    win = Object.assign(makeTarget(), {
      innerHeight: 800,
      scrollY: 0,
      sessionStorage: storage,
      localStorage: makeStorage(),
      location: { search: "", href: "https://legalcostcalc.co/california/divorce-cost" },
      gtag: (...args: GtagCall) => void calls.push(args),
    }) as ReturnType<typeof makeTarget> & Record<string, unknown>;

    // 4,000px of content in an 800px viewport => 3,200px scrollable.
    doc = Object.assign(makeTarget(), {
      documentElement: { scrollHeight: 4000 },
      referrer: "",
    }) as ReturnType<typeof makeTarget> & Record<string, unknown>;

    (globalThis as Record<string, unknown>).window = win;
    (globalThis as Record<string, unknown>).document = doc;
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).window;
    delete (globalThis as Record<string, unknown>).document;
  });

  const humanSessions = () => calls.filter((c) => c[0] === "event" && c[1] === "human_session");

  function scrollTo(y: number) {
    win.scrollY = y;
    win.dispatch("scroll");
  }

  it("does not fire on a load-and-leave session", () => {
    initHumanSessionSignal();
    expect(humanSessions()).toHaveLength(0);
  });

  it("does not fire on a shallow scroll below the 25% threshold", () => {
    initHumanSessionSignal();
    scrollTo(500); // 500 / 3200 = 15.6%
    expect(humanSessions()).toHaveLength(0);
  });

  it("fires once at 25% scroll depth, tagged with the trigger", () => {
    initHumanSessionSignal();
    scrollTo(900); // 900 / 3200 = 28%
    const fired = humanSessions();
    expect(fired).toHaveLength(1);
    expect(fired[0]![2]).toMatchObject({ engagement_trigger: "scroll_depth" });
  });

  it("fires on a real input interaction even without scrolling", () => {
    initHumanSessionSignal();
    doc.dispatch("pointerdown");
    const fired = humanSessions();
    expect(fired).toHaveLength(1);
    expect(fired[0]![2]).toMatchObject({ engagement_trigger: "interaction" });
  });

  it("never fires twice in one session", () => {
    initHumanSessionSignal();
    scrollTo(900);
    scrollTo(2000);
    doc.dispatch("keydown");
    expect(humanSessions()).toHaveLength(1);
  });

  it("detaches its listeners after firing (no idle work, no timers)", () => {
    initHumanSessionSignal();
    expect(win.countFor("scroll")).toBe(1);
    scrollTo(900);
    expect(win.countFor("scroll")).toBe(0);
    expect(doc.countFor("keydown")).toBe(0);
    expect(doc.countFor("pointerdown")).toBe(0);
  });

  it("stays quiet on a re-mount within the same session", () => {
    initHumanSessionSignal();
    scrollTo(900);
    expect(humanSessions()).toHaveLength(1);
    initHumanSessionSignal(); // e.g. a soft navigation re-running the effect
    scrollTo(3000);
    expect(humanSessions()).toHaveLength(1);
  });

  it("does not fire from scroll on a page shorter than the viewport", () => {
    (doc.documentElement as { scrollHeight: number }).scrollHeight = 600;
    initHumanSessionSignal();
    scrollTo(0);
    scrollTo(100);
    expect(humanSessions()).toHaveLength(0);
  });

  it("is inert when GA has not loaded (no throw, nothing queued)", () => {
    delete win.gtag;
    expect(() => {
      initHumanSessionSignal();
      scrollTo(900);
    }).not.toThrow();
    expect(calls).toHaveLength(0);
  });

  it("is inert on the server (no window)", () => {
    delete (globalThis as Record<string, unknown>).window;
    expect(() => initHumanSessionSignal()).not.toThrow();
    expect(calls).toHaveLength(0);
  });
});
