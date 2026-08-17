// DRAFT — REQUIRES REVIEW BY A LICENSED US ATTORNEY BEFORE RELIANCE
// This Privacy Policy page is risk-mitigation copy prepared per an internal
// legal-risk report. It has not been reviewed by a licensed attorney and must
// not be relied upon as final legal language until that review occurs.

import type { Metadata } from "next";
import { Disclaimer } from "@/components/shared/disclaimer";
import { DATA_VERSION_DATE } from "@/lib/constants/data-meta";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How LegalCostCalc handles data, cookies, analytics (Plausible), advertising (Google AdSense), GDPR/CCPA rights, and affiliate links.",
  alternates: { canonical: "/privacy" },
};

// NOTE TO OPERATOR: Replace "LegalCostCalc" with your registered legal business
// name wherever the comment "LEGAL ENTITY" appears in this file.

/**
 * POLICY_EFFECTIVE_DATE — the legal effective date of this privacy policy.
 * This is intentionally separate from DATA_VERSION_DATE, which tracks when
 * cost data was last verified and drives sitemap/SEO signals.
 */
const POLICY_EFFECTIVE_DATE = "July 2, 2026";

const UPDATED = DATA_VERSION_DATE.toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default function PrivacyPage() {
  return (
    <div>
      <section className="bg-gradient-to-b from-teal-50 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Disclaimer />

          <h1 className="mt-8 text-3xl font-semibold text-slate-900 sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Effective date: {POLICY_EFFECTIVE_DATE} &middot; Last data update: {UPDATED}
          </p>

          <div className="mt-8 space-y-8 text-slate-700">
            <section>
              <h2 className="text-xl font-semibold text-slate-900">Overview</h2>
              <p className="mt-2 leading-relaxed">
                LegalCostCalc (&quot;we&quot;, &quot;us&quot;) provides free, informational
                estimates of legal costs. We do not require accounts and do not ask for
                personal information to use the calculator. This policy explains what limited
                data is collected automatically, the cookies used, and your choices.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">Information we collect</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
                <li>
                  <strong>No personal accounts.</strong> We do not collect names, emails, or
                  payment details. Cost lookups you run are not tied to your identity.
                </li>
                <li>
                  <strong>Calculator inputs.</strong> The category, state, and case-complexity
                  selections you make in the cost calculator are used only to request matching
                  cost ranges from our data. The Settlement Net Estimator&apos;s gross
                  settlement, contingency percentage, and case-cost figures are processed
                  entirely in your browser and are not transmitted to or stored on our servers.
                </li>
                <li>
                  <strong>Standard server logs.</strong> Our host (Vercel) and database
                  provider (Supabase) process technical data such as IP address and request
                  metadata to serve pages and apply basic rate limiting.
                </li>
                <li>
                  <strong>Analytics.</strong> We use{" "}
                  <a
                    href="https://plausible.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-700 underline"
                  >
                    Plausible Analytics
                  </a>
                  , a privacy-friendly, cookieless analytics service. Plausible
                  does <strong>not</strong> use cookies, does not collect or
                  store personal data, and does not build cross-site profiles.
                  Only aggregate page-view counts are recorded (configured via{" "}
                  <code className="text-sm">NEXT_PUBLIC_PLAUSIBLE_DOMAIN</code>
                  ). No consent is required for Plausible under GDPR because no
                  personal data is processed.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                Cookies &amp; advertising
              </h2>
              <p className="mt-2 leading-relaxed">
                We may display advertising provided by{" "}
                <strong>Google AdSense</strong> and its partners. This site uses{" "}
                <strong>Google Consent Mode v2</strong> to apply geo-differentiated
                cookie behavior. What loads on your first visit depends on where you are
                located:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
                <li>
                  <strong>EEA, UK, and Switzerland (opt-in).</strong> Visitors in the
                  European Economic Area, the United Kingdom, and Switzerland must
                  actively consent via our cookie/consent banner before personalized
                  advertising cookies or analytics cookies are set. Until consent is
                  given, Google AdSense runs in a non-personalized, limited mode that
                  does not use cookies for ad targeting.
                </li>
                <li>
                  <strong>All other countries, including the United States (notice and opt-out).</strong>{" "}
                  Visitors outside the EEA/UK/Switzerland encounter a notice-and-opt-out
                  model consistent with US privacy law (including CCPA). Advertising and
                  analytics cookies load on your first visit, and you may opt out or
                  withdraw consent at any time (see below).
                </li>
                <li>
                  <strong>Opting out.</strong> You may withdraw consent or opt out of
                  personalized advertising at any time by using the{" "}
                  <strong>cookie/consent controls in the site footer</strong>, by visiting{" "}
                  <a
                    href="https://www.google.com/settings/ads"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-700 underline"
                  >
                    Google Ad Settings
                  </a>
                  , or by opting out of third-party vendor cookies at{" "}
                  <a
                    href="https://www.aboutads.info"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-700 underline"
                  >
                    aboutads.info
                  </a>
                  .
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">Affiliate links</h2>
              <p className="mt-2 leading-relaxed">
                Some outbound links to legal-service providers are affiliate links; we may earn
                a commission at no extra cost to you if you use them. Affiliate relationships do
                not influence our cost data or estimates.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">Children&apos;s privacy</h2>
              <p className="mt-2 leading-relaxed">
                This site is intended for adults and is not directed to children under 13. We do
                not knowingly collect personal information from children.
              </p>
            </section>

            {/* ── Data Retention ─────────────────────────────────────────── */}
            <section>
              <h2 className="text-xl font-semibold text-slate-900">Data retention</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
                <li>
                  <strong>Plausible Analytics.</strong> Only aggregate, anonymous
                  page-view counts are stored — no personally identifiable
                  information is retained at any time.
                </li>
                <li>
                  <strong>Vercel server logs.</strong> Vercel retains standard
                  access logs (including IP addresses) for a limited period in
                  accordance with its{" "}
                  <a
                    href="https://vercel.com/legal/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-700 underline"
                  >
                    Privacy Policy
                  </a>
                  . We do not control that retention period.
                </li>
                <li>
                  <strong>Supabase logs.</strong> Supabase retains database
                  query logs per its own data-retention schedule as described in
                  the{" "}
                  <a
                    href="https://supabase.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-700 underline"
                  >
                    Supabase Privacy Policy
                  </a>
                  . No user-submitted personal data is stored in our database.
                </li>
                <li>
                  <strong>Google AdSense.</strong> Google retains advertising
                  data in accordance with its own policies — see{" "}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-700 underline"
                  >
                    Google&apos;s Privacy Policy
                  </a>{" "}
                  for details.
                </li>
                <li>
                  <strong>Cookie-consent preference.</strong> Your consent
                  choice is stored in <code className="text-sm">localStorage</code>{" "}
                  on your device and persists until you clear your browser&apos;s
                  local storage or withdraw consent via the banner.
                </li>
              </ul>
            </section>

            {/* ── CODE-08: named third-party vendor list ──────────────────── */}
            {/*
              AdSense's program policies require the privacy policy to name the
              third-party vendors and ad networks that serve on the site, not
              just to say that some exist. This list is specific to
              legalcostcalc.co — it names the hosts this site actually contacts
              (verified against the served HTML and the layout's script tags),
              so it is deliberately NOT the same list as the sibling sites'.
            */}
            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                Third-party vendors and ad networks used on this site
              </h2>
              <p className="mt-2 leading-relaxed">
                Third-party vendors, including Google, use cookies to serve ads
                based on your prior visits to this website or other websites.
                Google&apos;s use of advertising cookies enables it and its
                partners to serve ads to you based on your visit to this site
                and/or other sites on the internet. The vendors below are the
                ones this site actually loads:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed">
                <li>
                  <strong>Google AdSense</strong> (
                  <code className="text-sm">pagead2.googlesyndication.com</code>,{" "}
                  <code className="text-sm">googleads.g.doubleclick.net</code>) —
                  serves the display advertising on cost pages. See{" "}
                  <a
                    href="https://policies.google.com/technologies/ads"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-700 underline"
                  >
                    How Google uses cookies in advertising
                  </a>
                  .
                </li>
                <li>
                  <strong>Google Analytics 4</strong> (
                  <code className="text-sm">googletagmanager.com</code>) —
                  aggregate traffic measurement, loaded only after consent in the
                  EEA, UK and Switzerland.
                </li>
                <li>
                  <strong>Plausible Analytics</strong> (
                  <code className="text-sm">plausible.io</code>) — cookieless
                  page-view counts; sets no cookies and stores no identifiers.
                </li>
                <li>
                  <strong>Vercel</strong> — hosting and CDN; processes request
                  metadata (IP address, user agent) in server logs to deliver the
                  site.
                </li>
                <li>
                  <strong>Supabase</strong> — the database behind the cost
                  figures. Read-only, public data; no user submissions are
                  stored.
                </li>
                <li>
                  <strong>Clio</strong> — an affiliate partner linked from some
                  pages. Following such a link takes you to Clio&apos;s own site,
                  governed by its privacy policy, and may set its own cookies.
                </li>
              </ul>
              <p className="mt-3 leading-relaxed">
                You may opt out of personalized advertising from Google at{" "}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-700 underline"
                >
                  Google Ad Settings
                </a>
                , and from many other vendors at{" "}
                <a
                  href="https://optout.aboutads.info"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-700 underline"
                >
                  optout.aboutads.info
                </a>
                . Opting out does not remove advertising; it makes the ads you
                see non-personalized.
              </p>
            </section>

            {/* ── GDPR / EEA & UK Rights ─────────────────────────────────── */}
            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                Your rights under GDPR (EEA &amp; UK residents)
              </h2>
              <p className="mt-2 leading-relaxed">
                If you are located in the European Economic Area or the United
                Kingdom, you have the following rights regarding any personal
                data we process. Because we collect very limited personal data
                (only what is incidentally captured in server logs), most of
                these rights will have narrow practical scope, but we are
                committed to honoring them.
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 leading-relaxed">
                <li>
                  <strong>Right of access.</strong> You may request a copy of
                  the personal data we hold about you.
                </li>
                <li>
                  <strong>Right to rectification.</strong> You may ask us to
                  correct inaccurate personal data.
                </li>
                <li>
                  <strong>Right to erasure (&quot;right to be forgotten&quot;).</strong>{" "}
                  You may request deletion of your personal data where no
                  legitimate ground for retention exists.
                </li>
                <li>
                  <strong>Right to restriction of processing.</strong> You may
                  ask us to restrict how we process your data in certain
                  circumstances.
                </li>
                <li>
                  <strong>Right to data portability.</strong> Where processing
                  is based on consent or contract and carried out by automated
                  means, you may request your data in a structured,
                  machine-readable format.
                </li>
                <li>
                  <strong>Right to object.</strong> You may object to processing
                  based on legitimate interests or for direct marketing.
                </li>
                <li>
                  <strong>Right to withdraw consent.</strong> Where processing
                  is based on your consent (e.g., accepting advertising cookies),
                  you may withdraw that consent at any time via the cookie
                  consent banner without affecting the lawfulness of prior
                  processing.
                </li>
                <li>
                  <strong>Right to lodge a complaint.</strong> You have the
                  right to lodge a complaint with your local data-protection
                  supervisory authority (e.g., the ICO in the UK or the relevant
                  national authority in your EU member state).
                </li>
              </ul>
              <p className="mt-3 leading-relaxed">
                <strong>Legal bases for processing.</strong> Plausible Analytics
                runs without cookies and processes no personal data, so no legal
                basis is required for that tool. For Google AdSense personalized
                advertising, the legal basis for EEA, UK, and Switzerland
                residents is <strong>consent</strong>: personalized advertising
                and analytics cookies are set only after you opt in via our
                cookie/consent banner. Withdrawing consent at any time does not
                affect the lawfulness of processing that occurred before
                withdrawal.
              </p>
              <p className="mt-2 leading-relaxed">
                To exercise any of the above rights, please contact us at{" "}
                <a
                  href="mailto:contact@legalcostcalc.co"
                  className="text-teal-700 underline"
                >
                  contact@legalcostcalc.co
                </a>
                .
              </p>
            </section>

            {/* ── CCPA / CPRA — California Rights ────────────────────────── */}
            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                Your rights under CCPA / CPRA (California residents)
              </h2>
              <p className="mt-2 leading-relaxed">
                If you are a California resident, the California Consumer
                Privacy Act (CCPA) as amended by the California Privacy Rights
                Act (CPRA) provides you with the following rights:
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 leading-relaxed">
                <li>
                  <strong>Right to know.</strong> You may request disclosure of
                  the categories and specific pieces of personal information we
                  have collected about you, the sources, the business purpose,
                  and the categories of third parties with whom it is shared.
                </li>
                <li>
                  <strong>Right to delete.</strong> You may request deletion of
                  personal information we have collected, subject to certain
                  exceptions.
                </li>
                <li>
                  <strong>Right to correct.</strong> You may request correction
                  of inaccurate personal information we maintain.
                </li>
                <li>
                  <strong>Right to opt out of sale or sharing.</strong> You
                  have the right to opt out of the &quot;sale&quot; or
                  &quot;sharing&quot; of your personal information. We do{" "}
                  <strong>not</strong> sell personal information. However, the
                  delivery of personalized advertising by Google AdSense may
                  constitute &quot;sharing&quot; of personal data for
                  cross-context behavioral advertising under CPRA. Because US
                  visitors are served under a notice-and-opt-out model,
                  personalized advertising loads by default and you may opt out
                  at any time by (1) using the{" "}
                  <strong>Do Not Sell or Share My Personal Information</strong>{" "}
                  link in the site footer, or (2) visiting{" "}
                  <a
                    href="https://www.google.com/settings/ads"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-700 underline"
                  >
                    Google Ad Settings
                  </a>
                  .
                </li>
                <li>
                  <strong>Right to non-discrimination.</strong> We will not
                  discriminate against you for exercising any of your CCPA/CPRA
                  rights. You will not be denied services, charged different
                  prices, or provided a different level of service.
                </li>
              </ul>
              <p className="mt-3 leading-relaxed">
                To submit a verifiable consumer request, contact us at{" "}
                <a
                  href="mailto:contact@legalcostcalc.co"
                  className="text-teal-700 underline"
                >
                  contact@legalcostcalc.co
                </a>
                .
              </p>
            </section>

            {/* ── Changes & Contact ───────────────────────────────────────── */}
            <section>
              <h2 className="text-xl font-semibold text-slate-900">Changes &amp; contact</h2>
              <p className="mt-2 leading-relaxed">
                We may update this policy as the site evolves. When we do, we
                will update the effective date at the top of this page. Your
                continued use of the site after any changes constitutes
                acceptance of the updated policy.
              </p>
              <p className="mt-2 leading-relaxed">
                {/* LEGAL ENTITY: LegalCostCalc */}
                Questions about this policy may be directed to{" "}
                {/* LEGAL ENTITY */}
                LegalCostCalc at:{" "}
                <a
                  href="mailto:contact@legalcostcalc.co"
                  className="text-teal-700 underline"
                >
                  contact@legalcostcalc.co
                </a>
              </p>
            </section>
          </div>

          <div className="mt-10">
            <Disclaimer />
          </div>
        </div>
      </section>
    </div>
  );
}
