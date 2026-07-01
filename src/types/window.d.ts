/**
 * Global Window augmentations for third-party analytics scripts.
 *
 * These are declared here so TypeScript knows about the properties that
 * Google Analytics (gtag.js) writes onto `window` at runtime.
 */

interface Window {
  /** gtag.js data layer array. Created by initAnalytics() before GA loads. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataLayer: any[];
  /**
   * Guard flag set by initAnalytics() to prevent double-initialisation of
   * the gtag bootstrap code across repeated calls (e.g. banner re-fires).
   */
  __gtagInitialised?: boolean;
  /**
   * gtag() command function. Defined either by the inline Consent Mode v2
   * defaults script in <head> or by the gtag bootstrap in ConsentedAnalytics.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gtag?: (...args: any[]) => void;
}
