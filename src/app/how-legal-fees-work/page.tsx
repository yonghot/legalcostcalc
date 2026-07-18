import { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Disclaimer } from "@/components/shared/disclaimer";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { ArticleSchema } from "@/components/seo/article-schema";
import { AuthorByline } from "@/components/shared/author-byline";
import { UpdatedBadge } from "@/components/shared/updated-badge";
import { buildMeta, CANONICAL_ORIGIN } from "@/lib/seo";
import { DEFAULT_STATE_SLUG } from "@/lib/constants/costs";
import {
  GUIDE_UPDATED,
  GUIDE_FACTS,
  GUIDE_SECTIONS,
  GUIDE_SOURCES,
  GUIDE_VERIFY_NOTES,
} from "./content";

const PAGE_PATH = "/how-legal-fees-work";
const TITLE = "How Legal Fees Work (2026): Hourly vs. Flat vs. Contingency";
const DESCRIPTION =
  "An informational 2026 guide to how attorney fees work: hourly billing, flat fees, contingency fees, retainers and trust accounts, the professional-conduct rules that govern them, and where fee disputes go — every rule and figure tied to an official source. Not legal advice.";

// U-02 (부속U §4/§5) — original editorial guide, INFORMATIONAL ONLY. Explains
// fee structures and the professional-conduct rules that govern them; makes
// no claim about what a specific case will cost. Modeled on LaunchCostCalc's
// /how-to-start-an-llc guide (commit 2746a0a). Static, hand-authored content
// (skipFit — this is a fixed guide title, not a generated one, matching the
// convention already used by about/page.tsx, contact/page.tsx, and
// settlement-estimator/page.tsx for hand-crafted static titles).
export const metadata: Metadata = buildMeta({
  title: TITLE,
  description: DESCRIPTION,
  path: PAGE_PATH,
  skipFit: true,
});

// The first section is the framing intro; the rest are the numbered body
// sections (same intro/steps split as LaunchCostCalc's guide).
const INTRO = GUIDE_SECTIONS[0];
const BODY_SECTIONS = GUIDE_SECTIONS.slice(1);

const inContextLinkClass = "font-medium text-teal-700 underline hover:text-teal-800";

/**
 * U-05 (부속U §4/§5): in-context deep links from the guide into specific
 * calculator result pages + the statistics page, rendered immediately below
 * the body section whose own prose they extend — not a footer link dump
 * (mirrors LaunchCostCalc's IN_CONTEXT_LINKS pattern, how-to-start-an-llc's
 * page.tsx). Keyed by the exact GUIDE_SECTIONS heading. Every href below is
 * a real, quality-gated route (hasUniqueData true for CA/personal-injury,
 * NY/estate-planning, TX/dui — see src/lib/page-index.ts and
 * tests/calculator-presets.test.ts, which already establishes these exact
 * category/state combinations as real U-01 preset scenarios) — no invented
 * routes or figures.
 */
const IN_CONTEXT_LINKS: Record<string, ReactNode> = {
  "Hourly billing: paying for time, not for outcome": (
    <p className="mt-3 text-sm text-slate-600">
      See a real hourly-billing estimate:{" "}
      <Link href="/texas/dui-cost" className={inContextLinkClass}>
        Texas DUI defense cost
      </Link>{" "}
      — a typical hourly-billed matter where the total depends on how many
      hearings the case actually takes.
    </p>
  ),
  "Flat fees: one price for a defined piece of work": (
    <p className="mt-3 text-sm text-slate-600">
      Drafting a will is a classic flat-fee task:{" "}
      <Link href="/new-york/estate-planning-cost" className={inContextLinkClass}>
        New York estate planning cost
      </Link>{" "}
      shows a real flat-fee range by case complexity.
    </p>
  ),
  "Contingency fees: the lawyer is paid only if you recover money": (
    <p className="mt-3 text-sm text-slate-600">
      See the contingency-fee model in practice:{" "}
      <Link href="/california/personal-injury-cost" className={inContextLinkClass}>
        California personal injury cost
      </Link>{" "}
      — no hourly rate, just a percentage of any recovery.
    </p>
  ),
  "What a lawyer's hour actually costs, state by state": (
    <p className="mt-3 text-sm text-slate-600">
      Compare hourly-rate data across all 50 states + DC in the{" "}
      <Link href="/legal-cost-statistics" className={inContextLinkClass}>
        legal cost statistics
      </Link>{" "}
      page, sourced from the same dataset used throughout this site.
    </p>
  ),
};

export default function HowLegalFeesWorkPage() {
  const canonicalUrl = `${CANONICAL_ORIGIN}${PAGE_PATH}`;

  return (
    <div>
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "How Legal Fees Work", href: PAGE_PATH },
        ]}
      />

      {/* CODE-02 pattern: Article + BreadcrumbList only — no FAQPage/HowTo
          JSON-LD (deprecated for SERP display in 2026, per 부속U §7). */}
      <ArticleSchema
        headline={TITLE}
        description={DESCRIPTION}
        url={canonicalUrl}
        dateModified={GUIDE_UPDATED}
      />

      <section className="bg-gradient-to-b from-teal-50 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Disclaimer />

          <Breadcrumbs
            className="mt-8 mb-4"
            items={[
              { name: "Home", href: "/" },
              { name: "How Legal Fees Work", href: PAGE_PATH },
            ]}
          />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <UpdatedBadge lastVerified={GUIDE_UPDATED} />
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            How Legal Fees Work: Hourly vs. Flat vs. Contingency (2026)
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-600">
            Hourly billing, flat fees, contingency fees, and retainers explained —
            plus the professional-conduct rules that govern how fees are set,
            disclosed, and disputed. General information only, not legal advice.
          </p>

          <AuthorByline lastUpdated={GUIDE_UPDATED} className="mt-6" />
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Key facts at a glance */}
        <section
          aria-labelledby="key-facts"
          data-quick-answer="true"
          className="rounded-lg border border-teal-200 bg-teal-50 p-4 sm:p-5"
        >
          <h2
            id="key-facts"
            className="text-xs font-medium uppercase tracking-wide text-teal-700"
          >
            Legal fees at a glance (2026)
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
            {GUIDE_FACTS.map((f) => (
              <li key={f.fact} className="flex gap-2">
                <span aria-hidden="true" className="mt-1 text-teal-600">
                  &bull;
                </span>
                <span>
                  <strong className="text-slate-900">{f.fact}.</strong>{" "}
                  {f.detail}{" "}
                  <a
                    href={f.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-700 underline hover:text-teal-800"
                  >
                    Source
                  </a>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Intro prose */}
        {INTRO ? (
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {INTRO.heading}
            </h2>
            <p className="text-base leading-relaxed text-slate-700">{INTRO.prose}</p>
            {INTRO.bullets && INTRO.bullets.length > 0 ? (
              <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700">
                {INTRO.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            ) : null}
            <p className="text-sm text-slate-600">
              Want an estimated dollar range for a specific matter and state? Use
              the{" "}
              <Link
                href="/"
                className="font-medium text-teal-700 underline hover:text-teal-800"
              >
                legal cost calculator
              </Link>{" "}
              — it estimates a total cost range by state, matter type, and
              complexity from the same sourced dataset cited throughout this
              site.
            </p>
          </div>
        ) : null}

        {/* Numbered body sections */}
        <div className="mt-10 space-y-10">
          {BODY_SECTIONS.map((s) => (
            <section key={s.heading} aria-label={s.heading}>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {s.heading}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-slate-700">
                {s.prose}
              </p>
              {s.bullets && s.bullets.length > 0 ? (
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700">
                  {s.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ) : null}
              {IN_CONTEXT_LINKS[s.heading] ?? null}
            </section>
          ))}
        </div>

        {/* Volatile-figure callout (mirrors LaunchCostCalc's BOI-status
            callout pattern) — average rates and state dollar/percentage
            thresholds change; framed as "verify at the official source"
            rather than stated as permanent facts. */}
        <section
          aria-labelledby="verify-notes"
          className="mt-10 rounded-lg border border-amber-200 bg-amber-50 p-5"
        >
          <h2 id="verify-notes" className="text-sm font-semibold text-amber-800">
            Rates, caps, and dollar thresholds change — verify before relying on them
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
            {GUIDE_VERIFY_NOTES.map((note) => (
              <li key={note} className="flex gap-2">
                <span aria-hidden="true" className="mt-1 text-amber-600">
                  &bull;
                </span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-10">
          <Disclaimer />
        </div>

        {/* Sources */}
        <section aria-labelledby="sources" className="mt-10">
          <h2
            id="sources"
            className="text-sm font-medium uppercase tracking-wide text-slate-500"
          >
            Sources
          </h2>
          <ul className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
            {GUIDE_SOURCES.map((src) => (
              <li key={src.url}>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-700 underline hover:text-teal-800"
                >
                  {src.name}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Content last reviewed {GUIDE_UPDATED}. Fee rules, rates, and
            statutory dollar/percentage thresholds change — always confirm the
            current requirement with the official source before relying on it.
          </p>
        </section>

        {/* Related tools on this site */}
        <section aria-labelledby="related-tools" className="mt-10">
          <h2
            id="related-tools"
            className="text-sm font-medium uppercase tracking-wide text-slate-500"
          >
            Related tools on this site
          </h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li>
              <Link href="/" className="text-teal-700 underline hover:text-teal-800">
                Legal cost calculator
              </Link>{" "}
              — estimated cost ranges by state, matter type, and complexity
            </li>
            <li>
              <Link
                href={`/${DEFAULT_STATE_SLUG}/divorce-cost`}
                className="text-teal-700 underline hover:text-teal-800"
              >
                Divorce cost estimate
              </Link>
            </li>
            <li>
              <Link
                href={`/${DEFAULT_STATE_SLUG}/personal-injury-cost`}
                className="text-teal-700 underline hover:text-teal-800"
              >
                Personal injury lawyer cost estimate (contingency-fee example)
              </Link>
            </li>
            <li>
              <Link
                href="/legal-cost-statistics"
                className="text-teal-700 underline hover:text-teal-800"
              >
                Legal cost statistics by state
              </Link>
            </li>
            <li>
              <Link href="/about" className="text-teal-700 underline hover:text-teal-800">
                About &amp; methodology
              </Link>
            </li>
          </ul>
        </section>

        <AuthorByline lastUpdated={GUIDE_UPDATED} className="mt-8" />
      </div>
    </div>
  );
}
