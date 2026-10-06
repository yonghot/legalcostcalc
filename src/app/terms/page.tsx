// DRAFT — REQUIRES REVIEW BY A LICENSED US ATTORNEY BEFORE RELIANCE
// This Terms of Service page is risk-mitigation copy prepared per an internal
// legal-risk report. It has not been reviewed by a licensed attorney and must
// not be relied upon as final legal language until that review occurs.

import type { Metadata } from "next";
import Link from "next/link";
import { Disclaimer } from "@/components/shared/disclaimer";
import { FOCUS_RING } from "@/lib/utils/styles";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for LegalCostCalc — informational cost estimates only, not legal advice.",
  alternates: { canonical: "/terms" },
};

// NOTE TO OPERATOR: swap "LegalCostCalc" below for your registered legal business
// name wherever the comment "LEGAL ENTITY" appears.

const EFFECTIVE_DATE = "October 7, 2026";

// Shared className for in-page anchor links (WCAG 2.4.7 AA focus-visible requirement)
const linkCls = `text-teal-700 underline rounded-sm ${FOCUS_RING}`;

export default function TermsPage() {
  return (
    <div>
      <section className="bg-gradient-to-b from-teal-50 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Disclaimer />

          <h1 className="mt-8 text-3xl font-semibold text-slate-900 sm:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Effective date: {EFFECTIVE_DATE}
          </p>

          <div className="mt-8 space-y-8 text-slate-700">
            {/* 1. Acceptance */}
            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                1. Acceptance of Terms
              </h2>
              <p className="mt-2 leading-relaxed">
                By accessing or using{" "}
                <strong>legalcostcalc.co</strong> (the
                &quot;Site&quot;), you agree to be bound by these Terms of
                Service (&quot;Terms&quot;). If you do not agree, do not use the
                Site.{" "}
                {/* LEGAL ENTITY: LegalCostCalc */}
                These Terms constitute an agreement between you and
                LegalCostCalc (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;).
              </p>
            </section>

            {/* 2. Informational Estimates Only */}
            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                2. Informational Estimates Only — Not Legal Advice
              </h2>
              <div className="mt-2 space-y-2 leading-relaxed">
                <p>
                  All content on this Site, including cost estimates, ranges,
                  data, and any other materials, is provided for{" "}
                  <strong>general informational purposes only</strong>. The
                  Site provides cost estimates based on aggregated, publicly
                  available data. These estimates are approximations and{" "}
                  <strong>
                    do not constitute legal advice, legal representation, or a
                    prediction of the outcome of any legal matter
                  </strong>
                  .
                </p>
                <p>
                  <strong>
                    We are not a law firm. Nothing on this Site creates an
                    attorney-client relationship, and no attorney-client
                    relationship is formed by using this Site, submitting
                    information through it, or clicking any link on it.
                  </strong>{" "}
                  We do not provide legal services and do not review, approve,
                  or take responsibility for the outcome of any individual
                  legal matter. Actual legal costs vary significantly by case
                  and jurisdiction, and by individual circumstances, attorney
                  experience, and case complexity.
                </p>
                <p>
                  You should always consult a licensed attorney in your
                  jurisdiction for advice specific to your situation before
                  making any legal or financial decision. If you decide to
                  contact an attorney or legal service provider through a
                  link on this Site, that decision and any resulting
                  engagement are strictly between you and that third party.
                </p>
              </div>
            </section>

            {/* 3. No Warranty */}
            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                3. Disclaimer of Warranties
              </h2>
              <p className="mt-2 leading-relaxed">
                THE SITE AND ALL CONTENT ARE PROVIDED &quot;AS IS&quot; AND
                &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS
                OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF
                MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY,
                COMPLETENESS, OR NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE
                SITE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL
                COMPONENTS. YOUR USE OF THE SITE IS ENTIRELY AT YOUR OWN RISK.
              </p>
            </section>

            {/* 4. Limitation of Liability */}
            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                4. Limitation of Liability
              </h2>
              <p className="mt-2 leading-relaxed">
                TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT
                SHALL LEGALCOSTCALC, ITS OPERATORS, CONTRIBUTORS, OR AFFILIATES
                BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
                OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF OR
                INABILITY TO USE THE SITE OR ANY CONTENT THEREON, INCLUDING
                BUT NOT LIMITED TO RELIANCE ON COST ESTIMATES, EVEN IF WE HAVE
                BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. THE SITE IS
                PROVIDED FREE OF CHARGE, AND YOU HAVE PAID US NOTHING TO USE
                IT. ACCORDINGLY, OUR TOTAL AGGREGATE LIABILITY TO YOU FOR ANY
                CLAIM ARISING UNDER OR RELATING TO THESE TERMS OR THE SITE,
                WHETHER IN CONTRACT, TORT, OR OTHERWISE, SHALL NOT EXCEED THE
                GREATER OF (A) THE TOTAL AMOUNT YOU PAID US, IF ANY, TO USE
                THE SITE IN THE TWELVE (12) MONTHS BEFORE THE CLAIM AROSE, OR
                (B) TEN U.S. DOLLARS ($10).
              </p>
            </section>

            {/* 5. Indemnification */}
            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                5. Indemnification
              </h2>
              <p className="mt-2 leading-relaxed">
                You agree to defend, indemnify, and hold harmless
                LegalCostCalc, its operators, contributors, and affiliates
                from and against any claims, liabilities, damages, losses,
                and expenses, including reasonable attorneys&apos; fees,
                arising out of or in any way connected with (a) your access
                to or use of the Site, (b) your violation of these Terms, or
                (c) your reliance on any cost estimate, figure, or other
                content on the Site in place of individualized advice from a
                licensed professional.
              </p>
            </section>

            {/* 6. Intellectual Property */}
            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                6. Intellectual Property
              </h2>
              <p className="mt-2 leading-relaxed">
                All original content on this Site — including text, design,
                layout, and compiled cost datasets — is owned by or licensed
                to LegalCostCalc and is protected by United States and
                international intellectual property laws. You may view and
                print content for your personal, non-commercial use. You may
                not reproduce, distribute, scrape, or commercially exploit any
                content without our prior written permission.
              </p>
            </section>

            {/* 7. Third-Party & Affiliate Links */}
            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                7. Third-Party &amp; Affiliate Links
              </h2>
              <p className="mt-2 leading-relaxed">
                The Site contains links to third-party websites and legal
                service providers. Some of these links are advertisements or
                affiliate links, meaning we may earn a commission or flat
                advertising fee if you click through, at no additional cost to
                you. These placements are{" "}
                <strong>advertising, not a referral or recommendation</strong>
                . We do not recommend or endorse any particular attorney,
                firm, or service, we do not vet or evaluate the third parties
                that appear, and we do not control the content of any
                third-party site or the outcome of any engagement you enter
                into with them. Our advertising and affiliate relationships do
                not influence our cost data or estimates.
              </p>
            </section>

            {/* 8. Advertising */}
            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                8. Advertising
              </h2>
              <p className="mt-2 leading-relaxed">
                We may display advertisements served by Google AdSense and
                other third-party networks. These advertisers may use cookies
                and similar tracking technologies to serve personalized ads.
                We do not control the content of third-party advertisements.
                See our{" "}
                <Link href="/privacy" className={linkCls}>
                  Privacy Policy
                </Link>{" "}
                for more information about advertising cookies.
              </p>
            </section>

            {/* 9. Modifications */}
            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                9. Modifications to Terms
              </h2>
              <p className="mt-2 leading-relaxed">
                We reserve the right to modify these Terms at any time. When
                we do, we will update the effective date at the top of this
                page. Your continued use of the Site after any changes
                constitutes your acceptance of the updated Terms. We encourage
                you to review these Terms periodically.
              </p>
            </section>

            {/* Governing law and arbitration are intentionally omitted; do not replace them with an arbitrary jurisdiction. */}
            {/* 10. Contact */}
            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                10. Contact
              </h2>
              <p className="mt-2 leading-relaxed">
                Questions about these Terms may be directed to:{" "}
                <a
                  href="mailto:contact@legalcostcalc.co"
                  className={linkCls}
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
