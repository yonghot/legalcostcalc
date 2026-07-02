import { Metadata } from "next";
import { Disclaimer } from "@/components/shared/disclaimer";
import { ContactForm } from "@/components/shared/contact-form";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { safeJsonLd } from "@/lib/utils/json-ld";
import { MessageSquare } from "lucide-react";
import { FOCUS_RING } from "@/lib/utils/styles";
import { buildMeta } from "@/lib/seo";

export const metadata: Metadata = buildMeta({
  title: "Contact Us — Questions, Corrections & Feedback",
  description:
    "Questions, corrections, or feedback about our legal cost estimates? Send us a message and we'll get back to you within 1–2 business days.",
  path: "/contact",
  skipFit: true,
});

export default function ContactPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact LegalCostCalc",
    description:
      "Questions, corrections, or feedback about our legal cost estimates? Send us a message.",
    url: "https://legalcostcalc.co/contact",
    isPartOf: {
      "@type": "WebSite",
      name: "LegalCostCalc",
      url: "https://legalcostcalc.co",
    },
  };

  // Shown only when the owner sets this env var — never fabricated.
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "Contact", href: "/contact" },
        ]}
      />

      <section className="bg-gradient-to-b from-teal-50 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Disclaimer />

          <Breadcrumbs
            className="mt-8"
            items={[
              { name: "Home", href: "/" },
              { name: "Contact", href: "/contact" },
            ]}
          />

          <div className="mt-4 flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-teal-100">
              <MessageSquare className="h-6 w-6 text-teal-600" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Contact Us
              </h1>
              <p className="mt-3 max-w-2xl text-lg text-slate-600">
                Questions, corrections, or feedback about our estimates? Send us a message.
                We typically respond within 1{"–2"} business days.
              </p>
            </div>
          </div>
        </div>
      </section>

      <main>
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-3">
              <aside className="space-y-8 lg:col-span-1">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">What we can help with</h2>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />
                      Questions about our cost estimates or methodology
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />
                      Corrections or data errors you have noticed
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />
                      Suggestions to improve the calculator
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />
                      General feedback about the site
                    </li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-base font-semibold text-slate-900">What we cannot help with</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    We do not provide legal advice, represent clients, or comment on
                    individual legal matters. Please consult a licensed attorney in your
                    jurisdiction for legal guidance.
                  </p>
                </div>

                {contactEmail && (
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Email</h2>
                    <p className="mt-2 text-sm text-slate-600">
                      You can also reach us directly at{" "}
                      <a
                        href={`mailto:${contactEmail}`}
                        className={`text-teal-600 underline hover:text-teal-700 ${FOCUS_RING} rounded-sm`}
                      >
                        {contactEmail}
                      </a>
                      .
                    </p>
                  </div>
                )}
              </aside>

              <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                <h2 className="mb-6 text-lg font-semibold text-slate-900">Send a message</h2>
                <ContactForm />
              </div>
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Disclaimer />
          </div>
        </section>
      </main>
    </div>
  );
}
