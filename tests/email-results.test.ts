/**
 * Tests for /api/email-results (T17 — env-gated transactional "Email my
 * results" endpoint).
 *
 * Covers:
 *   - isEnabled(): false unless EMAIL_CAPTURE_ENDPOINT +
 *     NEXT_PUBLIC_EMAIL_CAPTURE_ENABLED='1' + NEXT_PUBLIC_POSTAL_ADDRESS are
 *     ALL set (repo guardrail: reuse the existing CAN-SPAM postal-address gate).
 *   - EmailResultsSchema: valid payload parses; invalid email/missing
 *     fields/oversized calcType are rejected.
 *   - POST: 404 when disabled (env unset) — the form is unreachable server-side
 *     even if somehow invoked; 400 on invalid JSON/schema failure; never
 *     throws when EMAIL_CAPTURE_ENDPOINT is unreachable (mocked, no real
 *     network call) — the route's own try/catch converts that to a 502
 *     rather than an unhandled rejection.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

function withEnv(overrides: Record<string, string | undefined>): () => void {
  const originals: Record<string, string | undefined> = {};
  for (const key of Object.keys(overrides)) {
    originals[key] = process.env[key];
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return () => {
    for (const [key, value] of Object.entries(originals)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
}

function makeRequest(body: unknown, ip = "203.0.113.1"): Request {
  return new Request("http://localhost/api/email-results", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

describe("isEnabled (T17 env gate)", () => {
  let restore: () => void;

  afterEach(() => {
    restore?.();
    vi.resetModules();
  });

  it("false when all three env vars are unset", async () => {
    restore = withEnv({
      EMAIL_CAPTURE_ENDPOINT: undefined,
      NEXT_PUBLIC_EMAIL_CAPTURE_ENABLED: undefined,
      NEXT_PUBLIC_POSTAL_ADDRESS: undefined,
    });
    const { isEnabled } = await import("@/app/api/email-results/route");
    expect(isEnabled()).toBe(false);
  });

  it("false when only EMAIL_CAPTURE_ENDPOINT is set", async () => {
    restore = withEnv({
      EMAIL_CAPTURE_ENDPOINT: "https://esp.example.com/api",
      NEXT_PUBLIC_EMAIL_CAPTURE_ENABLED: undefined,
      NEXT_PUBLIC_POSTAL_ADDRESS: undefined,
    });
    const { isEnabled } = await import("@/app/api/email-results/route");
    expect(isEnabled()).toBe(false);
  });

  it("false when EMAIL_CAPTURE_ENDPOINT + NEXT_PUBLIC_EMAIL_CAPTURE_ENABLED are set but NEXT_PUBLIC_POSTAL_ADDRESS is missing", async () => {
    restore = withEnv({
      EMAIL_CAPTURE_ENDPOINT: "https://esp.example.com/api",
      NEXT_PUBLIC_EMAIL_CAPTURE_ENABLED: "1",
      NEXT_PUBLIC_POSTAL_ADDRESS: undefined,
    });
    const { isEnabled } = await import("@/app/api/email-results/route");
    expect(isEnabled()).toBe(false);
  });

  it("true only when all three are set", async () => {
    restore = withEnv({
      EMAIL_CAPTURE_ENDPOINT: "https://esp.example.com/api",
      NEXT_PUBLIC_EMAIL_CAPTURE_ENABLED: "1",
      NEXT_PUBLIC_POSTAL_ADDRESS: "LegalCostCalc, 123 Main St, Wilmington, DE",
    });
    const { isEnabled } = await import("@/app/api/email-results/route");
    expect(isEnabled()).toBe(true);
  });

  it("false when NEXT_PUBLIC_EMAIL_CAPTURE_ENABLED is any value other than the literal '1'", async () => {
    restore = withEnv({
      EMAIL_CAPTURE_ENDPOINT: "https://esp.example.com/api",
      NEXT_PUBLIC_EMAIL_CAPTURE_ENABLED: "true",
      NEXT_PUBLIC_POSTAL_ADDRESS: "LegalCostCalc, 123 Main St, Wilmington, DE",
    });
    const { isEnabled } = await import("@/app/api/email-results/route");
    expect(isEnabled()).toBe(false);
  });
});

describe("EmailResultsSchema", () => {
  it("accepts a valid payload", async () => {
    const { EmailResultsSchema } = await import("@/app/api/email-results/route");
    const result = EmailResultsSchema.safeParse({
      email: "jane@example.com",
      calcType: "divorce",
      shareUrl: "https://legalcostcalc.co/california/divorce-cost",
      marketingOptIn: false,
    });
    expect(result.success).toBe(true);
  });

  it("defaults marketingOptIn to false when omitted", async () => {
    const { EmailResultsSchema } = await import("@/app/api/email-results/route");
    const result = EmailResultsSchema.safeParse({
      email: "jane@example.com",
      calcType: "divorce",
      shareUrl: "https://legalcostcalc.co/california/divorce-cost",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.marketingOptIn).toBe(false);
  });

  it("rejects an invalid email shape", async () => {
    const { EmailResultsSchema } = await import("@/app/api/email-results/route");
    const result = EmailResultsSchema.safeParse({
      email: "not-an-email",
      calcType: "divorce",
      shareUrl: "https://legalcostcalc.co/california/divorce-cost",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing calcType", async () => {
    const { EmailResultsSchema } = await import("@/app/api/email-results/route");
    const result = EmailResultsSchema.safeParse({
      email: "jane@example.com",
      shareUrl: "https://legalcostcalc.co/california/divorce-cost",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing shareUrl", async () => {
    const { EmailResultsSchema } = await import("@/app/api/email-results/route");
    const result = EmailResultsSchema.safeParse({
      email: "jane@example.com",
      calcType: "divorce",
    });
    expect(result.success).toBe(false);
  });
});

describe("POST /api/email-results", () => {
  let restore: () => void;

  afterEach(() => {
    restore?.();
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("returns 404 when the feature is disabled (env unset)", async () => {
    restore = withEnv({
      EMAIL_CAPTURE_ENDPOINT: undefined,
      NEXT_PUBLIC_EMAIL_CAPTURE_ENABLED: undefined,
      NEXT_PUBLIC_POSTAL_ADDRESS: undefined,
    });
    const { POST } = await import("@/app/api/email-results/route");
    const res = await POST(makeRequest({ email: "jane@example.com", calcType: "divorce", shareUrl: "https://legalcostcalc.co/california/divorce-cost" }));
    expect(res.status).toBe(404);
  });

  it("returns 400 on invalid JSON body", async () => {
    restore = withEnv({
      EMAIL_CAPTURE_ENDPOINT: "https://esp.example.com/api",
      NEXT_PUBLIC_EMAIL_CAPTURE_ENABLED: "1",
      NEXT_PUBLIC_POSTAL_ADDRESS: "LegalCostCalc, 123 Main St, Wilmington, DE",
    });
    const { POST } = await import("@/app/api/email-results/route");
    const req = new Request("http://localhost/api/email-results", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.2" },
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when the schema rejects the payload", async () => {
    restore = withEnv({
      EMAIL_CAPTURE_ENDPOINT: "https://esp.example.com/api",
      NEXT_PUBLIC_EMAIL_CAPTURE_ENABLED: "1",
      NEXT_PUBLIC_POSTAL_ADDRESS: "LegalCostCalc, 123 Main St, Wilmington, DE",
    });
    const { POST } = await import("@/app/api/email-results/route");
    const res = await POST(makeRequest({ email: "not-an-email", calcType: "divorce", shareUrl: "https://legalcostcalc.co/california/divorce-cost" }, "203.0.113.3"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when shareUrl is not a safe https URL (e.g. javascript: scheme)", async () => {
    restore = withEnv({
      EMAIL_CAPTURE_ENDPOINT: "https://esp.example.com/api",
      NEXT_PUBLIC_EMAIL_CAPTURE_ENABLED: "1",
      NEXT_PUBLIC_POSTAL_ADDRESS: "LegalCostCalc, 123 Main St, Wilmington, DE",
    });
    const { POST } = await import("@/app/api/email-results/route");
    const res = await POST(
      makeRequest(
        { email: "jane@example.com", calcType: "divorce", shareUrl: "javascript:alert(1)" },
        "203.0.113.4",
      ),
    );
    expect(res.status).toBe(400);
  });

  it("returns 502 (not an unhandled rejection) when the ESP endpoint is unreachable", async () => {
    restore = withEnv({
      EMAIL_CAPTURE_ENDPOINT: "https://esp.invalid.example/api",
      NEXT_PUBLIC_EMAIL_CAPTURE_ENABLED: "1",
      NEXT_PUBLIC_POSTAL_ADDRESS: "LegalCostCalc, 123 Main St, Wilmington, DE",
    });
    // Mock global fetch to simulate a network failure without a real call.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network unreachable")),
    );
    const { POST } = await import("@/app/api/email-results/route");
    const res = await POST(
      makeRequest(
        { email: "jane@example.com", calcType: "divorce", shareUrl: "https://legalcostcalc.co/california/divorce-cost" },
        "203.0.113.5",
      ),
    );
    expect(res.status).toBe(502);
  });

  it("returns 200 { ok: true } on a successful ESP forward", async () => {
    restore = withEnv({
      EMAIL_CAPTURE_ENDPOINT: "https://esp.example.com/api",
      NEXT_PUBLIC_EMAIL_CAPTURE_ENABLED: "1",
      NEXT_PUBLIC_POSTAL_ADDRESS: "LegalCostCalc, 123 Main St, Wilmington, DE",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })),
    );
    const { POST } = await import("@/app/api/email-results/route");
    const res = await POST(
      makeRequest(
        { email: "jane@example.com", calcType: "divorce", shareUrl: "https://legalcostcalc.co/california/divorce-cost" },
        "203.0.113.6",
      ),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true });
  });
});
