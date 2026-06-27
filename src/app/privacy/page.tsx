import type { Metadata } from "next";
import { Disclaimer } from "@/components/shared/disclaimer";
import { DATA_VERSION_DATE } from "@/lib/constants/data-meta";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How LegalCostCalc handles data, cookies, analytics, advertising (Google AdSense), and affiliate links.",
  alternates: { canonical: "/privacy" },
};

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
          <p className="mt-2 text-sm text-slate-500">Last updated: {UPDATED}</p>

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
                  <strong>Standard server logs.</strong> Our host (Vercel) and database
                  provider (Supabase) process technical data such as IP address and request
                  metadata to serve pages and apply basic rate limiting.
                </li>
                <li>
                  <strong>Analytics.</strong> We may use privacy-friendly analytics to count
                  page views in aggregate. No cross-site profiles are built by us.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                Cookies &amp; advertising
              </h2>
              <p className="mt-2 leading-relaxed">
                We may display advertising provided by{" "}
                <strong>Google AdSense</strong> and its partners. To do this, Google and other
                third-party vendors use cookies and similar technologies:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
                <li>
                  Third-party vendors, including Google, use cookies to serve ads based on a
                  user&apos;s prior visits to this and other websites.
                </li>
                <li>
                  Google&apos;s use of advertising cookies enables it and its partners to serve
                  ads based on your visit to this site and/or other sites on the Internet.
                </li>
                <li>
                  You may opt out of personalized advertising by visiting{" "}
                  <a
                    href="https://www.google.com/settings/ads"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-700 underline"
                  >
                    Google Ads Settings
                  </a>
                  , or opt out of third-party vendor cookies at{" "}
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

            <section>
              <h2 className="text-xl font-semibold text-slate-900">Changes &amp; contact</h2>
              <p className="mt-2 leading-relaxed">
                We may update this policy as the site evolves; the &quot;last updated&quot; date
                above reflects the latest revision. Questions about this policy can be directed
                through the channels listed on our About page.
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
