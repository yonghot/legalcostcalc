import { describe, expect, it } from "vitest";
import { renderPage } from "./helpers/render";
import StateCategoryPage from "@/app/[state]/[slug]/page";
import { CATEGORIES } from "@/lib/constants/categories";
import { STATES } from "@/lib/constants/states";
import { hasUniqueData } from "@/lib/page-index";
import { seedRow, type Tier } from "./helpers/k4a-oracle";

const TIERS: Tier[] = ["simple", "moderate", "complex"];

describe("r3-truth-R3-W8: a page that shows seed figures never says that same data is being collected", () => {
  const gated = STATES.flatMap((s) => CATEGORIES.filter((c) => !hasUniqueData(s.code, c.slug)).map((c) => ({ s, c })));

  it("each 'currently being collected' answer appears only when the seed has no row (or no rate, or no duration) for the pair", async () => {
    let withRows = 0;
    let costClaimsWithheld = 0;
    let hourlyClaimsKept = 0;
    let durationClaimsWithheld = 0;
    const bad: string[] = [];
    for (const { s, c } of gated) {
      const rows = TIERS.flatMap((tier) => seedRow(c.slug, tier, s.code) ?? []);
      const html = await renderPage(StateCategoryPage, { state: s.slug, slug: `${c.slug}-cost` });
      const label = c.displayName.toLowerCase();
      const says = {
        cost: html.includes(`Cost data for ${label} in ${s.name} is currently being collected.`),
        hourly: html.includes(`Hourly rate data for ${s.name} is currently being collected.`),
        duration: html.includes(`Duration data for ${label} in ${s.name} is currently being collected.`),
      };
      const missing = { cost: rows.length === 0, hourly: !rows.some((r) => r.rate > 0), duration: !rows.some((r) => r.duration) };
      if (rows.length > 0) withRows++;
      if (rows.length > 0 && !says.cost) costClaimsWithheld++;
      if (says.hourly && missing.hourly) hourlyClaimsKept++;
      if (rows.some((r) => r.duration) && !says.duration) durationClaimsWithheld++;
      for (const key of ["cost", "hourly", "duration"] as const) {
        if (says[key] !== missing[key]) bad.push(`${s.name}/${c.slug}: ${key} says collecting=${says[key]} but data missing=${missing[key]}`);
      }
    }
    expect(withRows).toBeGreaterThan(30);
    expect(costClaimsWithheld).toBe(withRows);
    expect(hourlyClaimsKept).toBeGreaterThan(5);
    expect(durationClaimsWithheld).toBeGreaterThan(30);
    expect(bad).toEqual([]);
  }, 120_000);
});

describe("r3-truth-R3-W9: the DUI classification answer asserts nothing that differs by state", () => {
  const dui = CATEGORIES.find((c) => c.slug === "dui")!;
  const template = dui.faqTemplates!.find((t) => /misdemeanor or felony/.test(t.questionTemplate))!;
  const answerFor = (name: string) => template.answerTemplate.replace(/\{state\}/g, name);

  it("no state's answer says its first-time DUI 'is charged as a misdemeanor', and the answer differs between states only by name", () => {
    const stateNames = STATES.map((s) => s.name);
    expect(stateNames.length).toBe(51);
    const bad: string[] = [];
    const shapes = new Set<string>();
    for (const name of stateNames) {
      const answer = answerFor(name);
      if (/is charged as a misdemeanor|In most cases/.test(answer)) bad.push(`${name}: asserts a classification`);
      if (!answer.includes(`depends on ${name} law`)) bad.push(`${name}: does not defer to the state's law`);
      shapes.add(answer.split(name).join("{state}"));
    }
    expect(bad).toEqual([]);
    expect(shapes.size).toBe(1);
  });

  it("the rendered New Jersey and Wisconsin pages carry that answer", async () => {
    for (const state of STATES.filter((s) => s.code === "NJ" || s.code === "WI")) {
      const html = await renderPage(StateCategoryPage, { state: state.slug, slug: "dui-cost" });
      expect(html, state.name).toContain(`depends on ${state.name} law`);
      expect(html, state.name).not.toMatch(/is charged as a misdemeanor/);
    }
  }, 60_000);
});
