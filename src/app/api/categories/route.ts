import { NextRequest, NextResponse } from "next/server";
import { getAllCategories } from "@/lib/services/category-service";
import { successResponse, errorResponse } from "@/lib/types";
import { getClientIp, rateLimitGuard } from "@/lib/utils/api-security";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const guard = rateLimitGuard(ip);
  if (!guard.allowed) return guard.response;

  try {
    const categories = await getAllCategories();
    return NextResponse.json(
      successResponse(categories, { count: categories.length }),
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
