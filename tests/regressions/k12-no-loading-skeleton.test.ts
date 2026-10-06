import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const APP_DIR = join(process.cwd(), "src", "app");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const rel = (p: string) => relative(APP_DIR, p).split(sep).join("/");

describe("K12: static content routes are not served behind a loading skeleton", () => {
  it.each([
    "[state]/[slug]/loading.tsx",
    "about/loading.tsx",
    "compare/loading.tsx",
  ])("%s does not exist", (file) => {
    expect(existsSync(join(APP_DIR, file))).toBe(false);
  });

  it("no loading.* file exists anywhere under src/app", () => {
    const found = walk(APP_DIR)
      .map(rel)
      .filter((p) => /(^|\/)loading\.(tsx|ts|jsx|js)$/.test(p));
    expect(found).toEqual([]);
  });

  it("the error boundaries of those routes are kept", () => {
    for (const file of ["[state]/[slug]/error.tsx", "about/error.tsx", "compare/error.tsx"]) {
      expect(existsSync(join(APP_DIR, file))).toBe(true);
    }
  });
});
