import { NextResponse } from "next/server";
import { getCosts } from "@/lib/services/cost-service";
import { successResponse } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants/categories";
import { STATES } from "@/lib/constants/states";
import { VALID_COMPLEXITIES } from "@/lib/constants/costs";
import { sanitizeForErrorMessage } from "@/lib/utils/api-security";
import { withApiHandler, badRequest } from "@/lib/utils/api-handler";

export const GET = withApiHandler(async ({ request, rateLimitRemaining }) => {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category");
  const state = searchParams.get("state");
  const complexity = searchParams.get("complexity");

  if (category && !CATEGORIES.some((c) => c.slug === category)) {
    return badRequest(
      `Invalid category: ${sanitizeForErrorMessage(category)}`,
      rateLimitRemaining,
    );
  }

  if (state && !STATES.some((s) => s.code === state.toUpperCase())) {
    return badRequest(
      `Invalid state code: ${sanitizeForErrorMessage(state)}`,
      rateLimitRemaining,
    );
  }

  if (
    complexity &&
    !VALID_COMPLEXITIES.includes(
      complexity as (typeof VALID_COMPLEXITIES)[number],
    )
  ) {
    return badRequest(
      `Invalid complexity. Must be one of: ${VALID_COMPLEXITIES.join(", ")}`,
      rateLimitRemaining,
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
});
