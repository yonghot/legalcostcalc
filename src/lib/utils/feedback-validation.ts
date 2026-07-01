/**
 * Pure validation logic for the /api/feedback route.
 * Extracted so unit tests can exercise validation without an HTTP runtime.
 */

export const FEEDBACK_TYPES = ["bug", "feature", "other"] as const;
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_EMAIL_LENGTH = 254;
export const MAX_PAGE_URL_LENGTH = 2048;
export const MAX_SITE_LENGTH = 200;

/** Conservative email shape check — same regex used across the codebase. */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FeedbackValidationResult =
  | { ok: true; type: FeedbackType; message: string; email: string | null; pageUrl: string | null; site: string | null }
  | { ok: false; error: string };

/** Extract a trimmed string field from an unknown JSON body, or undefined. */
export function getField(body: unknown, key: string): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const val = (body as Record<string, unknown>)[key];
  return typeof val === "string" ? val.trim() : undefined;
}

/** Validate the parsed feedback body. Returns typed result. */
export function validateFeedbackBody(body: unknown): FeedbackValidationResult {
  // --- type ---
  const rawType = getField(body, "type");
  if (!rawType || !(FEEDBACK_TYPES as readonly string[]).includes(rawType)) {
    return {
      ok: false,
      error: `"type" must be one of: ${FEEDBACK_TYPES.join(", ")}.`,
    };
  }
  const type = rawType as FeedbackType;

  // --- message ---
  const message = getField(body, "message");
  if (!message || message.length === 0) {
    return { ok: false, error: "Message is required." };
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return {
      ok: false,
      error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`,
    };
  }

  // --- email (optional) ---
  const rawEmail = getField(body, "email");
  let email: string | null = null;
  if (rawEmail && rawEmail.length > 0) {
    if (rawEmail.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(rawEmail)) {
      return { ok: false, error: "Please enter a valid email address." };
    }
    email = rawEmail;
  }

  // --- pageUrl (optional informational, capped) ---
  const rawPageUrl = getField(body, "pageUrl");
  const pageUrl =
    typeof rawPageUrl === "string" ? rawPageUrl.slice(0, MAX_PAGE_URL_LENGTH) : null;

  // --- site (optional informational, capped) ---
  const rawSite = getField(body, "site");
  const site =
    typeof rawSite === "string" ? rawSite.slice(0, MAX_SITE_LENGTH) : null;

  return { ok: true, type, message, email, pageUrl, site };
}
