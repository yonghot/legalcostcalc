import { NextRequest, NextResponse } from "next/server";
import { compareCosts } from "@/lib/services/cost-service";
import { successResponse, errorResponse } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants/categories";
import { STATES } from "@/lib/constants/states";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const statesParam = searchParams.get("states");
    const category = searchParams.get("category");

    if (!statesParam || !category) {
      return NextResponse.json(
        errorResponse("Both 'states' and 'category' parameters are required"),
        { status: 400 },
      );
    }

    const stateCodes = statesParam.split(",").map((s) => s.trim().toUpperCase());

    if (stateCodes.length !== 2) {
      return NextResponse.json(
        errorResponse("Exactly 2 state codes are required (comma-separated)"),
        { status: 400 },
      );
    }

    for (const code of stateCodes) {
      if (!STATES.some((s) => s.code === code)) {
        return NextResponse.json(
          errorResponse(`Invalid state code: ${code}`),
          { status: 400 },
        );
      }
    }

    if (!CATEGORIES.some((c) => c.slug === category)) {
      return NextResponse.json(
        errorResponse(`Invalid category: ${category}`),
        { status: 400 },
      );
    }

    const result = await compareCosts(stateCodes, category);

    return NextResponse.json(successResponse(result));
  } catch (error) {
    console.error("GET /api/costs/compare error:", error);
    return NextResponse.json(
      errorResponse("Internal server error"),
      { status: 500 },
    );
  }
}
