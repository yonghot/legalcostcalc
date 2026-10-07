import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { setPathname } from "./helpers/render";
import { SiteChrome } from "@/components/layout/site-chrome";
import { Footer } from "@/components/layout/footer";
import { FeedbackWidget } from "@/components/shared/feedback-widget";
import { FeedbackLink } from "@/components/shared/feedback-link";
import { OPEN_FEEDBACK_EVENT, openFeedback } from "@/components/shared/feedback-events";

const ROOT = join(__dirname, "..", "..");
const SRC = join(ROOT, "src");

const PERSISTENT = ["src/components/layout/header.tsx", "src/components/shared/feedback-widget.tsx"];
const OPENED_BY_THE_VISITOR = ["src/components/consent/cookie-consent-banner.tsx", "src/components/ui/sheet.tsx"];
const POSITIONED = /(?<![\w:-])(?:fixed|sticky)\s+(?:inset-|top-|bottom-|left-|right-|z-)/;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("K18: fixed and sticky elements stay clear of Auto-ads anchor and vignette zones", () => {
  it("only the sticky header, the feedback button and two visitor-opened surfaces use fixed or sticky", () => {
    const hits = walk(SRC)
      .filter((f) => /\.(tsx|css)$/.test(f))
      .filter((f) => POSITIONED.test(readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "")))
      .map((f) => relative(ROOT, f).split(sep).join("/"))
      .sort();
    expect(hits).toEqual([...PERSISTENT, ...OPENED_BY_THE_VISITOR].sort());
  });

  it("the consent banner is not in the initial render", () => {
    setPathname("/");
    const html = renderToStaticMarkup(createElement(SiteChrome, null, createElement("p", null, "content")));
    expect(html).not.toContain("Cookie consent");
    expect(html).not.toMatch(/fixed bottom-0/);
  });

  it("the feedback button is hidden below the desktop breakpoint and is a 44px target", () => {
    const html = renderToStaticMarkup(createElement(FeedbackWidget));
    const wrapper = html.match(/<div class="([^"]*)"/)?.[1] ?? "";
    expect(wrapper).toMatch(/\bfixed\b/);
    expect(wrapper).toMatch(/\bhidden\b/);
    expect(wrapper).toMatch(/\blg:block\b/);
    expect(wrapper).not.toMatch(/\b(left-0|right-0|inset-x-0|w-full)\b/);
    const button = html.match(/<button[^>]*>/)?.[0] ?? "";
    expect(button).toMatch(/\bmin-h-11\b/);
    expect(button).toMatch(/\bmin-w-11\b/);
  });

  it("the footer offers the same panel as a text control on every screen size", () => {
    const html = renderToStaticMarkup(createElement(Footer));
    expect(html).toMatch(/<button[^>]*>Send feedback<\/button>/);
    expect(renderToStaticMarkup(createElement(FeedbackLink, { className: "x" }))).toBe(
      '<button type="button" class="x">Send feedback</button>',
    );
  });

  it("openFeedback signals the widget, which listens for the same event", () => {
    const target = new EventTarget();
    vi.stubGlobal("window", target);
    const seen = vi.fn();
    target.addEventListener(OPEN_FEEDBACK_EVENT, seen);
    openFeedback();
    expect(seen).toHaveBeenCalledTimes(1);
    const widget = readFileSync(join(SRC, "components", "shared", "feedback-widget.tsx"), "utf8");
    expect(widget).toMatch(/addEventListener\(OPEN_FEEDBACK_EVENT/);
  });
});
