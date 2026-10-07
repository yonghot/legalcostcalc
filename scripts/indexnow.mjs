#!/usr/bin/env node
// scripts/indexnow.mjs — IndexNow submission (Bing/Yandex/Naver; Google does
// not participate in IndexNow — never report this as Google progress).
//
// Two responsibilities, both self-gating and never fatal to the build:
//
//   1. `prebuild` — writeKeyFile(): serves the key at /{key}.txt by writing it
//      into public/ BEFORE `next build` runs. No-op when INDEXNOW_KEY is unset.
//   2. `postbuild` — submit(): diffs the just-built sitemap against the live
//      production sitemap (the previous deployment is still live during the
//      build) and POSTs only new URLs, URLs whose lastmod changed and URLs that
//      left the sitemap. Runs only when VERCEL_ENV==='production' AND
//      INDEXNOW_KEY is set. When the live sitemap cannot be read nothing is
//      submitted — it never falls back to the full URL list.
//
// Environment overrides used by tests: INDEXNOW_ENDPOINT, INDEXNOW_BASELINE_URL,
// INDEXNOW_BASELINE_FILE, INDEXNOW_SITEMAP_OVERRIDE. The key is never logged.

import { writeFileSync, existsSync, readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const publicDir = path.join(repoRoot, "public");

const env = (name) => (process.env[name] || "").trim();

const INDEXNOW_KEY = env("INDEXNOW_KEY");
const CANONICAL_ORIGIN = (env("NEXT_PUBLIC_APP_URL") || "https://legalcostcalc.co").replace(/\/$/, "");
const ENDPOINT = env("INDEXNOW_ENDPOINT") || "https://api.indexnow.org/indexnow";
const BASELINE_URL = env("INDEXNOW_BASELINE_URL") || `${CANONICAL_ORIGIN}/sitemap.xml`;
const CHUNK_SIZE = 10_000;
const REQUEST_TIMEOUT_MS = 20_000;

function keyFilePath(key) {
  return path.join(publicDir, `${key}.txt`);
}

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

const decodeXml = (text) =>
  text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

function normalizeLastmod(value) {
  const text = (value || "").trim();
  const day = /^\d{4}-\d{2}-\d{2}/.exec(text);
  return day ? day[0] : text;
}

export function parseSitemapEntries(xml) {
  const entries = [];
  for (const block of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = /<loc>([^<]+)<\/loc>/.exec(block[1]);
    if (!loc) continue;
    const lastmod = /<lastmod>([^<]+)<\/lastmod>/.exec(block[1]);
    entries.push({ loc: decodeXml(loc[1].trim()), lastmod: normalizeLastmod(lastmod?.[1]) });
  }
  return entries;
}

export function diffSitemaps(baseline, built) {
  const before = new Map(baseline.map((e) => [e.loc, e.lastmod]));
  const after = new Map(built.map((e) => [e.loc, e.lastmod]));
  const added = [];
  const modified = [];
  const removed = [];
  for (const [loc, lastmod] of after) {
    if (!before.has(loc)) added.push(loc);
    else if (before.get(loc) !== lastmod) modified.push(loc);
  }
  for (const loc of before.keys()) if (!after.has(loc)) removed.push(loc);
  return { added, modified, removed, urls: [...added, ...modified, ...removed] };
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function buildPayloads({ urls, origin, key, chunkSize = CHUNK_SIZE }) {
  const host = new URL(origin).hostname;
  const sameHost = urls.filter((u) => {
    try {
      return new URL(u).hostname === host;
    } catch {
      return false;
    }
  });
  const keyLocation = `${origin}/${key}.txt`;
  return chunk(sameHost, chunkSize).map((urlList) => ({ host, key, keyLocation, urlList }));
}

async function loadBaselineXml() {
  const file = env("INDEXNOW_BASELINE_FILE");
  if (file) return existsSync(file) ? readFileSync(file, "utf8") : null;
  try {
    const res = await fetch(BASELINE_URL, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!res.ok) {
      console.warn(`indexnow: baseline sitemap returned HTTP ${res.status}`);
      return null;
    }
    return await res.text();
  } catch (err) {
    console.warn(`indexnow: baseline sitemap fetch failed (${err?.cause?.code ?? err?.message ?? err})`);
    return null;
  }
}

async function submit() {
  if (process.env.VERCEL_ENV !== "production") {
    console.log(
      `indexnow: skipping submission (VERCEL_ENV=${process.env.VERCEL_ENV || "unset"}, not production)`,
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
    const built = parseSitemapEntries(readFileSync(sitemapFile, "utf8"));
    if (built.length === 0) {
      console.warn("indexnow: sitemap.xml contained zero URLs — skipping submission");
      return;
    }

    const baselineXml = await loadBaselineXml();
    const baseline = baselineXml ? parseSitemapEntries(baselineXml) : [];
    if (baseline.length === 0) {
      console.warn(
        "indexnow: baseline sitemap unavailable or empty — submitting nothing (never falls back to the full list)",
      );
      return;
    }

    const diff = diffSitemaps(baseline, built);
    console.log(
      `indexnow: ${diff.urls.length} changed urls (${diff.added.length} new, ${diff.modified.length} lastmod changed, ` +
        `${diff.removed.length} removed) of ${built.length} in the built sitemap`,
    );
    if (diff.urls.length === 0) {
      console.log("indexnow: nothing to submit");
      return;
    }

    const payloads = buildPayloads({ urls: diff.urls, origin: CANONICAL_ORIGIN, key: INDEXNOW_KEY });
    console.log(`indexnow: posting ${payloads.length} batch(es) to ${new URL(ENDPOINT).host}`);

    let submitted = 0;
    for (const [index, payload] of payloads.entries()) {
      const label = `batch ${index + 1}/${payloads.length} (${payload.urlList.length} urls)`;
      try {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        console.log(`indexnow: ${label} HTTP ${res.status}`);
        if (res.ok || res.status === 202) submitted += payload.urlList.length;
      } catch (err) {
        console.warn(`indexnow: ${label} failed (${err?.cause?.code ?? err?.message ?? err})`);
      }
    }
    console.log(`indexnow: submitted ${submitted} of ${diff.urls.length} changed urls`);
  } catch (err) {
    console.warn("indexnow: submission failed (non-fatal):", err?.cause?.code ?? err?.message ?? err);
  }
}

const invokedDirectly =
  Boolean(process.argv[1]) && realpathSync(path.resolve(process.argv[1])) === realpathSync(__filename);

if (invokedDirectly) {
  const mode = process.argv[2];
  if (mode === "prebuild") {
    writeKeyFile();
  } else if (mode === "postbuild") {
    await submit();
  } else {
    console.warn(`indexnow: unknown mode "${mode ?? ""}" — expected "prebuild" or "postbuild"`);
  }
}
