import { NextResponse } from "next/server";
import { successResponse } from "@/lib/types";

/**
 * Liveness/health probe for deploy smoke tests and uptime monitors.
 *
 * Intentionally dependency-free: it does NOT touch Supabase, the rate limiter,
 * or any downstream service, so it returns 200 even when those are degraded.
 * That is the correct semantics for a liveness check (is the app process up?),
 * distinct from a readiness check (are dependencies healthy?).
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export function GET() {
  return NextResponse.json(
    successResponse({
      status: "ok",
      service: "legalcostcalc",
      time: new Date().toISOString(),
    }),
    { headers: { "Cache-Control": "no-store" } },
  );
}
