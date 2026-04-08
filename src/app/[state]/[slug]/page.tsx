import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CostCalculator } from "@/components/calculator/cost-calculator";
import { Disclaimer } from "@/components/shared/disclaimer";
import { FaqSchema } from "@/components/seo/faq-schema";
import { STATES, STATE_BY_SLUG } from "@/lib/constants/states";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/constants/categories";
import { formatCurrency } from "@/lib/utils/format";
import { getCostForPage } from "@/lib/services/cost-service";
import { CostDisplay } from "@/components/shared/cost-display";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { AffiliateCTA } from "@/components/shared/affiliate-cta";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";

interface PageProps {
  params: Promise<{ state: string; slug: string }>;
}

function parseCategoryFromSlug(slug: string): string | null {
  if (slug.endsWith("-cost")) {
    return slug.replace(/-cost$/, "");
  }
  return null;
}

export async function generateStaticParams() {
  const params: { state: string; slug: string }[] = [];
  for (const state of STATES) {
    for (const cat of CATEGORIES) {
      params.push({
        state: state.slug,
        slug: `${cat.slug}-cost`,
      });
    }
  }
  return params;
}

export const revalidate = 604800; // 7 days

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { state: stateSlug, slug } = await params;
  const categorySlug = parseCategoryFromSlug(slug);
  const stateInfo = STATE_BY_SLUG.get(stateSlug);
  const categoryInfo = categorySlug ? CATEGORY_MAP.get(categorySlug) : null;

  if (!stateInfo || !categoryInfo) {
    return { title: "Not Found" };
  }

  const year = new Date().getFullYear();
  const title = categoryInfo.seoTitleTemplate
    .replace("{state}", stateInfo.name)
    .replace("{year}", String(year));
  const description = categoryInfo.seoDescriptionTemplate
    .replace("{state}", stateInfo.name)
    .replace("{year}", String(year));

  return {
    title,
    description,
    alternates: {
      canonical: `/${stateInfo.slug}/${categorySlug}-cost`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://legalcostcalc.vercel.app/${stateInfo.slug}/${categorySlug}-cost`,
    },
  };
}

export default async function StateCategoryPage({ params }: PageProps) {
  const { state: stateSlug, slug } = await params;
  const categorySlug = parseCategoryFromSlug(slug);
  const stateInfo = STATE_BY_SLUG.get(stateSlug);
  const categoryInfo = categorySlug ? CATEGORY_MAP.get(categorySlug) : null;

  if (!stateInfo || !categoryInfo) {
    notFound();
  }

  let costs: Awaited<ReturnType<typeof getCostForPage>> = [];
  try {
    costs = await getCostForPage(categoryInfo.slug, stateInfo.code);
  } catch {
    costs = [];
  }

  const moderateCost = costs.find((c) => c.complexity === "moderate");
  const year = new Date().getFullYear();

  // Build FAQ
  const faqQuestions = [
    {
      question: `How much does a ${categoryInfo.displayName.toLowerCase()} cost in ${stateInfo.name}?`,
      answer: moderateCost
        ? `The average cost of a ${categoryInfo.displayName.toLowerCase()} in ${stateInfo.name} ranges from ${formatCurrency(moderateCost.costRange.low)} to ${formatCurrency(moderateCost.costRange.high)}, with a median cost of ${formatCurrency(moderateCost.costRange.median)}.`
        : `Cost data for ${categoryInfo.displayName.toLowerCase()} in ${stateInfo.name} is currently being collected.`,
    },
    {
      question: `How much does a ${categoryInfo.displayName.toLowerCase()} lawyer charge per hour in ${stateInfo.name}?`,
      answer: moderateCost
        ? `${categoryInfo.displayName} attorneys in ${stateInfo.name} typically charge between ${formatCurrency(moderateCost.hourlyRate.low)} and ${formatCurrency(moderateCost.hourlyRate.high)} per hour.`
        : `Hourly rate data for ${stateInfo.name} is currently being collected.`,
    },
    {
      question: `How long does a ${categoryInfo.displayName.toLowerCase()} take in ${stateInfo.name}?`,
      answer: moderateCost
        ? `A typical ${categoryInfo.displayName.toLowerCase()} case of moderate complexity in ${stateInfo.name} takes approximately ${moderateCost.typicalDuration}. Simple cases may resolve faster, while complex cases can take significantly longer.`
        : `Duration data for ${categoryInfo.displayName.toLowerCase()} in ${stateInfo.name} is currently being collected.`,
    },
    {
      question: `What are common ${categoryInfo.displayName.toLowerCase()} fees in ${stateInfo.name}?`,
      answer: moderateCost && moderateCost.commonFees.length > 0
        ? `Common fees for a ${categoryInfo.displayName.toLowerCase()} in ${stateInfo.name} include: ${moderateCost.commonFees.slice(0, 4).join(", ")}. Actual fees vary based on your specific situation.`
        : `Fee breakdown data for ${stateInfo.name} is currently being collected.`,
    },
    {
      question: `Does ${categoryInfo.displayName.toLowerCase()} cost vary by complexity in ${stateInfo.name}?`,
      answer: costs.length > 1
        ? `Yes. A simple ${categoryInfo.displayName.toLowerCase()} in ${stateInfo.name} costs around ${formatCurrency(costs.find(c => c.complexity === "simple")?.costRange.median ?? 0)}, while a complex case can cost ${formatCurrency(costs.find(c => c.complexity === "complex")?.costRange.median ?? 0)} or more.`
        : `Yes, legal costs vary significantly based on case complexity. Simple cases cost less than moderate or complex ones.`,
    },
  ];

  // Related links
  const otherCategories = CATEGORIES.filter((c) => c.slug !== categoryInfo.slug);
  const allOtherStates = STATES.filter((s) => s.code !== stateInfo.code);
  const displayedStates = allOtherStates.slice(0, 10);
  const remainingStatesCount = allOtherStates.length - displayedStates.length;

  return (
    <div>
      <FaqSchema questions={faqQuestions} />
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: stateInfo.name, href: `/${stateInfo.slug}/${CATEGORIES[0].slug}-cost` },
          { name: `${categoryInfo.displayName} Cost`, href: `/${stateInfo.slug}/${categoryInfo.slug}-cost` },
        ]}
      />

      <section className="bg-gradient-to-b from-teal-50 to-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Disclaimer />

          <div className="mt-8">
            <nav className="mb-4 text-sm text-slate-500">
              <Link href="/" className="hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 rounded-sm">Home</Link>
              <span className="mx-2">/</span>
              <span>{stateInfo.name}</span>
              <span className="mx-2">/</span>
              <span>{categoryInfo.displayName}</span>
            </nav>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              How Much Does a {categoryInfo.displayName} Cost in {stateInfo.name}?
            </h1>
            <p className="mt-3 text-lg text-slate-600">
              {year} cost estimates for {categoryInfo.displayName.toLowerCase()} in {stateInfo.name},
              including attorney fees, court costs, and other expenses.
            </p>
          </div>

          {/* Quick stats */}
          {moderateCost && (
            <div className="mt-8">
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  <CostDisplay
                    costRange={moderateCost.costRange}
                    label={`Estimated ${categoryInfo.displayName} Cost (Moderate Complexity)`}
                  />
                  {moderateCost.hourlyRate.median > 0 && (
                    <p className="mt-3 text-center font-mono text-sm text-slate-500">
                      Attorney rate: {formatCurrency(moderateCost.hourlyRate.low)} – {formatCurrency(moderateCost.hourlyRate.high)}/hr
                      (median {formatCurrency(moderateCost.hourlyRate.median)}/hr)
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* All complexity levels */}
          {costs.length > 0 && (
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {costs.map((cost) => (
                <Card key={cost.complexity} className="border-slate-200">
                  <CardContent className="p-6">
                    <div className="mb-3 flex items-center justify-between">
                      <Badge variant="outline" className="capitalize">
                        {cost.complexity}
                      </Badge>
                      <span className="text-xs text-slate-400">{cost.typicalDuration}</span>
                    </div>
                    <p className="font-mono text-2xl font-bold text-teal-600">
                      {formatCurrency(cost.costRange.median)}
                    </p>
                    <p className="mt-1 font-mono text-sm text-slate-500">
                      Range: {formatCurrency(cost.costRange.low)} – {formatCurrency(cost.costRange.high)}
                    </p>
                    {cost.hourlyRate.median > 0 && (
                      <p className="mt-2 font-mono text-xs text-slate-500">
                        Attorney rate: {formatCurrency(cost.hourlyRate.low)} – {formatCurrency(cost.hourlyRate.high)}/hr
                      </p>
                    )}
                    {cost.sources.length < 2 && (
                      <p className="mt-2 text-xs italic text-slate-400">Estimated range (single source)</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Data freshness */}
          {moderateCost?.lastVerifiedAt && (() => {
            const verifiedDate = new Date(moderateCost.lastVerifiedAt);
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            const isStale = verifiedDate < oneYearAgo;

            return (
              <div className="mt-4 text-center">
                {isStale && (
                  <p className="text-xs font-medium text-amber-600">
                    This data may be outdated. Last verified over 1 year ago.
                  </p>
                )}
                <p className="text-xs text-slate-400">
                  Last verified: {verifiedDate.toLocaleDateString("en-US", { year: "numeric", month: "long" })}
                </p>
              </div>
            );
          })()}
        </div>
      </section>

      {/* Common Fees & Duration */}
      {moderateCost && moderateCost.commonFees.length > 0 && (
        <section className="border-t border-slate-100 bg-slate-50 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <h2 className="mb-4 text-xl font-bold text-slate-900">
                  Common {categoryInfo.displayName} Fees in {stateInfo.name}
                </h2>
                <ul className="space-y-2">
                  {moderateCost.commonFees.map((fee, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />
                      {fee}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="mb-4 text-xl font-bold text-slate-900">
                  What Affects {categoryInfo.displayName} Cost?
                </h2>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />
                    Case complexity (simple, moderate, or complex)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />
                    Attorney experience and reputation
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />
                    Local market rates in {stateInfo.name}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />
                    Whether the case goes to trial or is settled
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />
                    Court filing fees and administrative costs
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Interactive Calculator */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-2xl font-bold text-slate-900">
            Calculate Your Estimated Cost
          </h2>
          <CostCalculator
            initialCategory={categoryInfo.slug}
            initialState={stateInfo.code}
          />
        </div>
      </section>

      {/* Affiliate CTAs */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AffiliateCTA categorySlug={categoryInfo.slug} stateName={stateInfo.name} />
        </div>
      </section>

      {/* Internal Links */}
      <section className="border-t border-slate-100 bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Other categories in this state */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                Other Legal Costs in {stateInfo.name}
              </h3>
              <div className="space-y-2">
                {otherCategories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/${stateInfo.slug}/${cat.slug}-cost`}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm transition-all hover:border-teal-200 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                  >
                    <span className="font-medium text-slate-700">{cat.displayName} Cost</span>
                    <ArrowRight className="h-4 w-4 text-slate-300" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Same category in other states */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                {categoryInfo.displayName} Cost in Other States
              </h3>
              <div className="space-y-2">
                {displayedStates.map((state) => (
                  <Link
                    key={state.code}
                    href={`/${state.slug}/${categoryInfo.slug}-cost`}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm transition-all hover:border-teal-200 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                  >
                    <span className="font-medium text-slate-700">{state.name}</span>
                    <ArrowRight className="h-4 w-4 text-slate-300" aria-hidden="true" />
                  </Link>
                ))}
                {remainingStatesCount > 0 && (
                  <details className="rounded-lg border border-slate-200 bg-white">
                    <summary className="cursor-pointer p-3 text-sm font-medium text-teal-600 hover:text-teal-700">
                      View {remainingStatesCount} more states
                    </summary>
                    <div className="space-y-2 p-3 pt-0">
                      {allOtherStates.slice(10).map((state) => (
                        <Link
                          key={state.code}
                          href={`/${state.slug}/${categoryInfo.slug}-cost`}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm transition-all hover:border-teal-200 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                        >
                          <span className="font-medium text-slate-700">{state.name}</span>
                          <ArrowRight className="h-4 w-4 text-slate-300" aria-hidden="true" />
                        </Link>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Disclaimer */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Disclaimer />
        </div>
      </section>
    </div>
  );
}
