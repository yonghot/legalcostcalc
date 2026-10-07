// DRAFT — REQUIRES REVIEW BY A LICENSED US ATTORNEY BEFORE RELIANCE
// This Privacy Policy page is risk-mitigation copy prepared per an internal
// legal-risk report. It has not been reviewed by a licensed attorney and must
// not be relied upon as final legal language until that review occurs.

import type { Metadata } from "next";
import { Disclaimer, DisclaimerNote } from "@/components/shared/disclaimer";
import { PublishedBy } from "@/components/shared/published-by";
import { PUBLISHER } from "@/lib/constants/publisher";
import { AdsenseLoader } from "@/components/ads/adsense-loader";
import { buildMeta } from "@/lib/seo";

export const metadata: Metadata = buildMeta({
  title: "Privacy Policy",
  description:
    "How LegalCostCalc handles data, cookies, analytics (Google Analytics 4), advertising (Google AdSense), GDPR/CCPA rights, and affiliate links.",
  path: "/privacy",
  skipFit: true,
  withOgImage: true,
});

const POLICY_EFFECTIVE_DATE = "October 8, 2026";

const ADS_SETTINGS_URL = "https://adssettings.google.com";

export default function PrivacyPage() {
  return (
    <div>
      <AdsenseLoader />
      <section className="bg-gradient-to-b from-teal-50 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <DisclaimerNote />

          <h1 className="mt-8 text-3xl font-semibold text-slate-900 sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Effective date: {POLICY_EFFECTIVE_DATE}
          </p>

          <div className="mt-8 space-y-8 text-slate-700">
            <section>
              <h2 className="text-xl font-semibold text-slate-900">Overview</h2>
              <p className="mt-2 leading-relaxed">
                LegalCostCalc (&quot;we&quot;, &quot;us&quot;) provides free, informational
                estimates of legal costs. We do not require accounts and you do not need to
                give us personal information to use the calculator. This policy explains what
                is collected automatically, what you may choose to send us, the cookies and
                browser storage the site uses, and your choices.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">Information we collect</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
                <li>
                  <strong>No accounts or payments.</strong> We do not offer accounts and do not
                  collect payment details. Cost lookups you run are not tied to your identity.
                </li>
                <li>
                  <strong>Messages you send us.</strong> If you use the contact form, we receive
                  the name, email address, and message you enter. If you use the feedback widget,
                  we receive your message, the feedback type, an optional email address, the page
                  URL you were on, and your browser&apos;s user agent (added by our server). We
                  use this only to read and respond to your message and to improve the site. It
                  is sent through our servers to the feedback collection service we have
                  configured, and you can also email us directly at{" "}
                  <a href={`mailto:${PUBLISHER.email}`} className="text-teal-700 underline">
                    {PUBLISHER.email}
                  </a>
                  .
                </li>
                <li>
                  <strong>Calculator inputs.</strong> The category, state, and case-complexity
                  selections you make in the cost calculator are sent to our servers only to
                  request matching cost ranges. The Settlement Net Estimator&apos;s gross
                  settlement, contingency percentage, and case-cost figures are processed
                  entirely in your browser and are not transmitted to or stored on our servers.
                </li>
                <li>
                  <strong>Standard server logs.</strong> Our host (Vercel) processes technical
                  data such as your IP address and request metadata to serve pages and apply
                  basic rate limiting.
                </li>
                <li>
                  <strong>Analytics.</strong> We use Google Analytics 4 to understand how the
                  site is used: pages viewed, how calculators and links are used, the site that
                  referred you, and page-speed measurements (Core Web Vitals). Google also
                  receives your IP address and browser details with each request and can derive
                  an approximate location from them. Whether Google Analytics may store cookies
                  on your device depends on the consent settings described below.
                </li>
                <li>
                  <strong>Country cookie.</strong> Our hosting provider tells us which country a
                  request comes from. We save the two-letter country code in a cookie named{" "}
                  <code className="text-sm">visitor_country</code> for one day so the site can
                  offer the consent choice that applies where you are. We use it for nothing
                  else.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                Cookies, browser storage &amp; advertising
              </h2>
              <p className="mt-2 leading-relaxed">
                We may display advertising provided by <strong>Google AdSense</strong> and its
                partners. Google AdSense and Google Analytics 4 run under{" "}
                <strong>Google Consent Mode v2</strong>, and what they may do on your first visit
                depends on where you are:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
                <li>
                  <strong>EEA, UK, and Switzerland (opt-in).</strong> In the European Economic Area
                  (EEA), the United Kingdom, and Switzerland, advertising and analytics storage are
                  denied by default. Google&apos;s consent message, not a banner of our own, asks
                  for your choice. Until you accept, we tell Google not to use cookies or personal
                  data for ad personalization or analytics; Google may still receive limited
                  information without cookies, such as that a page was requested, together with
                  your IP address.
                </li>
                <li>
                  <strong>All other countries, including the United States (notice and opt-out).</strong>{" "}
                  Advertising and analytics storage are allowed by default, so Google may use
                  cookies for personalized ads and measurement from your first visit, consistent
                  with US privacy law (including CCPA). You can opt out at any time with the{" "}
                  <strong>Do Not Sell or Share My Personal Information / Manage Consent</strong>{" "}
                  link in the site footer, which opens a choice banner. If you choose Decline, we
                  tell Google to deny advertising and analytics storage, and we remember your
                  choice on this device and apply it on later visits. If the site cannot tell which
                  country you are in, for example because your browser blocks the country cookie,
                  the link opens Google&apos;s consent message instead of our banner.
                </li>
                <li>
                  <strong>Interest-based ads.</strong> Google and its partners may show
                  interest-based ads, based on your prior visits to this and other sites. You can
                  turn off or manage personalized ads at{" "}
                  <a
                    href={ADS_SETTINGS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-700 underline"
                  >
                    Google Ad Settings
                  </a>
                  , or opt out of many other vendors&apos; interest-based ads at{" "}
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
              <p className="mt-3 leading-relaxed">
                Apart from cookies set by Google, the site keeps the following on your device, in
                cookies or browser storage:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
                <li>
                  <code className="text-sm">cookie_consent</code>: your Accept or Decline choice.
                </li>
                <li>
                  <code className="text-sm">visitor_country</code>: the country cookie described
                  above (expires after one day).
                </li>
                <li>
                  <code className="text-sm">terms_gate_consent</code>: that you accepted the Terms
                  of Service prompt before using a calculator.
                </li>
                <li>
                  <code className="text-sm">cc_state_</code> entries and{" "}
                  <code className="text-sm">cc_recent_calculations</code>: your last category,
                  state, and complexity selections and a short list of recent calculations, kept
                  only on this device. The &quot;Clear my calculator data&quot; link in the
                  footer removes them.
                </li>
                <li>
                  <code className="text-sm">cc_referral_tagged</code> and{" "}
                  <code className="text-sm">cc_human_session</code>: once-per-visit markers kept
                  in session storage so analytics events are not repeated.
                </li>
                <li>
                  <code className="text-sm">cc_traffic_type</code>: a marker the publisher&apos;s
                  own devices use so internal visits can be excluded from analytics.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">Affiliate links</h2>
              <p className="mt-2 leading-relaxed">
                If we add affiliate links to legal-service providers, they will be labeled, and we
                may earn a commission at no extra cost to you if you use them. Affiliate
                relationships would not influence our cost data or estimates.
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
                  <strong>Supabase.</strong> Supabase retains database query logs
                  per its own data-retention schedule as described in the{" "}
                  <a
                    href="https://supabase.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-700 underline"
                  >
                    Supabase Privacy Policy
                  </a>
                  . Visitor submissions are not stored in our database.
                </li>
                <li>
                  <strong>Google Analytics and Google AdSense.</strong> Google
                  retains analytics and advertising data in accordance with its
                  own policies — see{" "}
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
                  <strong>On your device.</strong> The cookies and browser storage
                  entries listed above stay on your device until they expire or you
                  clear your browser&apos;s site data. The &quot;Clear my calculator
                  data&quot; link in the footer removes the calculator entries.
                </li>
              </ul>
            </section>

            {/* ── CODE-08: named third-party vendor list ──────────────────── */}
            {/*
              AdSense's program policies require the privacy policy to name the
              third-party vendors and ad networks that serve on the site, not
              just to say that some exist. This list is specific to
              legalcostcalc.co: it names the hosts this site actually contacts,
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
                  may serve display advertising on cost pages. See{" "}
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
                  aggregate traffic measurement, subject to the consent settings
                  described above.
                </li>
                <li>
                  <strong>Google consent message</strong> (
                  <code className="text-sm">fundingchoicesmessages.google.com</code>) —
                  Google&apos;s consent management tool, which asks for your choice in
                  the EEA, UK, and Switzerland.
                </li>
                <li>
                  <strong>Vercel</strong> — hosting and CDN; processes request
                  metadata (IP address, user agent) in server logs to deliver the
                  site.
                </li>
                <li>
                  <strong>Supabase</strong> — database provider for the cost figures.
                  Our servers, not your browser, query it with the category, state,
                  and complexity of a lookup; the figures can also be served from a
                  copy bundled with the site. Visitor submissions are not stored
                  there.
                </li>
              </ul>
              <p className="mt-3 leading-relaxed">
                You may opt out of personalized advertising from Google at{" "}
                <a
                  href={ADS_SETTINGS_URL}
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
                (what is captured in server logs and what you choose to send us),
                most of these rights will have narrow practical scope, but we are
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
                  you may withdraw that consent at any time through the{" "}
                  <strong>Manage Consent</strong> link in the site footer, which
                  reopens Google&apos;s consent message, without affecting the
                  lawfulness of prior processing.
                </li>
                <li>
                  <strong>Right to lodge a complaint.</strong> You have the
                  right to lodge a complaint with your local data-protection
                  supervisory authority (e.g., the ICO in the UK or the relevant
                  national authority in your EU member state).
                </li>
              </ul>
              <p className="mt-3 leading-relaxed">
                <strong>Legal bases for processing.</strong> For Google Analytics 4
                and Google AdSense personalized advertising, the legal basis for
                EEA, UK, and Switzerland residents is <strong>consent</strong>,
                collected through Google&apos;s consent message; storage for
                analytics and advertising is denied by default until you accept.
                Server logs are processed on the basis of our legitimate interest
                in delivering and securing the site, and messages you send us on
                the basis of our legitimate interest in responding to you.
                Withdrawing consent at any time does not affect the lawfulness of
                processing that occurred before withdrawal.
              </p>
              <p className="mt-2 leading-relaxed">
                To exercise any of the above rights, please contact us at{" "}
                <a
                  href={`mailto:${PUBLISHER.email}`}
                  className="text-teal-700 underline"
                >
                  {PUBLISHER.email}
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
                  personalized advertising is allowed by default and you may opt
                  out at any time by (1) using the{" "}
                  <strong>Do Not Sell or Share My Personal Information</strong>{" "}
                  link in the site footer, or (2) visiting{" "}
                  <a
                    href={ADS_SETTINGS_URL}
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
                  href={`mailto:${PUBLISHER.email}`}
                  className="text-teal-700 underline"
                >
                  {PUBLISHER.email}
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
              <PublishedBy className="mt-2 leading-relaxed" linkClassName="text-teal-700 underline" />
              <p className="mt-2 leading-relaxed">
                Questions about this policy may be directed to:{" "}
                <a
                  href={`mailto:${PUBLISHER.email}`}
                  className="text-teal-700 underline"
                >
                  {PUBLISHER.email}
                </a>
              </p>
            </section>
          </div>

          <div className="mt-10">
            <Disclaimer id="disclaimer" />
          </div>
        </div>
      </section>
    </div>
  );
}
