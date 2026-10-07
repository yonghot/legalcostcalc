import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import "./helpers/render";
import RootLayout from "@/app/layout";
import HomePage from "@/app/page";
import StateHubPage from "@/app/[state]/page";
import StateCategoryPage from "@/app/[state]/[slug]/page";
import CategoryHubPage from "@/app/category/[category]/page";

type Restore = () => void;

// No DOM exists in this repo's test environment, so hydrateRoot cannot run; React #418 is raised exactly when
// the client's first render text differs from the server HTML, so equal markup across zones and locales is the check.
function overrideDefaultLocale(locale: string): Restore {
  const restores: Restore[] = [];
  const patchMethod = (proto: object, name: string) => {
    const target = proto as Record<string, (this: unknown, locales?: unknown, ...rest: unknown[]) => unknown>;
    const original = target[name];
    target[name] = function (locales, ...rest) {
      return original.call(this, locales === undefined ? locale : locales, ...rest);
    };
    restores.push(() => {
      target[name] = original;
    });
  };
  patchMethod(Date.prototype, "toLocaleDateString");
  patchMethod(Date.prototype, "toLocaleTimeString");
  patchMethod(Date.prototype, "toLocaleString");
  patchMethod(Number.prototype, "toLocaleString");
  patchMethod(String.prototype, "localeCompare");
  const intl = Intl as unknown as Record<string, { new (l?: unknown, o?: unknown): unknown; prototype: object; supportedLocalesOf: unknown }>;
  for (const name of ["DateTimeFormat", "NumberFormat", "Collator", "PluralRules", "RelativeTimeFormat", "ListFormat"]) {
    const Original = intl[name];
    const Patched = function (locales?: unknown, options?: unknown) {
      return new Original(locales === undefined ? locale : locales, options);
    } as unknown as typeof Original;
    Patched.prototype = Original.prototype;
    Patched.supportedLocalesOf = Original.supportedLocalesOf;
    intl[name] = Patched;
    restores.push(() => {
      intl[name] = Original;
    });
  }
  return () => restores.reverse().forEach((r) => r());
}

interface Visitor {
  name: string;
  tz: string;
  locale: string;
}

const SERVER: Visitor = { name: "server", tz: "UTC", locale: "en-US" };
const VISITORS: Visitor[] = [
  { name: "UTC+14 ko-KR", tz: "Pacific/Kiritimati", locale: "ko-KR" },
  { name: "Los Angeles de-DE", tz: "America/Los_Angeles", locale: "de-DE" },
  { name: "Kolkata ja-JP", tz: "Asia/Kolkata", locale: "ja-JP" },
];

const originalTz = process.env.TZ;

async function renderAs(visitor: Visitor, build: () => Promise<ReactNode> | ReactNode): Promise<string> {
  process.env.TZ = visitor.tz;
  const restore = overrideDefaultLocale(visitor.locale);
  try {
    return renderToString(createElement(RootLayout, null, await build()));
  } finally {
    restore();
  }
}

afterEach(() => {
  if (originalTz === undefined) delete process.env.TZ;
  else process.env.TZ = originalTz;
});

const PAGES: Array<{ name: string; build: () => Promise<ReactNode> | ReactNode }> = [
  { name: "home", build: () => createElement(HomePage) },
  {
    name: "state/matter page",
    build: async () =>
      StateCategoryPage({ params: Promise.resolve({ state: "massachusetts", slug: "bankruptcy-cost" }) }),
  },
  { name: "state hub", build: async () => StateHubPage({ params: Promise.resolve({ state: "florida" }) }) },
  {
    name: "category hub",
    build: async () => CategoryHubPage({ params: Promise.resolve({ category: "bankruptcy" }) }),
  },
];

describe("server markup is identical for visitors in other time zones and locales (React #418)", () => {
  for (const page of PAGES) {
    it(`${page.name} renders the same text for every visitor`, async () => {
      const server = await renderAs(SERVER, page.build);
      expect(server.length).toBeGreaterThan(1000);
      for (const visitor of VISITORS) {
        const client = await renderAs(visitor, page.build);
        expect(client === server, `${page.name}: ${visitor.name} differs from the server markup`).toBe(true);
      }
    });
  }

  it("positive control: the override really changes locale-default and zone-default formatting", () => {
    const sample = () =>
      new Date("2026-01-01T03:00:00Z").toLocaleDateString() + "|" + (1234567.5).toLocaleString() + "|" +
      new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date("2026-01-01T03:00:00Z"));
    process.env.TZ = SERVER.tz;
    const restoreServer = overrideDefaultLocale(SERVER.locale);
    const server = sample();
    restoreServer();
    process.env.TZ = VISITORS[1].tz;
    const restoreVisitor = overrideDefaultLocale(VISITORS[1].locale);
    const visitor = sample();
    restoreVisitor();
    expect(visitor).not.toBe(server);
  });

  it("positive control: a component that formats a date without zone and locale is caught by this comparison", async () => {
    const leaky = () => createElement("p", null, new Date("2026-01-01T03:00:00Z").toLocaleDateString());
    const server = await renderAs(SERVER, leaky as never);
    const client = await renderAs(VISITORS[1], leaky as never);
    expect(client).not.toBe(server);
  });
});
