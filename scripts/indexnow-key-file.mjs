#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
const key = (process.env.INDEXNOW_KEY || "").trim();

if (!key) {
  console.log("indexnow: INDEXNOW_KEY not set — skipping key file generation");
} else {
  try {
    writeFileSync(path.join(publicDir, `${key}.txt`), `${key}\n`, "utf8");
    console.log(`indexnow: wrote key file public/${key}.txt`);
  } catch (err) {
    console.warn("indexnow: failed to write key file (non-fatal):", err?.message ?? err);
  }
}
