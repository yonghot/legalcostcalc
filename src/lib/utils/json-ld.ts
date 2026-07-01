/**
 * Safely serializes a JSON-LD object for injection into a <script> tag.
 * Escapes `<`, `>`, and `&` to Unicode escape sequences to prevent
 * breaking out of the script context or parser confusion
 * (defense-in-depth against JSON-LD injection).
 *
 * This mirrors the escaping performed by Google's own JSON serializers
 * and Node's `JSON.stringify` "html safe" mode.
 */
export function safeJsonLd(obj: Record<string, unknown>): string {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
