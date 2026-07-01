/**
 * Tests for the /api/contact validation logic and the client-side
 * validateContactFields helper.
 *
 * API route (src/app/api/contact/route.ts):
 *   - Valid payload returns 200 { ok: true }
 *   - Missing name → 400
 *   - Name over 100 chars → 400
 *   - Missing email → 400
 *   - Invalid email shape → 400
 *   - Email over 254 chars → 400
 *   - Missing message → 400
 *   - Message over 2000 chars → 400
 *
 * Client helper (src/components/shared/contact-form.tsx):
 *   - Valid inputs → null (no error)
 *   - Each required field missing → returns error string
 *   - Oversized name/message → returns error string
 *   - Invalid email shape → returns error string
 */

import { describe, it, expect } from "vitest";
import {
  MAX_NAME_LENGTH,
  MAX_EMAIL_LENGTH,
  MAX_MESSAGE_LENGTH,
  EMAIL_RE,
  getField,
} from "@/app/api/contact/route";
import { validateContactFields } from "@/components/shared/contact-form";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeBody(overrides: Partial<{ name: unknown; email: unknown; message: unknown }> = {}) {
  return {
    name: "Jane Doe",
    email: "jane@example.com",
    message: "This is a test message.",
    ...overrides,
  };
}

// Simulate server-side validation logic (mirrors route.ts logic directly).
function serverValidate(body: unknown): { ok: boolean; error?: string; status: number } {
  const name = getField(body, "name");
  const email = getField(body, "email");
  const message = getField(body, "message");

  if (!name || name.length === 0)
    return { ok: false, error: "Name is required.", status: 400 };
  if (name.length > MAX_NAME_LENGTH)
    return { ok: false, error: `Name must be ${MAX_NAME_LENGTH} characters or fewer.`, status: 400 };

  if (!email || email.length === 0)
    return { ok: false, error: "A valid email address is required.", status: 400 };
  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(email))
    return { ok: false, error: "A valid email address is required.", status: 400 };

  if (!message || message.length === 0)
    return { ok: false, error: "Message is required.", status: 400 };
  if (message.length > MAX_MESSAGE_LENGTH)
    return { ok: false, error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`, status: 400 };

  return { ok: true, status: 200 };
}

// ── Constants ─────────────────────────────────────────────────────────────────

describe("contact route — exported constants", () => {
  it("MAX_NAME_LENGTH is 100", () => expect(MAX_NAME_LENGTH).toBe(100));
  it("MAX_EMAIL_LENGTH is 254", () => expect(MAX_EMAIL_LENGTH).toBe(254));
  it("MAX_MESSAGE_LENGTH is 2000", () => expect(MAX_MESSAGE_LENGTH).toBe(2000));
});

// ── getField helper ───────────────────────────────────────────────────────────

describe("getField", () => {
  it("returns trimmed string for a present string field", () => {
    expect(getField({ name: "  Alice  " }, "name")).toBe("Alice");
  });

  it("returns undefined for a missing key", () => {
    expect(getField({ email: "x@x.com" }, "name")).toBeUndefined();
  });

  it("returns undefined for a non-string value", () => {
    expect(getField({ name: 42 }, "name")).toBeUndefined();
  });

  it("returns undefined for null body", () => {
    expect(getField(null, "name")).toBeUndefined();
  });

  it("returns undefined for a non-object body", () => {
    expect(getField("string body", "name")).toBeUndefined();
  });
});

// ── EMAIL_RE ─────────────────────────────────────────────────────────────────

describe("EMAIL_RE", () => {
  it("accepts a normal email", () => expect(EMAIL_RE.test("user@example.com")).toBe(true));
  it("accepts email with subdomain", () => expect(EMAIL_RE.test("u@mail.example.co")).toBe(true));
  it("rejects missing @", () => expect(EMAIL_RE.test("notanemail")).toBe(false));
  it("rejects missing domain part", () => expect(EMAIL_RE.test("user@")).toBe(false));
  it("rejects blank string", () => expect(EMAIL_RE.test("")).toBe(false));
  it("rejects address with spaces", () => expect(EMAIL_RE.test("user @example.com")).toBe(false));
});

// ── Server validation (via serverValidate shim) ───────────────────────────────

describe("server validation — valid payload", () => {
  it("accepts a fully valid payload", () => {
    const result = serverValidate(makeBody());
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
  });

  it("accepts whitespace-padded values (trimmed server-side)", () => {
    const result = serverValidate(makeBody({ name: "  Jane  ", email: " jane@example.com " }));
    expect(result.ok).toBe(true);
  });
});

describe("server validation — name field", () => {
  it("rejects empty name", () => {
    const r = serverValidate(makeBody({ name: "" }));
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
    expect(r.error).toMatch(/name/i);
  });

  it("rejects whitespace-only name", () => {
    const r = serverValidate(makeBody({ name: "   " }));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/name/i);
  });

  it("rejects name over MAX_NAME_LENGTH characters", () => {
    const r = serverValidate(makeBody({ name: "A".repeat(MAX_NAME_LENGTH + 1) }));
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
    expect(r.error).toMatch(/name/i);
  });

  it("accepts name exactly at MAX_NAME_LENGTH characters", () => {
    const r = serverValidate(makeBody({ name: "B".repeat(MAX_NAME_LENGTH) }));
    expect(r.ok).toBe(true);
  });

  it("rejects missing name key", () => {
    const r = serverValidate({ email: "a@b.com", message: "hello" });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/name/i);
  });
});

describe("server validation — email field", () => {
  it("rejects empty email", () => {
    const r = serverValidate(makeBody({ email: "" }));
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
    expect(r.error).toMatch(/email/i);
  });

  it("rejects invalid email shape (no @)", () => {
    const r = serverValidate(makeBody({ email: "notanemail" }));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/email/i);
  });

  it("rejects invalid email shape (no domain TLD)", () => {
    const r = serverValidate(makeBody({ email: "user@" }));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/email/i);
  });

  it("rejects email over MAX_EMAIL_LENGTH characters", () => {
    const longEmail = "a".repeat(MAX_EMAIL_LENGTH) + "@example.com";
    const r = serverValidate(makeBody({ email: longEmail }));
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
  });

  it("rejects missing email key", () => {
    const r = serverValidate({ name: "Alice", message: "hello" });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/email/i);
  });
});

describe("server validation — message field", () => {
  it("rejects empty message", () => {
    const r = serverValidate(makeBody({ message: "" }));
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
    expect(r.error).toMatch(/message/i);
  });

  it("rejects whitespace-only message", () => {
    const r = serverValidate(makeBody({ message: "   " }));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/message/i);
  });

  it("rejects message over MAX_MESSAGE_LENGTH characters", () => {
    const r = serverValidate(makeBody({ message: "x".repeat(MAX_MESSAGE_LENGTH + 1) }));
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
    expect(r.error).toMatch(/message/i);
  });

  it("accepts message exactly at MAX_MESSAGE_LENGTH characters", () => {
    const r = serverValidate(makeBody({ message: "y".repeat(MAX_MESSAGE_LENGTH) }));
    expect(r.ok).toBe(true);
  });

  it("rejects missing message key", () => {
    const r = serverValidate({ name: "Alice", email: "a@b.com" });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/message/i);
  });
});

// ── Client-side validateContactFields ────────────────────────────────────────

describe("validateContactFields — valid inputs", () => {
  it("returns null for a fully valid submission", () => {
    expect(validateContactFields("Jane Doe", "jane@example.com", "Great site!")).toBeNull();
  });

  it("returns null when values have surrounding whitespace (trimmed client-side)", () => {
    expect(validateContactFields("  Jane  ", " jane@example.com ", " message ")).toBeNull();
  });
});

describe("validateContactFields — name errors", () => {
  it("returns an error for empty name", () => {
    expect(validateContactFields("", "a@b.com", "hello")).toBeTruthy();
  });

  it("returns an error for whitespace-only name", () => {
    expect(validateContactFields("   ", "a@b.com", "hello")).toBeTruthy();
  });

  it("returns an error for name over 100 chars", () => {
    expect(validateContactFields("N".repeat(101), "a@b.com", "hello")).toBeTruthy();
  });
});

describe("validateContactFields — email errors", () => {
  it("returns an error for empty email", () => {
    expect(validateContactFields("Jane", "", "hello")).toBeTruthy();
  });

  it("returns an error for invalid email (no @)", () => {
    expect(validateContactFields("Jane", "notvalid", "hello")).toBeTruthy();
  });

  it("returns an error for invalid email (no TLD)", () => {
    expect(validateContactFields("Jane", "user@", "hello")).toBeTruthy();
  });
});

describe("validateContactFields — message errors", () => {
  it("returns an error for empty message", () => {
    expect(validateContactFields("Jane", "j@b.com", "")).toBeTruthy();
  });

  it("returns an error for whitespace-only message", () => {
    expect(validateContactFields("Jane", "j@b.com", "   ")).toBeTruthy();
  });

  it("returns an error for message over 2000 chars", () => {
    expect(validateContactFields("Jane", "j@b.com", "x".repeat(2001))).toBeTruthy();
  });
});
