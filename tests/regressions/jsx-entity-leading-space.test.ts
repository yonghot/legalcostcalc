import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

/*
 * The production build (Next/SWC) drops the leading space of a multi-line JSX text node that follows an element or an
 * {expression} and contains an HTML entity (&apos; &quot; &middot; ...). Vitest keeps the space, so only the built HTML
 * shows "Alabamaby tier" or "</strong>link". The fix is an explicit {" "} in front of the text.
 */

const ROOT = join(__dirname, "..", "..", "src");
const ENTITY = /&(?:[a-zA-Z]+|#\d+);/;
const rel = (file: string) => relative(join(ROOT, ".."), file).split(sep).join("/");

function isCommentOnly(node: ts.Node): boolean {
  return ts.isJsxExpression(node) && !node.expression;
}

function findEntityLeadingSpace(source: string, fileName = "fixture.tsx"): number[] {
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const lines: number[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
      node.children.forEach((kid, i) => {
        if (kid.kind !== ts.SyntaxKind.JsxText) return;
        const prev = node.children[i - 1];
        if (!prev || prev.kind === ts.SyntaxKind.JsxText || isCommentOnly(prev)) return;
        const raw = kid.getFullText();
        if (/^[ \t]+\S/.test(raw) && raw.includes("\n") && ENTITY.test(raw)) {
          lines.push(sf.getLineAndCharacterOfPosition(kid.getStart()).line + 1);
        }
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return lines;
}

function listTsx(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) listTsx(full, out);
    else if (entry.name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

describe("findEntityLeadingSpace (rule fixtures)", () => {
  it("flags multi-line text with an entity right after an expression or an element", () => {
    expect(findEntityLeadingSpace("const A = () => (<p>\n  {n} is the model&apos;s\n  value\n</p>);")).toEqual([2]);
    expect(findEntityLeadingSpace("const A = () => (<p>\n  <em>x</em> the model&apos;s\n  value\n</p>);")).toEqual([2]);
    expect(findEntityLeadingSpace("const A = () => (<p>\n  <strong>not</strong> sell &quot;data&quot;\n  here\n</p>);")).toEqual([2]);
  });

  it("accepts an explicit space expression in front of the text", () => {
    expect(findEntityLeadingSpace('const A = () => (<p>\n  {n}{" "}is the model&apos;s\n  value\n</p>);')).toEqual([]);
  });

  it("accepts text without an entity, single-line text, and text that starts a new line", () => {
    expect(findEntityLeadingSpace("const A = () => (<p>\n  {n} is a value\n  on two lines\n</p>);")).toEqual([]);
    expect(findEntityLeadingSpace("const A = () => (<p>{n} is the model&apos;s value</p>);")).toEqual([]);
    expect(findEntityLeadingSpace("const A = () => (<p>\n  {n}\n  is the model&apos;s value\n</p>);")).toEqual([]);
  });
});

describe("JSX text after an expression or element", () => {
  it("never begins with a space on a multi-line text that contains an entity (src/**/*.tsx)", () => {
    const files = listTsx(ROOT);
    expect(files.length).toBeGreaterThan(100);
    const problems: string[] = [];
    for (const file of files) {
      for (const line of findEntityLeadingSpace(readFileSync(file, "utf8"), file)) problems.push(`${rel(file)}:${line}`);
    }
    expect(problems).toEqual([]);
  });
});
