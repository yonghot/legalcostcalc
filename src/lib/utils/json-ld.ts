/**
 * Safely serializes a JSON-LD object for injection into a <script> tag.
 * Escapes `<` to `\u003c` to prevent breaking out of the script context
 * (defense-in-depth against JSON-LD injection).
 */
export function safeJsonLd(obj: Record<string, unknown>): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}
