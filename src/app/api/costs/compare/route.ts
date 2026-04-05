import { NextRequest, NextResponse } from "next/server";
import { compareCosts } from "@/lib/services/cost-service";
import { successResponse, errorResponse } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants/categories";
import { STATES } from "@/lib/constants/states";
import { sanitizeForErrorMessage, getClientIp, rateLimitGuard } from "@/lib/utils/api-security";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const guard = rateLimitGuard(ip);
  if (!guard.allowed) return guard.response;

  try {
    const { searchParams } = request.nextUrl;
    const statesParam = searchParams.get("states");
    const category = searchParams.get("category");

    if (!statesParam || !category) {
      return NextResponse.json(
        errorResponse("Both 'states' and 'category' parameters are required"),
        { status: 400, headers: { "X-RateLimit-Remaining": String(guard.remaining) } },
      );
    }

    const stateCodes = statesParam.split(",").map((s) => s.trim().toUpperCase());

    if (stateCodes.length !== 2) {
      return NextResponse.json(
        errorResponse("Exactly 2 state codes are required (comma-separated)"),
        { status: 400, headers: { "X-RateLimit-Remaining": String(guard.remaining) } },
      );
    }

    for (const code of stateCodes) {
      if (!STATES.some((s) => s.code === code)) {
        return NextResponse.json(
          errorResponse(`Invalid state code: ${sanitizeForErrorMessage(code)}`),
          { status: 400, headers: { "X-RateLimit-Remaining": String(guard.remaining) } },
        );
      }
    }

    if (!CATEGORIES.some((c) => c.slug === category)) {
      return NextResponse.json(
        errorResponse(`Invalid category: ${sanitizeForErrorMessage(category)}`),
        { status: 400, headers: { "X-RateLimit-Remaining": String(guard.remaining) } },
      );
    }

    const result = await compareCosts(stateCodes, category);

    return NextResponse.json(
      successResponse(result),
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
