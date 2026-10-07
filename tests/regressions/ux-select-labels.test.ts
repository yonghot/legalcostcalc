import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import path from "node:path";
import "./helpers/render";
import { CostCalculator } from "@/components/calculator/cost-calculator";
import { ComparisonForm, type CompareMode } from "@/components/compare/comparison-form";
import { CATEGORIES } from "@/lib/constants/categories";
import { STATES } from "@/lib/constants/states";

const read = (rel: string) => readFileSync(path.resolve(__dirname, "../..", rel), "utf8");

function triggerValue(html: string, id: string): string {
  const trigger = html.match(new RegExp(`<button[^>]*id="${id}"[^>]*>([\\s\\S]*?)</button>`));
  expect(trigger, `trigger #${id}`).not.toBeNull();
  const value = trigger![1].match(/<span[^>]*data-slot="select-value"[^>]*>([\s\S]*?)<\/span>/);
  expect(value, `select value in #${id}`).not.toBeNull();
  return value![1].replace(/<[^>]+>/g, "").trim();
}

describe("UX P0-2d: the selects show labels, not raw values", () => {
  const html = renderToStaticMarkup(
    createElement(CostCalculator, { initialCategory: "bankruptcy", initialState: "MA" }),
  );

  it("the category trigger shows the display name", () => {
    expect(triggerValue(html, "category")).toBe("Bankruptcy");
  });

  it("the state trigger shows the state name", () => {
    expect(triggerValue(html, "state")).toBe("Massachusetts");
  });

  it("the complexity trigger shows the capitalised label", () => {
    expect(triggerValue(html, "complexity")).toBe("Moderate");
  });

  it("no trigger shows a category slug, a state code or a lowercase complexity value", () => {
    const raw = new Set([...CATEGORIES.map((c) => c.slug), ...STATES.map((s) => s.code), "simple", "moderate", "complex"]);
    for (const id of ["category", "state", "complexity"]) {
      expect(raw.has(triggerValue(html, id)), id).toBe(false);
    }
  });

  it("an empty selection keeps the placeholder", () => {
    const empty = renderToStaticMarkup(createElement(CostCalculator, {}));
    expect(triggerValue(empty, "category")).toBe("Select category...");
    expect(triggerValue(empty, "state")).toBe("Select state...");
  });

  it("every display-name pair is unique so a label identifies exactly one value", () => {
    const names = STATES.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
    const categoryNames = CATEGORIES.map((c) => c.displayName);
    expect(new Set(categoryNames).size).toBe(categoryNames.length);
  });
});

describe("UX P0-2d: the compare selects show labels, not raw values", () => {
  const noop = () => {};
  const form = (mode: CompareMode, values: { state1: string; state2: string; category: string; category2: string }) =>
    renderToStaticMarkup(
      createElement(ComparisonForm, {
        mode,
        onModeChange: noop,
        onState1Change: noop,
        onState2Change: noop,
        onCategoryChange: noop,
        onCategory2Change: noop,
        onCompare: noop,
        isFormValid: true,
        loading: false,
        ...values,
      }),
    );
  const filled = { state1: "CA", state2: "TX", category: "divorce", category2: "dui" };
  const empty = { state1: "", state2: "", category: "", category2: "" };

  it("states mode: both state triggers and the category trigger show display names", () => {
    const html = form("states", filled);
    expect(triggerValue(html, "compare-state-1")).toBe("California");
    expect(triggerValue(html, "compare-state-2")).toBe("Texas");
    expect(triggerValue(html, "compare-category")).toBe("Divorce");
  });

  it("categories mode: the state trigger and both category triggers show display names", () => {
    const html = form("categories", filled);
    expect(triggerValue(html, "compare-state")).toBe("California");
    expect(triggerValue(html, "compare-category-1")).toBe("Divorce");
    expect(triggerValue(html, "compare-category-2")).toBe("DUI / DWI");
  });

  it("no compare trigger shows a category slug or a state code, in either mode", () => {
    const raw = new Set([...CATEGORIES.map((c) => c.slug), ...STATES.map((s) => s.code)]);
    const states = form("states", filled);
    const categories = form("categories", filled);
    for (const id of ["compare-state-1", "compare-state-2", "compare-category"]) expect(raw.has(triggerValue(states, id)), id).toBe(false);
    for (const id of ["compare-state", "compare-category-1", "compare-category-2"]) expect(raw.has(triggerValue(categories, id)), id).toBe(false);
  });

  it("an empty selection keeps the placeholder", () => {
    expect(triggerValue(form("states", empty), "compare-state-1")).toBe("Select...");
    expect(triggerValue(form("categories", empty), "compare-category-2")).toBe("Select...");
  });
});

describe("UX P0-2e: select triggers and options are 44px targets", () => {
  it("the default trigger is h-11 and no longer h-8", () => {
    const src = read("src/components/ui/select.tsx");
    expect(src).toContain("data-[size=default]:h-11");
    expect(src).not.toContain("data-[size=default]:h-8");
  });

  it("the rendered calculator triggers carry the 44px height", () => {
    const html = renderToStaticMarkup(createElement(CostCalculator, {}));
    const triggers = html.match(/data-slot="select-trigger"[^>]*class="[^"]*"/g) ?? [];
    expect(triggers).toHaveLength(3);
    for (const t of triggers) expect(t).toContain("data-[size=default]:h-11");
  });

  it("dropdown options are at least 44px tall", () => {
    const src = read("src/components/ui/select.tsx");
    const item = src.slice(src.indexOf("function SelectItem"), src.indexOf("function SelectSeparator"));
    expect(item).toContain("min-h-11");
  });
});
