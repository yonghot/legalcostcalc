import type { Metadata } from "next";
import { Disclaimer, DisclaimerNote } from "@/components/shared/disclaimer";
import { buildMeta } from "@/lib/seo";
import { formatDate } from "@/lib/content-dates";
import { SITE_UPDATES } from "@/lib/site-updates";

const base = buildMeta({
  title: "Site Updates",
  description: "Dated changes that went live on LegalCostCalc and what each one changed.",
  path: "/updates",
  skipFit: true,
});

export const metadata: Metadata = {
  ...base,
  alternates: { ...base.alternates, types: { "application/atom+xml": "/updates/feed.xml" } },
};

export default function UpdatesPage() {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <DisclaimerNote />
        <h1 className="mt-8 text-3xl font-semibold text-slate-900 sm:text-4xl">Site updates</h1>
        <p className="mt-3 leading-relaxed text-slate-700">
          Changes that became visible on this site, with the day each went live. The changes below went live together
          on {formatDate(SITE_UPDATES[0]!.date, "day")}. A feed of this list is available as{" "}
          <a href="/updates/feed.xml" className="text-teal-700 underline">
            Atom
          </a>
          .
        </p>
        <ol className="mt-8 space-y-8">
          {SITE_UPDATES.map((u) => (
            <li key={u.id} id={u.id} className="scroll-mt-24">
              <h2 className="text-lg font-semibold text-slate-900">{u.title}</h2>
              <p className="mt-1 text-sm text-slate-600">
                <time dateTime={u.date}>{formatDate(u.date, "day")}</time>
              </p>
              <p className="mt-2 leading-relaxed text-slate-700">{u.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10">
          <Disclaimer id="disclaimer" />
        </div>
      </div>
    </section>
  );
}
