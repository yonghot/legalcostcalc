import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import "./helpers/render";
import { PUBLISHER } from "@/lib/constants/publisher";
import { Footer } from "@/components/layout/footer";
import { AuthorByline } from "@/components/shared/author-byline";

const SRC = join(__dirname, "..", "..", "src");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(tsx|ts)$/.test(name) ? [path] : [];
  });
}

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

function withEnv(key: string, value: string | undefined): () => void {
  const original = process.env[key];
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
  return () => {
    if (original === undefined) delete process.env[key];
    else process.env[key] = original;
  };
}

describe("K6: single publisher slot", () => {
  it("holds only the facts the owner supplied", () => {
    expect(PUBLISHER).toMatchObject({
      name: "Actigence",
      url: "https://actigence.ai",
      email: "contact@actigence.ai",
    });
    expect(Object.keys(PUBLISHER).sort()).toEqual([
      "correctionPath",
      "correctionText",
      "email",
      "name",
      "url",
    ]);
    expect(PUBLISHER.correctionText).toContain(PUBLISHER.email);
  });

  it("no source file other than the slot hard-codes the publisher", () => {
    const slot = join(SRC, "lib", "constants", "publisher.ts");
    const offenders = sourceFiles(SRC)
      .filter((f) => f !== slot)
      .filter((f) => /actigence/i.test(stripComments(readFileSync(f, "utf8"))))
      .map((f) => f.slice(SRC.length + 1));
    expect(offenders).toEqual([]);
  });

  it("the footer names the publisher, links its site and shows its email", () => {
    const html = renderToStaticMarkup(createElement(Footer));
    expect(html).toContain("is published by");
    expect(html).toContain(`href="${PUBLISHER.url}"`);
    expect(html).toContain(`mailto:${PUBLISHER.email}`);
  });
});

describe("K30: byline claims no review that did not happen", () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    for (const fn of cleanups.splice(0)) fn();
  });

  it("without a configured reviewer it states publisher and the factual not-reviewed notice", () => {
    cleanups.push(withEnv("NEXT_PUBLIC_REVIEWER_NAME", undefined));
    cleanups.push(withEnv("NEXT_PUBLIC_REVIEWER_CREDENTIALS", undefined));
    const html = renderToStaticMarkup(createElement(AuthorByline, { lastUpdated: "2026-06-29" }));
    expect(html).toContain("Published by");
    expect(html).toContain(PUBLISHER.name);
    expect(html).toContain("Not reviewed by a licensed attorney");
    expect(html).not.toMatch(/\bReviewed\b/);
    expect(html).not.toContain("reviewer pending");
    expect(html).not.toContain("Editorial Team");
  });

  it("with a configured reviewer it names the reviewer and drops the not-reviewed notice", () => {
    cleanups.push(withEnv("NEXT_PUBLIC_REVIEWER_NAME", "Jane Smith"));
    cleanups.push(withEnv("NEXT_PUBLIC_REVIEWER_CREDENTIALS", "Esq."));
    const html = renderToStaticMarkup(createElement(AuthorByline, { lastUpdated: "2026-06-29" }));
    expect(html).toContain("Reviewed by");
    expect(html).toContain("Jane Smith, Esq.");
    expect(html).not.toContain("Not reviewed by a licensed attorney");
    expect(html).toContain("Published by");
  });

  it("reviewer config reads literal NEXT_PUBLIC env names so bundlers can inline them", () => {
    const src = stripComments(readFileSync(join(SRC, "lib", "reviewer.ts"), "utf8"));
    expect(src).not.toMatch(/process\.env\[/);
    expect(src).toContain("process.env.NEXT_PUBLIC_REVIEWER_NAME");
    expect(src).toContain("process.env.NEXT_PUBLIC_REVIEWER_CREDENTIALS");
  });
});
