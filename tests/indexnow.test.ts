/**
 * tests/indexnow.test.ts — IndexNow scripts as they run in "prebuild" and "postbuild".
 *
 * scripts/indexnow-key-file.mjs (prebuild) and scripts/indexnow.mjs (postbuild) are standalone Node
 * scripts outside the "@" alias graph, so they are exercised as subprocesses. Delta behavior (K19-D)
 * is pinned by tests/regressions/indexnow-delta.test.ts.
 *   - prebuild writes public/{key}.txt containing the key when INDEXNOW_KEY is set; no-op when unset.
 *   - postbuild exits 0 and submits nothing on local/preview builds, without a key, and when
 *     production cannot be compared (K19-D fail closed).
 *   - every spawn pins INDEXNOW_PROD_ORIGIN and INDEXNOW_ENDPOINT to a closed local port (K22), so no
 *     test can reach api.indexnow.org or the live site.
 */
import { afterEach, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const keyFileScript = path.join(repoRoot, "scripts", "indexnow-key-file.mjs");
const postbuildScript = path.join(repoRoot, "scripts", "indexnow.mjs");

const CLOSED_PORT = "http://127.0.0.1:9";
const TEST_KEY = "0123456789abcdef0123456789abcdef";
const keyFilePath = path.join(repoRoot, "public", `${TEST_KEY}.txt`);

function run(script: string, env: Record<string, string | undefined>, cwd = repoRoot) {
  const fullEnv: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined && k !== "VERCEL_ENV" && !k.startsWith("INDEXNOW_")) fullEnv[k] = v;
  }
  const pinned = { INDEXNOW_PROD_ORIGIN: CLOSED_PORT, INDEXNOW_ENDPOINT: `${CLOSED_PORT}/indexnow` };
  for (const [k, v] of Object.entries({ ...pinned, ...env })) if (v !== undefined) fullEnv[k] = v;
  const result = spawnSync(process.execPath, [script], { cwd, env: fullEnv as NodeJS.ProcessEnv, encoding: "utf8", timeout: 15_000 });
  expect(result.status, `script exited non-zero: ${result.stderr}`).toBe(0);
  return `${result.stdout}${result.stderr}`;
}

describe("scripts/indexnow-key-file.mjs (prebuild)", () => {
  afterEach(() => {
    if (existsSync(keyFilePath)) unlinkSync(keyFilePath);
  });

  it("no-ops (exits 0, writes no file) when INDEXNOW_KEY is unset", () => {
    const output = run(keyFileScript, { INDEXNOW_KEY: "" });
    expect(output).toContain("INDEXNOW_KEY not set");
    expect(existsSync(keyFilePath)).toBe(false);
  });

  it("writes public/{key}.txt containing the raw key when INDEXNOW_KEY is set", () => {
    const output = run(keyFileScript, { INDEXNOW_KEY: TEST_KEY });
    expect(output).toContain(`public/${TEST_KEY}.txt`);
    expect(existsSync(keyFilePath)).toBe(true);
    expect(readFileSync(keyFilePath, "utf8").trim()).toBe(TEST_KEY);
  });
});

describe("scripts/indexnow.mjs (postbuild) never fails the build", () => {
  it("skips a local build (VERCEL_ENV unset)", () => {
    expect(run(postbuildScript, { INDEXNOW_KEY: TEST_KEY })).toMatch(/skipped \(not a production build\)/);
  });

  it("skips a preview build", () => {
    expect(run(postbuildScript, { VERCEL_ENV: "preview", INDEXNOW_KEY: TEST_KEY })).toMatch(/skipped \(not a production build\)/);
  });

  it("skips production when INDEXNOW_KEY is unset", () => {
    expect(run(postbuildScript, { VERCEL_ENV: "production", INDEXNOW_KEY: "" })).toMatch(/skipped \(INDEXNOW_KEY unset\)/);
  });

  it("exits 0 and submits nothing when production is unreachable (fail closed)", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "indexnow-"));
    try {
      const app = path.join(dir, ".next", "server", "app");
      mkdirSync(app, { recursive: true });
      writeFileSync(
        path.join(app, "sitemap.xml.body"),
        "<urlset><url><loc>https://legalcostcalc.co/</loc></url></urlset>",
      );
      const output = run(postbuildScript, { VERCEL_ENV: "production", INDEXNOW_KEY: TEST_KEY }, dir);
      expect(output).toMatch(/comparison failed, nothing submitted/);
      expect(output).not.toMatch(/HTTP \d+ for|submitted \d+ of/);
      expect(output).not.toContain(TEST_KEY);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
