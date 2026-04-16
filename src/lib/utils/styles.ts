/**
 * Shared Tailwind class constants — prevents copy-paste drift
 * across 20+ interactive elements.
 */

/** Standard teal focus ring for light backgrounds */
export const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2";

/** Interactive card/link hover — teal border highlight + subtle shadow lift */
export const CARD_HOVER =
  "transition-all hover:border-teal-200 hover:shadow-sm";

/** Teal focus ring for dark (slate-900) backgrounds (footer) */
export const FOCUS_RING_DARK =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";
