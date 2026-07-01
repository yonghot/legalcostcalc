import { NextResponse } from "next/server";
import { getClientIp, rateLimitGuard } from "@/lib/utils/api-security";
import { validateFeedbackBody } from "@/lib/utils/feedback-validation";

/**
 * Feedback collection endpoint — POSTed by the site-wide FeedbackWidget.
 *
 * Behaviour:
 *  - Accepts POST JSON { type, message, email?, pageUrl?, site? }.
 *  - Validates all fields (see validateFeedbackBody in lib/utils/feedback-validation.ts).
 *  - Returns 200 { ok: true } as a SAFE NO-OP when FEEDBACK_ENDPOINT is not set.
 *    Nothing is persisted or sent. This keeps the widget working in
 *    dev/preview/production-before-wiring without leaking errors or secrets.
 *  - When FEEDBACK_ENDPOINT is set, forwards a JSON record to that URL
 *    (server-side fetch, 5 s timeout, try/catch — on forward failure we still
 *    return 200 so the user is never blocked).
 *
 * TODO(owner): set FEEDBACK_ENDPOINT to a Google Apps Script web app URL,
 * a Formspree endpoint, or any collector that accepts POST JSON.
 * The env var must be server-only (never NEXT_PUBLIC_).
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Cap raw body size at 8 KB to prevent oversized payload attacks. */
const MAX_BODY_BYTES = 8_192;

export async function POST(request: Request) {
  // Rate limit per IP.
  const ip = getClientIp(request);
  const guard = rateLimitGuard(ip);
  if (!guard.allowed) return guard.response;

  // Body size cap — read as text first so we can enforce the limit cheaply.
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not read request body." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (rawBody.length > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, error: "Request body is too large." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Validate.
  const result = validateFeedbackBody(body);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Assemble the record (server-enriched).
  const record = {
    type: result.type,
    message: result.message,
    email: result.email,
    pageUrl: result.pageUrl,
    site: result.site,
    userAgent: request.headers.get("user-agent")?.slice(0, 512) ?? null,
    receivedAt: new Date().toISOString(),
  };

  // Forward to external collector if endpoint is configured.
  const endpoint = process.env.FEEDBACK_ENDPOINT;
  if (endpoint) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5_000);
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (err) {
      // Log server-side for observability but do NOT surface to the user.
      console.error("[feedback] Forward to FEEDBACK_ENDPOINT failed:", err);
    }
  }

  return NextResponse.json(
    { ok: true },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
