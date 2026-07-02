/**
 * Shared guard logic for the calculator funnel (T03: calc_input_start /
 * calculator_complete). Pure functions so the debounce + hasUserInteracted
 * rules are independently unit-testable without a DOM.
 *
 * CRITICAL invariant: calculator_complete must NEVER fire on the initial
 * SSR/default render or any automatic lifecycle — only after a real
 * user-driven input change (hasUserInteracted === true), and at most once
 * per DEBOUNCE_MS per calc_type.
 */

export const CALCULATOR_COMPLETE_DEBOUNCE_MS = 2000;

/**
 * Decides whether a calculator_complete event should fire right now.
 *
 * @param hasUserInteracted - true only once a real user input change has
 *   occurred (never true on default/SSR render).
 * @param lastFiredAt - epoch ms the event last fired for this calc_type, or
 *   undefined/0 if it has never fired.
 * @param now - epoch ms "now" (injectable for deterministic tests).
 */
export function shouldFireCalculatorComplete(
  hasUserInteracted: boolean,
  lastFiredAt: number | undefined,
  now: number = Date.now(),
): boolean {
  if (!hasUserInteracted) return false;
  const last = lastFiredAt ?? 0;
  return now - last >= CALCULATOR_COMPLETE_DEBOUNCE_MS;
}
