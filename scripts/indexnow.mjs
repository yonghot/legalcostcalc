#!/usr/bin/env node
// scripts/indexnow.mjs — T14 IndexNow submission (Bing/Yandex/Naver; Google
// does not participate in IndexNow — never report this as Google progress).
//
// Two responsibilities, both self-gating and never fatal to the build:
//
//   1. `prebuild` — writeKeyFile(): serves the key at /{key}.txt by writing
//      it into public/ BEFORE `next build` runs (see "prebuild" in
//      package.json), so Vercel/Next serves it as a static file. No-op
//      (removes any stale key file) when INDEXNOW_KEY is unset.
//   2. `postbuild` — submit(): POSTs the quality-gated sitemap URL list to
//      https://api.indexnow.org/indexnow. Only runs when
//      VERCEL_ENV==='production' AND INDEXNOW_KEY is set. Any failure
//      (network, non-2xx, etc.) is caught and logged — never a non-zero
//      exit, so a deploy never fails because IndexNow is unreachable.
//
// The URL list is read directly from the just-built sitemap.xml
// (.next/server/app/sitemap.xml[.body]) — the SAME quality-gated source
// src/app/sitemap.ts emits (STATES x CATEGORIES filtered through
// hasUniqueData, T09 + hub/static pages), so this script never re-derives
// or drifts from the sitemap's URL set. This also avoids needing a
// TypeScript loader to import the .ts constants from a plain Node script.

import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const publicDir = path.join(repoRoot, "public");

const INDEXNOW_KEY = (process.env.INDEXNOW_KEY ?? "").trim();
const CANONICAL_ORIGIN =
  (process.env.NEXT_PUBLIC_APP_URL ?? "https://legalcostcalc.co").replace(/\/$/, "");
const CHUNK_SIZE = 10_000;

function keyFilePath(key) {
  return path.join(publicDir, `${key}.txt`);
}

/**
 * Writes public/{key}.txt containing the raw key (IndexNow key-file
 * verification format). Must run BEFORE `next build` (prebuild) so the
 * static file ships with the build output. No-op when INDEXNOW_KEY is
 * unset — any previously-written key file for a DIFFERENT key is left
 * alone (harmless stale file; avoids scanning public/ for arbitrary *.txt
 * files to delete).
 */
function writeKeyFile() {
  if (!INDEXNOW_KEY) {
    console.log("indexnow: INDEXNOW_KEY not set — skipping key file generation");
    return;
  }
  try {
    writeFileSync(keyFilePath(INDEXNOW_KEY), `${INDEXNOW_KEY}\n`, "utf8");
    console.log(`indexnow: wrote key file public/${INDEXNOW_KEY}.txt`);
  } catch (err) {
    console.warn("indexnow: failed to write key file (non-fatal):", err?.message ?? err);
  }
}

/**
 * Locates the built sitemap.xml (Next emits either a plain .xml or a .body
 * sibling). `INDEXNOW_SITEMAP_OVERRIDE` lets tests point at a fixture path
 * (or a deliberately nonexistent one, to exercise the "missing artifact"
 * branch) without depending on a real `.next` build directory.
 */
function findSitemapFile() {
  if (process.env.INDEXNOW_SITEMAP_OVERRIDE) {
    const overridePath = process.env.INDEXNOW_SITEMAP_OVERRIDE;
    return existsSync(overridePath) ? overridePath : null;
  }
  const candidates = [
    path.join(repoRoot, ".next/server/app/sitemap.xml.body"),
    path.join(repoRoot, ".next/server/app/sitemap.xml"),
    path.join(repoRoot, ".next/server/app/sitemap/route.xml.body"),
  ];
  return candidates.find((p) => existsSync(p)) ?? null;
}

function extractUrls(xml) {
  const matches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)];
  return matches.map((m) => m[1]);
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function submit() {
  if (process.env.VERCEL_ENV !== "production") {
    console.log(
      `indexnow: skipping submission (VERCEL_ENV=${process.env.VERCEL_ENV ?? "unset"}, not production)`,
    );
    return;
  }
  if (!INDEXNOW_KEY) {
    console.log("indexnow: skipping submission (INDEXNOW_KEY not set)");
    return;
  }

  try {
    const sitemapFile = findSitemapFile();
    if (!sitemapFile) {
      console.warn("indexnow: built sitemap.xml not found — skipping submission (non-fatal)");
      return;
    }
    const xml = readFileSync(sitemapFile, "utf8");
    const urlList = extractUrls(xml);

    if (urlList.length === 0) {
      console.warn("indexnow: sitemap.xml contained zero URLs — skipping submission");
      return;
    }

    const host = new URL(CANONICAL_ORIGIN).hostname;
    const keyLocation = `${CANONICAL_ORIGIN}/${INDEXNOW_KEY}.txt`;
    const batches = chunk(urlList, CHUNK_SIZE);

    let submitted = 0;
    for (const batch of batches) {
      const res = await fetch("https://api.indexnow.org/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation, urlList: batch }),
      });
      if (res.ok || res.status === 202) {
        submitted += batch.length;
      } else {
        console.warn(`indexnow: batch submission returned HTTP ${res.status} (non-fatal)`);
      }
    }
    console.log(`indexnow: submitted ${submitted} urls`);
  } catch (err) {
    // Never fail the deploy on an IndexNow error (network unreachable, DNS
    // failure, etc.) — swallow and log.
    console.warn("indexnow: submission failed (non-fatal):", err?.message ?? err);
  }
}

const mode = process.argv[2];

if (mode === "prebuild") {
  writeKeyFile();
} else if (mode === "postbuild") {
  await submit();
} else {
  console.warn(`indexnow: unknown mode "${mode ?? ""}" — expected "prebuild" or "postbuild"`);
}
