import { NextRequest, NextResponse } from "next/server";
import { getAllStates } from "@/lib/services/state-service";
import { successResponse, errorResponse } from "@/lib/types";
import { getClientIp, rateLimitGuard } from "@/lib/utils/api-security";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const guard = rateLimitGuard(ip);
  if (!guard.allowed) return guard.response;

  try {
    const states = await getAllStates();
    return NextResponse.json(
      successResponse(states, { count: states.length }),
      { headers: { "X-RateLimit-Remaining": String(guard.remaining) } },
    );
  } catch (error) {
    void error;
    return NextResponse.json(
      errorResponse("Internal server error"),
      { status: 500 },
    );
  }
}
