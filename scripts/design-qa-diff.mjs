// design-qa-diff.mjs — fail only on NEW impeccable findings vs baseline.json.
// Usage: npm run design:qa:ci  (writes detect.json first, then runs this).
import { readFileSync } from "node:fs";

const read = (f) => {
  try {
    return JSON.parse(readFileSync(f, "utf8"));
  } catch {
    return [];
  }
};

// Stable key independent of absolute path (normalize slashes, keep src-relative tail).
const key = (x) =>
  [
    x.antipattern,
    x.file && x.file.replace(/\\/g, "/").split("/src/").pop(),
    x.line,
  ].join("|");

const base = new Set(read("baseline.json").map(key));
const now = read("detect.json");
const fresh = now.filter((x) => !base.has(key(x)));

if (fresh.length) {
  console.error(`\n✖ ${fresh.length} new design-quality finding(s) beyond baseline:\n`);
  for (const f of fresh) {
    console.error(`  [${f.severity}] ${f.antipattern}  ${f.file}:${f.line}`);
    console.error(`      ${f.snippet || f.name}`);
  }
  console.error(`\nFix them, or (if intentional) waive with an impeccable-disable comment / update baseline.json.\n`);
  process.exit(1);
}

console.log(`✔ No new findings beyond baseline (${base.size} baselined).`);
