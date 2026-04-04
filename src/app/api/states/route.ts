import { NextRequest, NextResponse } from "next/server";
import { getAllStates } from "@/lib/services/state-service";
import { successResponse, errorResponse } from "@/lib/types";
import { checkRateLimit } from "@/lib/utils/api-security";

export async function GET(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, remaining } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      errorResponse("Too many requests. Please try again later."),
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  try {
    const states = await getAllStates();
    return NextResponse.json(
      successResponse(states, { count: states.length }),
      { headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
  } catch (error) {
    void error; // error details not exposed to client
    return NextResponse.json(
      errorResponse("Internal server error"),
      { status: 500 },
    );
  }
}
