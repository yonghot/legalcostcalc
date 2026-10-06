import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderPage } from "./helpers/render";
import { PUBLISHER } from "@/lib/constants/publisher";
import AboutPage from "@/app/about/page";
import ContactPage from "@/app/contact/page";
import PrivacyPage from "@/app/privacy/page";
import TermsPage from "@/app/terms/page";

const SRC = join(__dirname, "..", "..", "src");
const OWN_DOMAIN_MAILBOX = /[\w.+-]+@legalcostcalc\.co/i;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(tsx|ts)$/.test(name) ? [path] : [];
  });
}

describe("K6: no mailbox on the site's own domain (it has no MX record and cannot receive mail)", () => {
  it("no source file names a mailbox on legalcostcalc.co", () => {
    const offenders = sourceFiles(SRC)
      .filter((f) => OWN_DOMAIN_MAILBOX.test(readFileSync(f, "utf8")))
      .map((f) => f.slice(SRC.length + 1));
    expect(offenders).toEqual([]);
  });

  it("the contact page no longer depends on an owner-set email env var", () => {
    const src = readFileSync(join(SRC, "app", "contact", "page.tsx"), "utf8");
    expect(src).not.toContain("NEXT_PUBLIC_CONTACT_EMAIL");
  });

  const pages: Array<[string, () => Promise<string>]> = [
    ["/about", () => renderPage(AboutPage)],
    ["/contact", () => renderPage(ContactPage)],
    ["/terms", () => renderPage(TermsPage)],
    ["/privacy", () => renderPage(PrivacyPage)],
  ];

  it.each(pages)("%s names the publisher, links its site and offers only the publisher mailbox", async (_path, render) => {
    const html = await render();
    expect(html).not.toMatch(OWN_DOMAIN_MAILBOX);
    expect(html).toContain("is published by");
    expect(html).toContain(`href="${PUBLISHER.url}"`);
    expect(html).toContain(PUBLISHER.name);
    expect(html).toContain(PUBLISHER.email);
  });

  it.each(["/contact", "/terms", "/privacy"])("%s links the publisher mailbox", async (path) => {
    const render = pages.find(([p]) => p === path)![1];
    expect(await render()).toContain(`href="mailto:${PUBLISHER.email}"`);
  });

  it.each(["/about", "/contact"])("%s states how to request a correction", async (path) => {
    const render = pages.find(([p]) => p === path)![1];
    expect(await render()).toContain(PUBLISHER.correctionText);
  });
});
