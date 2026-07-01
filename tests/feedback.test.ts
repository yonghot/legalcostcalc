/**
 * Tests for the feedback validation helper and API route behaviour.
 *
 * Validation helper (src/lib/utils/feedback-validation.ts):
 *   - Valid payload passes
 *   - Bad type rejected
 *   - Empty message rejected
 *   - Message over 2000 chars rejected
 *   - Invalid email shape rejected (when email provided)
 *   - Valid optional email accepted
 *   - Optional email omitted is fine
 *
 * API route forwarding behaviour (src/app/api/feedback/route.ts):
 *   - When FEEDBACK_ENDPOINT is unset → fetch is NOT called
 *   - When FEEDBACK_ENDPOINT is set → fetch IS called with the assembled record
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  validateFeedbackBody,
  getField,
  FEEDBACK_TYPES,
  MAX_MESSAGE_LENGTH,
  MAX_EMAIL_LENGTH,
  EMAIL_RE,
} from "@/lib/utils/feedback-validation";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBody(
  overrides: Partial<{
    type: unknown;
    message: unknown;
    email: unknown;
    pageUrl: unknown;
    site: unknown;
  }> = {},
) {
  return {
    type: "bug",
    message: "The calculator is not working on mobile.",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// getField helper
// ---------------------------------------------------------------------------

describe("getField", () => {
  it("extracts and trims a string field", () => {
    expect(getField({ name: "  hello  " }, "name")).toBe("hello");
  });

  it("returns undefined for missing field", () => {
    expect(getField({ foo: "bar" }, "baz")).toBeUndefined();
  });

  it("returns undefined for non-string field", () => {
    expect(getField({ count: 5 }, "count")).toBeUndefined();
  });

  it("returns undefined for null body", () => {
    expect(getField(null, "type")).toBeUndefined();
  });

  it("returns undefined for non-object body", () => {
    expect(getField("string", "type")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// EMAIL_RE
// ---------------------------------------------------------------------------

describe("EMAIL_RE", () => {
  it("accepts valid addresses", () => {
    expect(EMAIL_RE.test("user@example.com")).toBe(true);
    expect(EMAIL_RE.test("u+tag@sub.domain.org")).toBe(true);
  });

  it("rejects addresses without @", () => {
    expect(EMAIL_RE.test("notanemail")).toBe(false);
  });

  it("rejects addresses with spaces", () => {
    expect(EMAIL_RE.test("a b@example.com")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// FEEDBACK_TYPES constant
// ---------------------------------------------------------------------------

describe("FEEDBACK_TYPES", () => {
  it("contains exactly bug, feature, other", () => {
    expect(FEEDBACK_TYPES).toEqual(["bug", "feature", "other"]);
  });
});

// ---------------------------------------------------------------------------
// validateFeedbackBody
// ---------------------------------------------------------------------------

describe("validateFeedbackBody — valid payloads", () => {
  it("accepts a minimal valid payload", () => {
    const result = validateFeedbackBody(makeBody());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.type).toBe("bug");
      expect(result.message).toBe("The calculator is not working on mobile.");
      expect(result.email).toBeNull();
    }
  });

  it("accepts all valid types", () => {
    for (const t of FEEDBACK_TYPES) {
      const result = validateFeedbackBody(makeBody({ type: t }));
      expect(result.ok).toBe(true);
    }
  });

  it("accepts an optional valid email", () => {
    const result = validateFeedbackBody(makeBody({ email: "user@example.com" }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.email).toBe("user@example.com");
  });

  it("treats empty-string email as absent (null)", () => {
    const result = validateFeedbackBody(makeBody({ email: "" }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.email).toBeNull();
  });

  it("trims message whitespace", () => {
    const result = validateFeedbackBody(makeBody({ message: "  hi  " }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.message).toBe("hi");
  });

  it("includes pageUrl and site when provided", () => {
    const result = validateFeedbackBody(
      makeBody({ ...{ pageUrl: "/compare", site: "legalcostcalc.co" } }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.pageUrl).toBe("/compare");
      expect(result.site).toBe("legalcostcalc.co");
    }
  });
});

describe("validateFeedbackBody — invalid type", () => {
  it("rejects missing type", () => {
    const result = validateFeedbackBody({ message: "hi" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("type");
  });

  it("rejects empty-string type", () => {
    const result = validateFeedbackBody(makeBody({ type: "" }));
    expect(result.ok).toBe(false);
  });

  it("rejects unknown type string", () => {
    const result = validateFeedbackBody(makeBody({ type: "complaint" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("bug");
  });

  it("rejects numeric type", () => {
    const result = validateFeedbackBody(makeBody({ type: 1 }));
    expect(result.ok).toBe(false);
  });
});

describe("validateFeedbackBody — invalid message", () => {
  it("rejects missing message", () => {
    const result = validateFeedbackBody({ type: "bug" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Message");
  });

  it("rejects empty-string message (after trim)", () => {
    const result = validateFeedbackBody(makeBody({ message: "   " }));
    expect(result.ok).toBe(false);
  });

  it("rejects message over 2000 chars", () => {
    const result = validateFeedbackBody(
      makeBody({ message: "x".repeat(MAX_MESSAGE_LENGTH + 1) }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("2000");
  });

  it("accepts message of exactly 2000 chars", () => {
    const result = validateFeedbackBody(
      makeBody({ message: "x".repeat(MAX_MESSAGE_LENGTH) }),
    );
    expect(result.ok).toBe(true);
  });
});

describe("validateFeedbackBody — invalid email", () => {
  it("rejects email over 254 chars", () => {
    const longEmail = "a".repeat(MAX_EMAIL_LENGTH) + "@example.com";
    const result = validateFeedbackBody(makeBody({ email: longEmail }));
    expect(result.ok).toBe(false);
  });

  it("rejects malformed email", () => {
    const result = validateFeedbackBody(makeBody({ email: "not-an-email" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("email");
  });

  it("rejects email without TLD", () => {
    const result = validateFeedbackBody(makeBody({ email: "user@nodot" }));
    expect(result.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// API route forwarding behaviour
// ---------------------------------------------------------------------------

describe("feedback API route — endpoint forwarding", () => {
  let originalFetch: typeof global.fetch;
  const mockFetch = vi.fn();

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = mockFetch as typeof global.fetch;
    mockFetch.mockResolvedValue(new Response(null, { status: 200 }));
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
    delete process.env.FEEDBACK_ENDPOINT;
  });

  it("does NOT call fetch when FEEDBACK_ENDPOINT is unset", async () => {
    delete process.env.FEEDBACK_ENDPOINT;

    const { POST } = await import("@/app/api/feedback/route");
    const req = new Request("http://localhost/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "bug", message: "test message" }),
    });

    const res = await POST(req);
    const data = (await res.json()) as { ok: boolean };

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    // The only fetch that should NOT have been called is to an external endpoint.
    // (fetch may be called 0 times)
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("calls fetch with the assembled record when FEEDBACK_ENDPOINT is set", async () => {
    process.env.FEEDBACK_ENDPOINT = "https://example.com/collect";

    // Re-import to pick up the new env var (module cache means we use vi.resetModules if needed)
    vi.resetModules();
    const { POST } = await import("@/app/api/feedback/route");

    const req = new Request("http://localhost/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "feature",
        message: "Please add PDF export.",
        email: "user@example.com",
        pageUrl: "/compare",
        site: "legalcostcalc.co",
      }),
    });

    const res = await POST(req);
    const data = (await res.json()) as { ok: boolean };

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);

    // fetch should have been called once with our endpoint
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://example.com/collect");
    expect(init.method).toBe("POST");

    const sent = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(sent.type).toBe("feature");
    expect(sent.message).toBe("Please add PDF export.");
    expect(sent.email).toBe("user@example.com");
    expect(sent.pageUrl).toBe("/compare");
    expect(sent.site).toBe("legalcostcalc.co");
    expect(typeof sent.receivedAt).toBe("string");
  });

  it("returns 200 ok:true even when forward fetch throws", async () => {
    process.env.FEEDBACK_ENDPOINT = "https://example.com/collect";
    mockFetch.mockRejectedValue(new Error("network error"));

    vi.resetModules();
    const { POST } = await import("@/app/api/feedback/route");

    const req = new Request("http://localhost/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "other", message: "test" }),
    });

    const res = await POST(req);
    const data = (await res.json()) as { ok: boolean };

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
  });
});
