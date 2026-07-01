import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Geo-detection middleware.
 *
 * Reads the visitor country from Vercel's edge geolocation header
 * ('x-vercel-ip-country') and writes it into a readable (non-HttpOnly) cookie
 * so client components can branch consent behaviour by region WITHOUT making
 * pages dynamic. The cookie is set on the *response*; the underlying pages stay
 * statically rendered/cached.
 *
 * No env var is required: when the header is absent (local dev, non-Vercel
 * hosting) the cookie is simply set to "XX" (unknown) and the client treats
 * unknown as the US/default posture.
 */

const COUNTRY_COOKIE = "visitor_country";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Vercel injects this header at the edge. Absent locally / off-Vercel.
  const country = request.headers.get("x-vercel-ip-country")?.toUpperCase() || "XX";

  // Only (re)write when changed, to avoid needless Set-Cookie churn.
  if (request.cookies.get(COUNTRY_COOKIE)?.value !== country) {
    response.cookies.set(COUNTRY_COOKIE, country, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day
      // Intentionally readable by JS (no httpOnly): the client consent logic
      // needs it and it carries no sensitive data.
    });
  }

  return response;
}

export const config = {
  // Run on page routes only; skip Next internals, API routes and static assets
  // (incl. ads.txt, opengraph-image, favicon) so we never touch their caching.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|ads.txt|robots.txt|sitemap.xml|opengraph-image).*)",
  ],
};
