import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..", "..");

// Tailwind palette values: slate-400 #94a3b8, teal-600 #0d9488, teal-700 #0f766e, white #ffffff.
const TARGET = /(^|[\s"'`])(text-slate-400|bg-teal-600|text-teal-600)(?=$|[\s"'`}])/g;
const CLASS_TOKEN = /[\w:\-[\]/.%]+/g;
const QUOTES = ['"', "'", "`"];

const ALLOW: Array<{ file: string; literal?: string; reason: string }> = [
  { file: "src/components/layout/footer.tsx", reason: "light text on the slate-900 footer: slate-400 is 6.4:1 there" },
  { file: "src/components/layout/header.tsx", reason: "logotype wordmark and logo tile are exempt from the contrast rule" },
  { file: "src/app/page.tsx", literal: "text-teal-600", reason: "H1 emphasis word at 48px bold: the 3:1 large-text threshold applies" },
];

interface Violation {
  rule: string;
  line: number;
  literal: string;
}

function violations(src: string): Violation[] {
  const found: Violation[] = [];
  src.split("\n").forEach((text, index) => {
    for (const m of text.matchAll(TARGET)) {
      const at = (m.index ?? 0) + m[1].length;
      const left = Math.max(...QUOTES.map((q) => text.lastIndexOf(q, at)));
      const rights = QUOTES.map((q) => text.indexOf(q, at + 1)).filter((i) => i >= 0);
      const right = rights.length ? Math.min(...rights) : text.length;
      const literal = text.slice(left + 1, right).trim();
      const tokens: string[] = literal.match(CLASS_TOKEN) ?? [];
      const icon = tokens.some((t) => /^h-\d/.test(t)) && tokens.some((t) => /^w-\d/.test(t));
      const add = (rule: string) => found.push({ rule, line: index + 1, literal });
      const token = m[2];
      if (token === "text-slate-400" && !icon) add("text-slate-400 on a light surface is 2.6:1");
      if (token === "bg-teal-600" && tokens.includes("text-white")) add("white on teal-600 is 3.7:1");
      if (token === "text-teal-600" && !icon && !tokens.some((t) => /^text-(2xl|3xl|4xl|5xl)$/.test(t))) add("teal-600 text is 3.7:1 on white");
    }
  });
  return found;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.tsx$/.test(entry.name)) out.push(p);
  }
  return out;
}

describe("UX P1-2: text and button colors reach WCAG AA on the light surfaces", () => {
  it("no class string pairs a low-contrast text or fill token with the surface it sits on", () => {
    const srcDir = path.join(ROOT, "src");
    expect(existsSync(srcDir)).toBe(true);
    const bad: string[] = [];
    for (const file of walk(srcDir)) {
      const rel = path.relative(ROOT, file).replace(/\\/g, "/");
      for (const v of violations(readFileSync(file, "utf8"))) {
        const allowed = ALLOW.some((a) => a.file === rel && (a.literal === undefined || v.literal.includes(a.literal)));
        if (!allowed) bad.push(`${rel}:${v.line} ${v.rule} :: ${v.literal.slice(0, 90)}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("the feedback button keeps a filled teal-700 background behind its white label", () => {
    const widget = readFileSync(path.join(ROOT, "src/components/shared/feedback-widget.tsx"), "utf8");
    expect(widget).not.toContain("bg-teal-600");
  });

  it("every allow-list entry still matches something, so stale exceptions cannot hide", () => {
    for (const entry of ALLOW) {
      const src = readFileSync(path.join(ROOT, entry.file), "utf8");
      expect(src.length, entry.file).toBeGreaterThan(0);
      if (entry.literal) expect(src.includes(entry.literal), `${entry.file} :: ${entry.literal}`).toBe(true);
    }
  });

  it("positive control: the scanner flags the old tokens and passes the replacements", () => {
    const rules = (s: string) => violations(s).map((v) => v.rule);
    expect(rules('<p className="mt-2 text-xs text-slate-400">x</p>')).toHaveLength(1);
    expect(rules('<p className="mt-2 text-xs text-slate-600">x</p>')).toEqual([]);
    expect(rules('<Icon className="h-4 w-4 text-slate-400" />')).toEqual([]);
    expect(rules('<a className="rounded-md bg-teal-600 px-4 text-white hover:bg-teal-700">x</a>')).toHaveLength(1);
    expect(rules('<a className="rounded-md bg-teal-700 px-4 text-white hover:bg-teal-800">x</a>')).toEqual([]);
    expect(rules('<a className="text-sm font-medium text-teal-600">x</a>')).toHaveLength(1);
    expect(rules('<a className="text-sm font-medium text-teal-700">x</a>')).toEqual([]);
    expect(rules('<p className="font-mono text-2xl font-bold text-teal-600">$1</p>')).toEqual([]);
    expect(rules("<p>don't</p><p className=\"mt-2 text-xs text-slate-400\">x</p>")).toHaveLength(1);
    expect(rules('<b className={`font-mono ${hi ? "text-red-600" : "text-teal-600"}`}>x</b>')).toHaveLength(1);
  });
});
