import { NextResponse } from "next/server";
import { getClientIp, rateLimitGuard } from "@/lib/utils/api-security";
import { EMAIL_RE, MAX_EMAIL_LENGTH, MAX_NAME_LENGTH, MAX_MESSAGE_LENGTH, getField } from "@/lib/utils/feedback-validation";
import { deliveryResponse, forwardToCollector } from "@/lib/utils/message-delivery";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  const delivered = await forwardToCollector({
    type: "contact",
    name,
    email,
    message,
    site: "legalcostcalc.co",
    userAgent: request.headers.get("user-agent")?.slice(0, 512) ?? null,
    receivedAt: new Date().toISOString(),
  });
  return deliveryResponse(delivered);
}
