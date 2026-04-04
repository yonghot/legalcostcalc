import { NextRequest, NextResponse } from "next/server";
import { compareCosts } from "@/lib/services/cost-service";
import { successResponse, errorResponse } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants/categories";
import { STATES } from "@/lib/constants/states";
import { sanitizeForErrorMessage, checkRateLimit } from "@/lib/utils/api-security";

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
    const { searchParams } = request.nextUrl;
    const statesParam = searchParams.get("states");
    const category = searchParams.get("category");

    if (!statesParam || !category) {
      return NextResponse.json(
        errorResponse("Both 'states' and 'category' parameters are required"),
        { status: 400, headers: { "X-RateLimit-Remaining": String(remaining) } },
      );
    }

    const stateCodes = statesParam.split(",").map((s) => s.trim().toUpperCase());

    if (stateCodes.length !== 2) {
      return NextResponse.json(
        errorResponse("Exactly 2 state codes are required (comma-separated)"),
        { status: 400, headers: { "X-RateLimit-Remaining": String(remaining) } },
      );
    }

    for (const code of stateCodes) {
      if (!STATES.some((s) => s.code === code)) {
        return NextResponse.json(
          errorResponse(`Invalid state code: ${sanitizeForErrorMessage(code)}`),
          { status: 400, headers: { "X-RateLimit-Remaining": String(remaining) } },
        );
      }
    }

    if (!CATEGORIES.some((c) => c.slug === category)) {
      return NextResponse.json(
        errorResponse(`Invalid category: ${sanitizeForErrorMessage(category)}`),
        { status: 400, headers: { "X-RateLimit-Remaining": String(remaining) } },
      );
    }

    const result = await compareCosts(stateCodes, category);

    return NextResponse.json(
      successResponse(result),
      { headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
  } catch (error) {
    console.error("GET /api/costs/compare error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      errorResponse("Internal server error"),
      { status: 500 },
    );
  }
}
