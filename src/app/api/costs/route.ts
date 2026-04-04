import { NextRequest, NextResponse } from "next/server";
import { getCosts } from "@/lib/services/cost-service";
import { successResponse, errorResponse } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants/categories";
import { STATES } from "@/lib/constants/states";
import { VALID_COMPLEXITIES } from "@/lib/constants/costs";
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
    const category = searchParams.get("category");
    const state = searchParams.get("state");
    const complexity = searchParams.get("complexity");

    // Validation
    if (category && !CATEGORIES.some((c) => c.slug === category)) {
      return NextResponse.json(
        errorResponse(`Invalid category: ${sanitizeForErrorMessage(category)}`),
        { status: 400, headers: { "X-RateLimit-Remaining": String(remaining) } },
      );
    }

    if (state && !STATES.some((s) => s.code === state.toUpperCase())) {
      return NextResponse.json(
        errorResponse(`Invalid state code: ${sanitizeForErrorMessage(state)}`),
        { status: 400, headers: { "X-RateLimit-Remaining": String(remaining) } },
      );
    }

    if (
      complexity &&
      !VALID_COMPLEXITIES.includes(
        complexity as (typeof VALID_COMPLEXITIES)[number],
      )
    ) {
      return NextResponse.json(
        errorResponse(
          `Invalid complexity. Must be one of: ${VALID_COMPLEXITIES.join(", ")}`,
        ),
        { status: 400, headers: { "X-RateLimit-Remaining": String(remaining) } },
      );
    }

    const costs = await getCosts({
      category: category ?? undefined,
      stateCode: state?.toUpperCase() ?? undefined,
      complexity: complexity ?? undefined,
    });

    return NextResponse.json(
      successResponse(costs, { count: costs.length }),
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
