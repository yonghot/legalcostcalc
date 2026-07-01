/**
 * Validates that a URL string is a safe HTTPS-only URL.
 * Rejects javascript:, data:, vbscript:, http: (plain), and other protocols.
 * Enforcing HTTPS provides defense-in-depth for all externally rendered links.
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Returns the URL if safe (HTTPS), otherwise returns undefined.
 */
export function sanitizeUrl(url: string): string | undefined {
  return isSafeUrl(url) ? url : undefined;
}
