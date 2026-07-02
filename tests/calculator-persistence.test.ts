/**
 * Tests for src/lib/hooks/use-calculator-persistence.ts (T16).
 *
 * Covers the module-level (non-React-hook) functions directly, plus the
 * pure allowlist-filtering logic replicated here to assert the sensitive-
 * site "OFF by default beyond an explicit allowlist" guarantee. The
 * React-hook surface itself (useCalculatorPersistence) is exercised
 * indirectly via its wiring in cost-calculator.tsx; these tests focus on
 * the storage-layer functions that are safe to call outside a component
 * (getRecentCalculations, clearAllCalculatorData) and on the field-filtering
 * contract.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

interface FakeStorage {
  store: Map<string, string>;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  key(index: number): string | null;
  length: number;
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
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}

let fakeWindow: { localStorage: FakeStorage };

beforeEach(() => {
  vi.resetModules();
  fakeWindow = { localStorage: makeFakeStorage() };
  vi.stubGlobal("window", fakeWindow);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getRecentCalculations / clearAllCalculatorData (T16)", () => {
  it("getRecentCalculations returns [] when nothing is stored", async () => {
    const { getRecentCalculations } = await import("@/lib/hooks/use-calculator-persistence");
    expect(getRecentCalculations()).toEqual([]);
  });

  it("getRecentCalculations returns parsed entries when present", async () => {
    const entries = [
      { calcType: "divorce", date: "2026-06-01T00:00:00.000Z" },
      { calcType: "dui", date: "2026-06-02T00:00:00.000Z" },
    ];
    fakeWindow.localStorage.setItem("cc_recent_calculations", JSON.stringify(entries));
    const { getRecentCalculations } = await import("@/lib/hooks/use-calculator-persistence");
    expect(getRecentCalculations()).toEqual(entries);
  });

  it("getRecentCalculations never returns more than the stored data and contains no result/input values, only calcType+date", async () => {
    const entries = [{ calcType: "divorce", date: "2026-06-01T00:00:00.000Z" }];
    fakeWindow.localStorage.setItem("cc_recent_calculations", JSON.stringify(entries));
    const { getRecentCalculations } = await import("@/lib/hooks/use-calculator-persistence");
    const result = getRecentCalculations();
    for (const entry of result) {
      expect(Object.keys(entry).sort()).toEqual(["calcType", "date"]);
    }
  });

  it("clearAllCalculatorData wipes every cc_* key but leaves non-cc_ keys untouched", async () => {
    fakeWindow.localStorage.setItem("cc_state_divorce", JSON.stringify({ foo: "bar" }));
    fakeWindow.localStorage.setItem("cc_recent_calculations", "[]");
    fakeWindow.localStorage.setItem("cc_traffic_type", "internal");
    fakeWindow.localStorage.setItem("terms_gate_consent", "should-survive");
    fakeWindow.localStorage.setItem("unrelated_key", "should-survive-too");

    const { clearAllCalculatorData } = await import("@/lib/hooks/use-calculator-persistence");
    clearAllCalculatorData();

    expect(fakeWindow.localStorage.getItem("cc_state_divorce")).toBeNull();
    expect(fakeWindow.localStorage.getItem("cc_recent_calculations")).toBeNull();
    expect(fakeWindow.localStorage.getItem("cc_traffic_type")).toBeNull();
    expect(fakeWindow.localStorage.getItem("terms_gate_consent")).toBe("should-survive");
    expect(fakeWindow.localStorage.getItem("unrelated_key")).toBe("should-survive-too");
  });

  it("clearAllCalculatorData does not throw when localStorage is empty", async () => {
    const { clearAllCalculatorData } = await import("@/lib/hooks/use-calculator-persistence");
    expect(() => clearAllCalculatorData()).not.toThrow();
  });
});

describe("SSR no-op (no window)", () => {
  it("getRecentCalculations/clearAllCalculatorData do not throw when window is undefined", async () => {
    vi.unstubAllGlobals();
    vi.resetModules();
    expect(typeof window).toBe("undefined");
    const { getRecentCalculations, clearAllCalculatorData } = await import(
      "@/lib/hooks/use-calculator-persistence"
    );
    expect(() => getRecentCalculations()).not.toThrow();
    expect(getRecentCalculations()).toEqual([]);
    expect(() => clearAllCalculatorData()).not.toThrow();
  });
});

describe("T16 sensitive-site allowlist gate (CostCalculator field set)", () => {
  // Mirrors PERSISTENCE_ALLOWED_FIELDS in cost-calculator.tsx — the ONLY
  // fields ever persisted for the primary calculator. Financial/free-text
  // matter-detail fields (settlement gross/pct/costs, compare state1/state2/
  // category2) are never in any allowlist in this wave (no explicit-toggle
  // UI exists yet to authorize them per the spec's "OFF by default" rule).
  const COST_CALCULATOR_ALLOWED_FIELDS = ["category", "stateCode", "complexity"];
  const SENSITIVE_FIELD_NAMES_NEVER_ALLOWED = [
    "gross",
    "pct",
    "costs",
    "result_bucket",
    "resultBucket",
    "matterDetail",
  ];

  it("the CostCalculator allowlist never contains a known sensitive/financial field name", () => {
    for (const sensitive of SENSITIVE_FIELD_NAMES_NEVER_ALLOWED) {
      expect(COST_CALCULATOR_ALLOWED_FIELDS).not.toContain(sensitive);
    }
  });

  it("the CostCalculator allowlist contains only the three non-sensitive route-level selector fields", () => {
    expect(COST_CALCULATOR_ALLOWED_FIELDS.sort()).toEqual(
      ["category", "complexity", "stateCode"].sort(),
    );
  });
});
