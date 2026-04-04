import { NextRequest, NextResponse } from "next/server";
import { getCosts } from "@/lib/services/cost-service";
import { successResponse, errorResponse } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants/categories";
import { STATES } from "@/lib/constants/states";

const VALID_COMPLEXITIES = ["simple", "moderate", "complex"];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category");
    const state = searchParams.get("state");
    const complexity = searchParams.get("complexity");

    // Validation
    if (category && !CATEGORIES.some((c) => c.slug === category)) {
      return NextResponse.json(
        errorResponse(`Invalid category: ${category}`),
        { status: 400 },
      );
    }

    if (state && !STATES.some((s) => s.code === state.toUpperCase())) {
      return NextResponse.json(
        errorResponse(`Invalid state code: ${state}`),
        { status: 400 },
      );
    }

    if (complexity && !VALID_COMPLEXITIES.includes(complexity)) {
      return NextResponse.json(
        errorResponse(
          `Invalid complexity: ${complexity}. Must be one of: ${VALID_COMPLEXITIES.join(", ")}`,
        ),
        { status: 400 },
      );
    }

    const costs = await getCosts({
      category: category ?? undefined,
      stateCode: state?.toUpperCase() ?? undefined,
      complexity: complexity ?? undefined,
    });

    return NextResponse.json(
      successResponse(costs, { count: costs.length }),
    );
  } catch (error) {
    console.error("GET /api/costs error:", error);
    return NextResponse.json(
      errorResponse("Internal server error"),
      { status: 500 },
    );
  }
}
