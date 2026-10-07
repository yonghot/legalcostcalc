import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { renderPage } from "./helpers/render";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { HubLinks } from "@/components/seo/hub-links";
import { HubLinksBar } from "@/components/seo/hub-links-bar";
import { ResultShare } from "@/components/shared/result-share";
import { ClearMyData } from "@/components/shared/clear-my-data";
import { ContinueBanner } from "@/components/shared/continue-banner";
import { readFileSync } from "node:fs";
import path from "node:path";
import CategoryHubPage from "@/app/category/[category]/page";
import DivorceHubPage from "@/app/divorce-cost-by-state/page";
import StateHubPage from "@/app/[state]/page";
import { CATEGORIES } from "@/lib/constants/categories";

function classOf(tag: string): string {
  return tag.match(/\bclass="([^"]*)"/)?.[1] ?? "";
}

function controlsIn(html: string): string[] {
  return [...html.matchAll(/<(?:a|button)\b[^>]*>/g)].map((m) => m[0]);
}

describe("UX P1-2 / P1-4: 44px tap targets in site chrome and hub links that lead to hubs", () => {
  const footer = renderToStaticMarkup(createElement(Footer));
  const lists = [...footer.matchAll(/<ul\b[^>]*>[\s\S]*?<\/ul>/g)].map((m) => m[0]);

  it("every footer list link and button is at least 44px high on touch widths", () => {
    expect(lists.length).toBe(2);
    const controls = lists.flatMap(controlsIn);
    expect(controls.length).toBeGreaterThanOrEqual(20);
    for (const tag of controls) expect(classOf(tag), tag).toContain("min-h-11");
  });

  it("the footer category list points at the eight category hubs, not at one state's matter pages", () => {
    const hrefs = [...lists[0].matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    expect(hrefs).toEqual(CATEGORIES.map((c) => `/category/${c.slug}`));
  });

  it("header links, the menu button and the menu items reach 44px", () => {
    const header = renderToStaticMarkup(createElement(Header));
    const links = controlsIn(header).filter((t) => /href="\/(compare|settlement-estimator|how-legal-fees-work|about)"/.test(t));
    expect(links.length).toBeGreaterThanOrEqual(4);
    for (const tag of links) expect(classOf(tag), tag).toContain("py-3");
    const menu = controlsIn(header).find((t) => t.includes('aria-label="Open menu"'));
    expect(menu).toBeDefined();
    expect(classOf(menu!)).toContain("h-11");
    expect(classOf(menu!)).toContain("w-11");
  });

  it("breadcrumb links have a 44px hit area", () => {
    const html = renderToStaticMarkup(
      createElement(Breadcrumbs, {
        items: [
          { name: "Home", href: "/" },
          { name: "Texas", href: "/texas" },
          { name: "Divorce", href: "/texas/divorce-cost" },
        ],
      }),
    );
    const links = controlsIn(html);
    expect(links).toHaveLength(2);
    for (const tag of links) expect(classOf(tag), tag).toContain("py-3");
  });

  it("the View details buttons in hub tables are 44px high on touch widths", async () => {
    const hub = renderToStaticMarkup(
      createElement(HubLinks, { rows: [{ key: "TX", label: "Texas", href: "/texas/divorce-cost", medianCost: 8000 }], labelHeader: "State" }),
    );
    const divorce = await renderPage(DivorceHubPage as never);
    for (const html of [hub, divorce]) {
      const buttons = controlsIn(html).filter((t) => t.includes("bg-teal-700"));
      expect(buttons.length).toBeGreaterThan(0);
      for (const tag of buttons) expect(classOf(tag), tag).toContain("min-h-11");
    }
  });

  it("hub chips, the copy-link button, clear-my-data and the continue banner reach 44px", () => {
    const noop = () => {};
    const rendered = [
      renderToStaticMarkup(createElement(HubLinksBar, { stateSlug: "texas", stateName: "Texas", categorySlug: "dui", categoryName: "DUI" })),
      renderToStaticMarkup(createElement(ResultShare, { calcType: "dui" })),
      renderToStaticMarkup(createElement(ClearMyData, {})),
      renderToStaticMarkup(createElement(ContinueBanner, { onApply: noop, onDismiss: noop })),
    ];
    for (const html of rendered) {
      const controls = controlsIn(html);
      expect(controls.length).toBeGreaterThan(0);
      for (const tag of controls) expect(classOf(tag), tag).toContain("min-h-11");
    }
  });

  it("the cookie banner and the contact form buttons reach 44px", () => {
    const root = path.resolve(__dirname, "..", "..", "src", "components");
    const banner = readFileSync(path.join(root, "consent/cookie-consent-banner.tsx"), "utf8");
    expect(banner.match(/min-h-11 rounded-md/g)?.length).toBe(2);
    const contact = readFileSync(path.join(root, "shared/contact-form.tsx"), "utf8");
    expect(contact).toContain("inline-flex min-h-11 items-center gap-2 rounded-md bg-teal-700");
  });

  it("the back link on a hub says where it goes: the calculator", async () => {
    for (const html of [
      await renderPage(CategoryHubPage, { category: "bankruptcy" }),
      await renderPage(StateHubPage, { state: "florida" }),
    ]) {
      const link = html.match(/<a\b[^>]*href="\/"[^>]*>(?:[^<]*←[^<]*)<\/a>/);
      expect(link, "back link").not.toBeNull();
      expect(link![0]).toContain("Calculate your own estimate");
      expect(classOf(link![0])).toContain("py-3");
    }
  });
});
