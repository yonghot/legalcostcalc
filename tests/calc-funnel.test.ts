/**
 * Tests for src/lib/utils/calc-funnel.ts
 *
 * Covers the shared guard logic backing T03 (calculator_complete):
 *   - never fires when hasUserInteracted is false (default/SSR render guard)
 *   - fires on first user-driven completion (no prior lastFiredAt)
 *   - does NOT fire again within the 2s debounce window
 *   - fires again once the debounce window has elapsed
 *   - boundary: exactly at the debounce threshold fires (>=, not >)
 */

import { describe, it, expect } from "vitest";
import {
  shouldFireCalculatorComplete,
  CALCULATOR_COMPLETE_DEBOUNCE_MS,
} from "@/lib/utils/calc-funnel";

describe("shouldFireCalculatorComplete", () => {
  it("never fires when hasUserInteracted is false, regardless of timing", () => {
    expect(shouldFireCalculatorComplete(false, undefined, 0)).toBe(false);
    expect(shouldFireCalculatorComplete(false, 0, 100_000)).toBe(false);
    expect(shouldFireCalculatorComplete(false, 1000, 1000)).toBe(false);
  });

  it("fires on first user-driven completion with no prior lastFiredAt", () => {
    // now is chosen well past the debounce window from epoch 0, since
    // lastFiredAt defaults to 0 when undefined.
    const now = CALCULATOR_COMPLETE_DEBOUNCE_MS + 1_000;
    expect(shouldFireCalculatorComplete(true, undefined, now)).toBe(true);
    expect(shouldFireCalculatorComplete(true, 0, now)).toBe(true);
  });

  it("does not fire again within the debounce window", () => {
    const lastFiredAt = 10_000;
    const now = lastFiredAt + CALCULATOR_COMPLETE_DEBOUNCE_MS - 1;
    expect(shouldFireCalculatorComplete(true, lastFiredAt, now)).toBe(false);
  });

  it("fires again once the debounce window has elapsed", () => {
    const lastFiredAt = 10_000;
    const now = lastFiredAt + CALCULATOR_COMPLETE_DEBOUNCE_MS + 1;
    expect(shouldFireCalculatorComplete(true, lastFiredAt, now)).toBe(true);
  });

  it("fires exactly at the debounce boundary (>=, not >)", () => {
    const lastFiredAt = 10_000;
    const now = lastFiredAt + CALCULATOR_COMPLETE_DEBOUNCE_MS;
    expect(shouldFireCalculatorComplete(true, lastFiredAt, now)).toBe(true);
  });

  it("defaults `now` to Date.now() when omitted", () => {
    const before = Date.now();
    const result = shouldFireCalculatorComplete(true, undefined);
    const after = Date.now();
    expect(result).toBe(true);
    expect(before).toBeLessThanOrEqual(after);
  });
});
