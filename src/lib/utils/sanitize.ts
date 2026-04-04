/**
 * Validates that a URL string is a safe HTTP/HTTPS URL.
 * Rejects javascript:, data:, vbscript:, and other dangerous protocols.
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Returns the URL if safe, otherwise returns undefined.
 */
export function sanitizeUrl(url: string): string | undefined {
  return isSafeUrl(url) ? url : undefined;
}
