import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/types";
import { getClientIp, rateLimitGuard } from "@/lib/utils/api-security";

export interface ApiContext {
  request: NextRequest;
  rateLimitRemaining: number;
}

/**
 * Higher-order API handler that wraps route handlers with:
 * - Rate limiting (IP-based)
 * - Try-catch error handling with 500 response
 * - X-RateLimit-Remaining header injection
 */
export function withApiHandler(
  handler: (ctx: ApiContext) => Promise<NextResponse>,
) {
  return async function GET(request: NextRequest): Promise<Response> {
    const ip = getClientIp(request);
    const guard = rateLimitGuard(ip);
    if (!guard.allowed) return guard.response;

    try {
      const response = await handler({ request, rateLimitRemaining: guard.remaining });
      response.headers.set("X-RateLimit-Remaining", String(guard.remaining));
      return response;
    } catch (error) {
      void error;
      return NextResponse.json(
        errorResponse("Internal server error"),
        { status: 500 },
      );
    }
  };
}

/**
 * Create a 400 error response with rate limit header.
 */
export function badRequest(message: string, remaining: number): NextResponse {
  return NextResponse.json(
    errorResponse(message),
    { status: 400, headers: { "X-RateLimit-Remaining": String(remaining) } },
  );
}
