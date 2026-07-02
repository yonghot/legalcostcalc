/**
 * tests/indexnow.test.ts — T14 IndexNow script behavior.
 *
 * scripts/indexnow.mjs is a standalone Node CLI script (not part of the
 * src/ module graph vitest resolves via the "@" alias), so it's exercised
 * here as a subprocess — the same way it actually runs in "prebuild"/
 * "postbuild". Covers the spec's acceptance criteria:
 *   - curl-equivalent: prebuild writes public/{key}.txt containing the key
 *     when INDEXNOW_KEY is set; no-ops (exit 0, no file) when unset.
 *   - postbuild "skips submission" (exit 0) on preview (VERCEL_ENV != production)
 *     and when INDEXNOW_KEY is unset — deploy never fails on IndexNow.
 *   - postbuild swallows a missing/unreachable sitemap build artifact
 *     (deploy succeeds even when api.indexnow.org / the sitemap output is
 *     unreachable) — via INDEXNOW_SITEMAP_OVERRIDE pointing at a
 *     deliberately nonexistent path, so this never makes a real network call.
 */
import { afterEach, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync, unlinkSync, readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const scriptPath = path.join(repoRoot, "scripts", "indexnow.mjs");

/** Runs the script as a subprocess and returns combined stdout+stderr text. */
function runScript(mode: string, env: Record<string, string | undefined>): string {
  const fullEnv: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...process.env, ...env })) {
    if (v !== undefined) fullEnv[k] = v;
  }
  const result = spawnSync("node", [scriptPath, mode], {
    cwd: repoRoot,
    env: fullEnv as NodeJS.ProcessEnv,
    encoding: "utf8",
  });
  expect(result.status, `script exited non-zero: ${result.stderr}`).toBe(0);
  return `${result.stdout}${result.stderr}`;
}

const TEST_KEY = "0123456789abcdef0123456789abcdef";
const keyFilePath = path.join(repoRoot, "public", `${TEST_KEY}.txt`);

describe("scripts/indexnow.mjs", () => {
  afterEach(() => {
    if (existsSync(keyFilePath)) unlinkSync(keyFilePath);
  });

  it("prebuild: no-ops (exits 0, writes no file) when INDEXNOW_KEY is unset", () => {
    const output = runScript("prebuild", { INDEXNOW_KEY: "" });
    expect(output).toContain("INDEXNOW_KEY not set");
    expect(existsSync(keyFilePath)).toBe(false);
  });

  it("prebuild: writes public/{key}.txt containing the raw key when INDEXNOW_KEY is set", () => {
    const output = runScript("prebuild", { INDEXNOW_KEY: TEST_KEY });
    expect(output).toContain(`public/${TEST_KEY}.txt`);
    expect(existsSync(keyFilePath)).toBe(true);
    const content = readFileSync(keyFilePath, "utf8").trim();
    expect(content).toBe(TEST_KEY);
  });

  it("postbuild: skips submission (exit 0) when VERCEL_ENV is not production", () => {
    const output = runScript("postbuild", {
      VERCEL_ENV: "preview",
      INDEXNOW_KEY: TEST_KEY,
    });
    expect(output).toContain("skipping submission");
    expect(output).toContain("not production");
  });

  it("postbuild: skips submission (exit 0) when INDEXNOW_KEY is unset, even in production", () => {
    const output = runScript("postbuild", {
      VERCEL_ENV: "production",
      INDEXNOW_KEY: "",
    });
    expect(output).toContain("skipping submission");
    expect(output).toContain("INDEXNOW_KEY not set");
  });

  it("postbuild: exits 0 and logs a warning when the built sitemap artifact is missing (deploy never fails on this)", () => {
    const output = runScript("postbuild", {
      VERCEL_ENV: "production",
      INDEXNOW_KEY: TEST_KEY,
      // Deliberately nonexistent path — exercises findSitemapFile() -> null
      // without touching the real .next build output or the network.
      INDEXNOW_SITEMAP_OVERRIDE: path.join(repoRoot, "does-not-exist.xml"),
    });
    expect(output).toContain("sitemap.xml not found");
    expect(output).toContain("non-fatal");
  });

  it("unknown mode logs a warning but exits 0 (never fails the build)", () => {
    const output = runScript("bogus-mode", {});
    expect(output).toContain("unknown mode");
  });
});
