import { NextRequest, NextResponse } from "next/server";
import { getCosts } from "@/lib/services/cost-service";
import { successResponse, errorResponse } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants/categories";
import { STATES } from "@/lib/constants/states";
import { VALID_COMPLEXITIES } from "@/lib/constants/costs";
import { sanitizeForErrorMessage, getClientIp, rateLimitGuard } from "@/lib/utils/api-security";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const guard = rateLimitGuard(ip);
  if (!guard.allowed) return guard.response;

  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category");
    const state = searchParams.get("state");
    const complexity = searchParams.get("complexity");

    if (category && !CATEGORIES.some((c) => c.slug === category)) {
      return NextResponse.json(
        errorResponse(`Invalid category: ${sanitizeForErrorMessage(category)}`),
        { status: 400, headers: { "X-RateLimit-Remaining": String(guard.remaining) } },
      );
    }

    if (state && !STATES.some((s) => s.code === state.toUpperCase())) {
      return NextResponse.json(
        errorResponse(`Invalid state code: ${sanitizeForErrorMessage(state)}`),
        { status: 400, headers: { "X-RateLimit-Remaining": String(guard.remaining) } },
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
        { status: 400, headers: { "X-RateLimit-Remaining": String(guard.remaining) } },
      );
    }

    const costs = await getCosts({
      category: category ?? undefined,
      stateCode: state?.toUpperCase() ?? undefined,
      complexity: complexity ?? undefined,
    });

    return NextResponse.json(
      successResponse(costs, { count: costs.length }),
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
