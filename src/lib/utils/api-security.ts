/**
 * Sanitize user input for safe inclusion in API error messages.
 * Strips HTML/script tags and truncates to prevent log injection and response bloat.
 */
export function sanitizeForErrorMessage(input: string, maxLength = 50): string {
  return input
    .replace(/[<>"'&\r\n]/g, "")
    .slice(0, maxLength);
}

/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window approach per IP address.
 */
const requestCounts = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 60; // 60 requests per minute per IP

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = requestCounts.get(ip);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  entry.count += 1;

  if (entry.count > MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: MAX_REQUESTS - entry.count };
}

/**
 * Extract client IP from request headers.
 */
export function getClientIp(request: { headers: { get(name: string): string | null } }): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/**
 * Rate limit guard. Returns null if allowed, or a 429 Response if blocked.
 */
export function rateLimitGuard(
  ip: string,
): { allowed: true; remaining: number } | { allowed: false; response: Response } {
  const { allowed, remaining } = checkRateLimit(ip);
  if (!allowed) {
    const body = JSON.stringify({ data: null, error: "Too many requests. Please try again later.", meta: null });
    return {
      allowed: false,
      response: new Response(body, {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "60",
          "X-RateLimit-Remaining": "0",
        },
      }),
    };
  }
  return { allowed: true, remaining };
}

/**
 * Periodically clean up expired entries to prevent memory leaks.
 * This runs on a 5-minute interval.
 */
if (typeof globalThis !== "undefined") {
  const CLEANUP_INTERVAL = 5 * 60_000;
  const cleanupKey = "__rateLimitCleanup";

  if (!(globalThis as Record<string, unknown>)[cleanupKey]) {
    (globalThis as Record<string, unknown>)[cleanupKey] = true;
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of requestCounts.entries()) {
        if (now > entry.resetAt) {
          requestCounts.delete(key);
        }
      }
    }, CLEANUP_INTERVAL);
  }
}
