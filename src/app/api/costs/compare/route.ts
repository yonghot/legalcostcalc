import { NextResponse } from "next/server";
import { compareCosts } from "@/lib/services/cost-service";
import { successResponse } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants/categories";
import { STATES } from "@/lib/constants/states";
import { sanitizeForErrorMessage } from "@/lib/utils/api-security";
import { withApiHandler, badRequest } from "@/lib/utils/api-handler";

export const GET = withApiHandler(async ({ request, rateLimitRemaining }) => {
  const { searchParams } = request.nextUrl;
  const statesParam = searchParams.get("states");
  const category = searchParams.get("category");

  if (!statesParam || !category) {
    return badRequest(
      "Both 'states' and 'category' parameters are required",
      rateLimitRemaining,
    );
  }

  const stateCodes = statesParam.split(",").map((s) => s.trim().toUpperCase());

  if (stateCodes.length !== 2) {
    return badRequest(
      "Exactly 2 state codes are required (comma-separated)",
      rateLimitRemaining,
    );
  }

  for (const code of stateCodes) {
    if (!STATES.some((s) => s.code === code)) {
      return badRequest(
        `Invalid state code: ${sanitizeForErrorMessage(code)}`,
        rateLimitRemaining,
      );
    }
  }

  if (!CATEGORIES.some((c) => c.slug === category)) {
    return badRequest(
      `Invalid category: ${sanitizeForErrorMessage(category)}`,
      rateLimitRemaining,
    );
  }

  const result = await compareCosts(stateCodes, category);

  return NextResponse.json(successResponse(result));
});
