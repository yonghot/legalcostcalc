/**
 * tests/reviewer.test.ts
 *
 * K06 — Unit tests for src/lib/reviewer.ts (env/config-driven YMYL reviewer
 * byline). Invariants under test:
 *   - Unset NEXT_PUBLIC_REVIEWER_NAME => getReviewerConfig() returns null
 *     (AuthorByline/OrganizationSchema fall back to the honest placeholder
 *     copy — no fabricated name is ever rendered).
 *   - Set NEXT_PUBLIC_REVIEWER_NAME (+ optional _CREDENTIALS) => the exact
 *     configured values are returned, never altered/invented.
 *   - Blank/whitespace-only values are treated as unset.
 */

import { describe, it, expect, afterEach } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getReviewerConfig } from "@/lib/reviewer";
import { AuthorByline } from "@/components/shared/author-byline";

function withEnv(key: string, value: string | undefined): () => void {
  const original = process.env[key];
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
  return () => {
    if (original === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original;
    }
  };
}

describe("getReviewerConfig — env unset (no-fabrication default)", () => {
  const cleanups: Array<() => void> = [];

  afterEach(() => {
    for (const fn of cleanups.splice(0)) fn();
  });

  it("returns null when NEXT_PUBLIC_REVIEWER_NAME is unset", () => {
    cleanups.push(withEnv("NEXT_PUBLIC_REVIEWER_NAME", undefined));
    cleanups.push(withEnv("NEXT_PUBLIC_REVIEWER_CREDENTIALS", undefined));
    expect(getReviewerConfig()).toBeNull();
  });

  it("returns null when NEXT_PUBLIC_REVIEWER_NAME is an empty string", () => {
    cleanups.push(withEnv("NEXT_PUBLIC_REVIEWER_NAME", ""));
    expect(getReviewerConfig()).toBeNull();
  });

  it("returns null when NEXT_PUBLIC_REVIEWER_NAME is whitespace-only", () => {
    cleanups.push(withEnv("NEXT_PUBLIC_REVIEWER_NAME", "   "));
    expect(getReviewerConfig()).toBeNull();
  });

  it("ignores NEXT_PUBLIC_REVIEWER_CREDENTIALS when name is unset", () => {
    cleanups.push(withEnv("NEXT_PUBLIC_REVIEWER_NAME", undefined));
    cleanups.push(withEnv("NEXT_PUBLIC_REVIEWER_CREDENTIALS", "Esq."));
    expect(getReviewerConfig()).toBeNull();
  });
});

describe("getReviewerConfig — env set (owner-configured real reviewer)", () => {
  const cleanups: Array<() => void> = [];

  afterEach(() => {
    for (const fn of cleanups.splice(0)) fn();
  });

  it("returns the configured name with credentials null when only name is set", () => {
    cleanups.push(withEnv("NEXT_PUBLIC_REVIEWER_NAME", "Jane Smith"));
    cleanups.push(withEnv("NEXT_PUBLIC_REVIEWER_CREDENTIALS", undefined));
    expect(getReviewerConfig()).toEqual({ name: "Jane Smith", credentials: null });
  });

  it("returns both name and credentials when both are set", () => {
    cleanups.push(withEnv("NEXT_PUBLIC_REVIEWER_NAME", "Jane Smith"));
    cleanups.push(
      withEnv("NEXT_PUBLIC_REVIEWER_CREDENTIALS", "Esq., California Bar #123456"),
    );
    expect(getReviewerConfig()).toEqual({
      name: "Jane Smith",
      credentials: "Esq., California Bar #123456",
    });
  });

  it("returns the exact configured string — never alters/invents the value", () => {
    cleanups.push(withEnv("NEXT_PUBLIC_REVIEWER_NAME", "  Dr. Jane Smith  "));
    // Trims outer whitespace but does not otherwise transform the value.
    expect(getReviewerConfig()?.name).toBe("Dr. Jane Smith");
  });
});

describe("AuthorByline — component-level render gate (K06)", () => {
  const cleanups: Array<() => void> = [];

  afterEach(() => {
    for (const fn of cleanups.splice(0)) fn();
  });

  it("shows the honest placeholder copy when no reviewer is configured", () => {
    cleanups.push(withEnv("NEXT_PUBLIC_REVIEWER_NAME", undefined));
    const html = renderToStaticMarkup(
      createElement(AuthorByline, { lastUpdated: "2026-06-29" }),
    );
    expect(html).toContain("legal reviewer pending");
    expect(html).not.toContain("Reviewed by");
  });

  it("renders the real reviewer name only when NEXT_PUBLIC_REVIEWER_NAME is set", () => {
    cleanups.push(withEnv("NEXT_PUBLIC_REVIEWER_NAME", "Jane Smith"));
    cleanups.push(
      withEnv("NEXT_PUBLIC_REVIEWER_CREDENTIALS", "Esq., California Bar #123456"),
    );
    const html = renderToStaticMarkup(
      createElement(AuthorByline, { lastUpdated: "2026-06-29" }),
    );
    expect(html).toContain("Reviewed by");
    expect(html).toContain("Jane Smith");
    expect(html).toContain("Esq., California Bar #123456");
    expect(html).not.toContain("legal reviewer pending");
  });

  it("renders the name without a trailing comma when credentials are unset", () => {
    cleanups.push(withEnv("NEXT_PUBLIC_REVIEWER_NAME", "Jane Smith"));
    cleanups.push(withEnv("NEXT_PUBLIC_REVIEWER_CREDENTIALS", undefined));
    const html = renderToStaticMarkup(
      createElement(AuthorByline, { lastUpdated: "2026-06-29" }),
    );
    expect(html).toContain("Jane Smith");
    expect(html).not.toContain("Jane Smith,");
  });
});
