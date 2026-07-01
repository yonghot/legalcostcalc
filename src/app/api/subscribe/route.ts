import { NextResponse } from "next/server";
import { getClientIp, rateLimitGuard } from "@/lib/utils/api-security";

/**
 * Same-origin email-capture endpoint for the "Email my result" form
 * (src/components/shared/email-capture.tsx, which POSTs to "/api/subscribe").
 *
 * Behaviour:
 *  - Accepts POST JSON { email, context? }.
 *  - Validates the email (basic RFC-ish shape + length bound).
 *  - If NO storage / ESP is configured (no env), it returns 200 { ok: true } as a
 *    SAFE NO-OP — nothing is persisted or sent. This keeps the form working in
 *    dev/preview/production-before-wiring without leaking errors or secrets.
 *
 * TODO(owner): wire real storage / an email service provider here. Do this on the
 * server (this route), NOT in the client, so provider API keys stay secret.
 * Suggested approach when ready:
 *   1. Add a server-only env var, e.g. EMAIL_CAPTURE_STORAGE or an ESP API key
 *      (e.g. RESEND_API_KEY / MAILCHIMP_API_KEY) — server-side, never NEXT_PUBLIC_.
 *   2. Below the validation block, if that env is set, persist {email, context}
 *      (Supabase table) and/or forward to the ESP, then return { ok: true }.
 *   3. Keep the no-op fallback below so the form never errors when unconfigured.
 * Until then this endpoint deliberately stores nothing.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Conservative email shape check — not a full RFC 5322 parser, just enough to
// reject obviously-invalid input without false-rejecting normal addresses.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254; // RFC 5321 limit
const MAX_CONTEXT_LENGTH = 200;

export async function POST(request: Request) {
  // Reuse the project's in-memory per-IP rate limiter.
  const ip = getClientIp(request);
  const guard = rateLimitGuard(ip);
  if (!guard.allowed) return guard.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const email =
    typeof body === "object" && body !== null && "email" in body
      ? (body as { email?: unknown }).email
      : undefined;

  if (typeof email !== "string" || email.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "A valid email address is required." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  // `context` is optional metadata (e.g. "Divorce cost in California"); bound its length.
  const rawContext =
    typeof body === "object" && body !== null && "context" in body
      ? (body as { context?: unknown }).context
      : undefined;
  const context =
    typeof rawContext === "string" ? rawContext.slice(0, MAX_CONTEXT_LENGTH) : null;
  void context; // currently unused — see TODO(owner) above for where to persist/forward it.

  // ----- No storage / ESP configured: safe no-op success. -----
  // We intentionally do NOT persist or transmit anything here. See TODO(owner).
  return NextResponse.json(
    { ok: true },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
