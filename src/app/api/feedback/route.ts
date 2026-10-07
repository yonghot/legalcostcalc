import { NextResponse } from "next/server";
import { getClientIp, rateLimitGuard } from "@/lib/utils/api-security";
import { validateFeedbackBody } from "@/lib/utils/feedback-validation";
import { deliveryResponse, forwardToCollector } from "@/lib/utils/message-delivery";

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

  return deliveryResponse(await forwardToCollector(record));
}
