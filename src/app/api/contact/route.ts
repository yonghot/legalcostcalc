import { NextResponse } from "next/server";
import { getClientIp, rateLimitGuard } from "@/lib/utils/api-security";

/**
 * Same-origin contact form endpoint (src/app/contact/page.tsx).
 *
 * Behaviour:
 *  - Accepts POST JSON { name, email, message }.
 *  - Validates all three fields (required, length caps, email shape).
 *  - Returns 200 { ok: true } as a SAFE NO-OP — nothing is persisted or sent.
 *    This lets the form work in dev/preview/production-before-wiring without
 *    leaking errors or secrets.
 *
 * TODO(owner): wire a real delivery mechanism here (server-side only):
 *   1. Add a server-only env var, e.g. RESEND_API_KEY or SMTP credentials —
 *      never NEXT_PUBLIC_.
 *   2. Below the validation block, if that env is set, send the message via
 *      your chosen ESP, then return { ok: true }.
 *   3. Keep the no-op fallback below so the form never errors when unconfigured.
 * Until then this endpoint deliberately stores nothing.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Email shape — same conservative regex used across the codebase.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254; // RFC 5321 limit
const MAX_NAME_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 2000;

/** Extract a trimmed string field from an unknown JSON body, or undefined. */
function getField(body: unknown, key: string): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const val = (body as Record<string, unknown>)[key];
  return typeof val === "string" ? val.trim() : undefined;
}

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

  const name = getField(body, "name");
  const email = getField(body, "email");
  const message = getField(body, "message");

  // --- name ---
  if (!name || name.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Name is required." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (name.length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      { ok: false, error: `Name must be ${MAX_NAME_LENGTH} characters or fewer.` },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  // --- email ---
  if (!email || email.length === 0) {
    return NextResponse.json(
      { ok: false, error: "A valid email address is required." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "A valid email address is required." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  // --- message ---
  if (!message || message.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Message is required." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { ok: false, error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.` },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  // ----- No delivery mechanism configured: safe no-op success. -----
  // See TODO(owner) above for how to wire a real ESP here.
  return NextResponse.json(
    { ok: true },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}

// Export constants for unit tests.
export { MAX_NAME_LENGTH, MAX_EMAIL_LENGTH, MAX_MESSAGE_LENGTH, EMAIL_RE, getField };
