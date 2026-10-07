import { NextResponse } from "next/server";
import { PUBLISHER } from "@/lib/constants/publisher";

const FORWARD_TIMEOUT_MS = 5_000;

export const DELIVERY_FAILED_MESSAGE = `We could not deliver your message right now. Please email ${PUBLISHER.email} instead.`;

export async function forwardToCollector(record: Record<string, unknown>): Promise<boolean> {
  const endpoint = process.env.FEEDBACK_ENDPOINT?.trim();
  if (!endpoint) return false;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
      signal: AbortSignal.timeout(FORWARD_TIMEOUT_MS),
    });
    if (!response.ok) console.error(`[delivery] collector answered HTTP ${response.status}`);
    return response.ok;
  } catch (err) {
    console.error("[delivery] collector request failed:", err instanceof Error ? err.name : "unknown error");
    return false;
  }
}

export function deliveryResponse(delivered: boolean): NextResponse {
  const headers = { "Cache-Control": "no-store" };
  if (delivered) return NextResponse.json({ ok: true }, { status: 200, headers });
  return NextResponse.json({ ok: false, error: DELIVERY_FAILED_MESSAGE }, { status: 503, headers });
}
