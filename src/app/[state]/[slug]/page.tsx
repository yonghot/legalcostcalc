import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CostCalculator } from "@/components/calculator/cost-calculator";
import { Disclaimer } from "@/components/shared/disclaimer";
import { FaqSchema } from "@/components/seo/faq-schema";
import { STATES, STATE_BY_SLUG } from "@/lib/constants/states";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/constants/categories";
import { formatCurrency } from "@/lib/utils/format";
import { checkDataFreshness } from "@/lib/utils/data-freshness";
import { getCostForPage } from "@/lib/services/cost-service";
import { CostDisplay } from "@/components/shared/cost-display";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AffiliateCTA } from "@/components/shared/affiliate-cta";
import { FOCUS_RING } from "@/lib/utils/styles";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { SoftwareApplicationSchema } from "@/components/seo/software-application-schema";
import { CostDetailsSection } from "@/components/seo/cost-details-section";
import { RelatedLinks } from "@/components/seo/related-links";
import { RelatedCalculators } from "@/components/seo/related-calculators";
import { AdProvider } from "@/components/monetization/AdProvider";
import { AuthorByline } from "@/components/shared/author-byline";

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
      url: `https://legalcostcalc.co/${stateInfo.slug}/${categorySlug}-cost`,
      siteName: "LegalCostCalc",
      locale: "en_US",
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
    // Category-specific unique FAQ questions
    ...(categoryInfo.faqTemplates ?? []).map((t) => ({
      question: t.questionTemplate.replace(/\{state\}/g, stateInfo.name),
      answer: t.answerTemplate.replace(/\{state\}/g, stateInfo.name),
    })),
  ];

  // Related links
  const otherCategories = CATEGORIES.filter((c) => c.slug !== categoryInfo.slug);
  const allOtherStates = STATES.filter((s) => s.code !== stateInfo.code);

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
      <SoftwareApplicationSchema
        name={`${categoryInfo.displayName} Cost Calculator — ${stateInfo.name}`}
        description={`Free calculator estimating ${categoryInfo.displayName.toLowerCase()} costs in ${stateInfo.name}, including attorney fees, court costs, and common fees.`}
        url={`https://legalcostcalc.co/${stateInfo.slug}/${categoryInfo.slug}-cost`}
      />

      <section className="bg-gradient-to-b from-teal-50 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Disclaimer />

          <div className="mt-8">
            <nav className="mb-4 text-sm text-slate-500">
              <Link href="/" className={`hover:text-teal-600 ${FOCUS_RING} rounded-sm`}>Home</Link>
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

            {/* Quick-answer block — concise typical cost + range for featured
                snippets / AI Overviews. Uses real moderate-complexity data only;
                rendered only when that data exists. */}
            {moderateCost && (
              <p className="mt-4 max-w-2xl rounded-lg border border-teal-100 bg-teal-50/60 p-4 text-base text-slate-700">
                <span className="font-semibold text-slate-900">Quick answer:</span>{" "}
                A {categoryInfo.displayName.toLowerCase()} in {stateInfo.name} typically costs{" "}
                <span className="font-mono font-semibold text-teal-700">
                  {formatCurrency(moderateCost.costRange.median)}
                </span>{" "}
                for a moderate-complexity case, with most ranging from{" "}
                <span className="font-mono font-semibold">
                  {formatCurrency(moderateCost.costRange.low)}
                </span>{" "}
                to{" "}
                <span className="font-mono font-semibold">
                  {formatCurrency(moderateCost.costRange.high)}
                </span>
                .
              </p>
            )}

            <AuthorByline className="mt-4" />
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
            const { isStale, formattedDate } = checkDataFreshness(moderateCost.lastVerifiedAt);

            return (
              <div className="mt-4 text-center">
                {isStale && (
                  <p className="text-xs font-medium text-amber-600">
                    This data may be outdated. Last verified over 1 year ago.
                  </p>
                )}
                <p className="text-xs text-slate-400">
                  Last verified: {formattedDate}
                </p>
              </div>
            );
          })()}
        </div>
      </section>

      {/* Common Fees, Hourly Rate & Duration */}
      {moderateCost && moderateCost.commonFees.length > 0 && (
        <CostDetailsSection
          categoryName={categoryInfo.displayName}
          stateName={stateInfo.name}
          commonFees={moderateCost.commonFees}
          hourlyRate={moderateCost.hourlyRate}
          typicalDuration={moderateCost.typicalDuration}
        />
      )}

      {/* In-content ad — placed between the cost details and the calculator,
          below the fold on most viewports. Routes through AdProvider so exactly
          one programmatic network is active. */}
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <AdProvider className="w-full" />
      </div>

      {/* Interactive Calculator — ResultMonetization is injected inside CostResult
          (via cost-result.tsx) so it appears directly below each result card.
          Email capture and result-area ad are handled there; no duplicate here. */}
      <section className="py-16">
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
      <RelatedLinks
        stateInfo={stateInfo}
        categoryInfo={categoryInfo}
        otherCategories={otherCategories}
        allOtherStates={allOtherStates}
      />

      {/* Cross-link module — sibling cost-calculator network. */}
      <RelatedCalculators />

      {/* In-content ad — after related links, before the bottom disclaimer.
          Routes through AdProvider to keep exactly one programmatic network. */}
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <AdProvider className="w-full" />
      </div>

      {/* Bottom Disclaimer */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Disclaimer />
        </div>
      </section>
    </div>
  );
}
