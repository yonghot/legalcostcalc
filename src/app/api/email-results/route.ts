import { NextResponse } from "next/server";
import { z } from "zod";
import { getClientIp, rateLimitGuard } from "@/lib/utils/api-security";
import { isSafeUrl } from "@/lib/utils/sanitize";

/**
 * T17 — env-gated "Email my results" transactional endpoint. Distinct from
 * the EXISTING /api/subscribe route (src/components/shared/email-capture.tsx,
 * a marketing "get the 2026 report" capture gated by NEXT_PUBLIC_EMAIL_CAPTURE
 * + NEXT_PUBLIC_POSTAL_ADDRESS) — this route is transactional-only (the email
 * body contains ONLY the result permalink, zero promo lines), so it stays
 * inside the CAN-SPAM/CASL transactional exemption, plus a SEPARATE unchecked
 * marketing-opt-in checkbox that (when checked) tags a marketing-consent flag
 * forwarded to the ESP alongside the transactional send.
 *
 * Behaviour:
 *  - Absent unless BOTH server-only EMAIL_CAPTURE_ENDPOINT and
 *    NEXT_PUBLIC_EMAIL_CAPTURE_ENABLED=1 are set (mirrors the client-side
 *    gate in email-my-results.tsx — belt-and-suspenders: the form is also
 *    absent from the DOM when unset, so this route path is normally
 *    unreachable, but the server independently 404s to avoid depending on
 *    the client for the security boundary).
 *  - Zod-validated body: { email, calcType, shareUrl, marketingOptIn }.
 *  - Per-IP rate-limited (reuses the project's existing in-memory guard).
 *  - Forwards { email, calcType, shareUrl, marketingOptIn } to
 *    EMAIL_CAPTURE_ENDPOINT (the ESP's API, owner-provisioned per O11) via a
 *    server-side POST — EMAIL_CAPTURE_API_KEY (if set) is sent as a bearer
 *    token, never exposed to the client.
 *  - shareUrl must be a same-origin-shaped safe URL (isSafeUrl) — never
 *    forwards an arbitrary attacker-supplied external URL to the ESP call.
 *
 * Never requires email to view results (this route is only reachable from
 * an opt-in "Email my results" form below an already-rendered result); never
 * stores emails in this app's own DB — forwards to the ESP only.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_CALC_TYPE_LENGTH = 100;

const EmailResultsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  calcType: z.string().trim().min(1).max(MAX_CALC_TYPE_LENGTH),
  shareUrl: z.string().trim().min(1).max(2048),
  marketingOptIn: z.boolean().optional().default(false),
});

function isEnabled(): boolean {
  // Repo guardrail: the existing NEXT_PUBLIC_POSTAL_ADDRESS CAN-SPAM gate
  // from the compliance workstream is reused here too — all three must be
  // set (server endpoint, public enable flag, AND the postal address a
  // commercial email-collection form is required to display).
  return (
    Boolean(process.env.EMAIL_CAPTURE_ENDPOINT) &&
    process.env.NEXT_PUBLIC_EMAIL_CAPTURE_ENABLED === "1" &&
    Boolean(process.env.NEXT_PUBLIC_POSTAL_ADDRESS?.trim())
  );
}

export async function POST(request: Request) {
  // Env-gated: absent unless both the server endpoint AND the public enable
  // flag are set — never partially live.
  if (!isEnabled()) {
    return NextResponse.json(
      { ok: false, error: "Not found." },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

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

  const parsed = EmailResultsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { email, calcType, shareUrl, marketingOptIn } = parsed.data;

  if (!isSafeUrl(shareUrl)) {
    return NextResponse.json(
      { ok: false, error: "Invalid share URL." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const endpoint = process.env.EMAIL_CAPTURE_ENDPOINT!;
  const apiKey = process.env.EMAIL_CAPTURE_API_KEY;

  try {
    const espResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        email,
        calc_type: calcType,
        share_url: shareUrl,
        marketing_opt_in: marketingOptIn,
        // Transactional-only: the ESP template must render ONLY the
        // permalink, zero promotional copy, per the CAN-SPAM/CASL
        // transactional exemption this endpoint relies on.
        template: "transactional_result",
      }),
    });

    if (!espResponse.ok) {
      return NextResponse.json(
        { ok: false, error: "Failed to send email. Please try again later." },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to send email. Please try again later." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { ok: true },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}

// Exported for unit tests.
export { EmailResultsSchema, isEnabled };
