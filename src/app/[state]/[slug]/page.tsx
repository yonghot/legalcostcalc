import { Metadata } from "next";
import { notFound } from "next/navigation";
import { CostCalculator } from "@/components/calculator/cost-calculator";
import { Disclaimer } from "@/components/shared/disclaimer";
import { STATES, STATE_BY_SLUG } from "@/lib/constants/states";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/constants/categories";
import { formatCurrency } from "@/lib/utils/format";
import { checkDataFreshness } from "@/lib/utils/data-freshness";
import { getCostForPage } from "@/lib/services/cost-service";
import { CostDisplay } from "@/components/shared/cost-display";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AffiliateCTA } from "@/components/shared/affiliate-cta";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { SoftwareApplicationSchema } from "@/components/seo/software-application-schema";
import { ArticleSchema } from "@/components/seo/article-schema";
import { CostDetailsSection } from "@/components/seo/cost-details-section";
import { RelatedLinks } from "@/components/seo/related-links";
import { RelatedCalculators } from "@/components/seo/related-calculators";
import { AuthorByline } from "@/components/shared/author-byline";
import { UpdatedBadge } from "@/components/shared/updated-badge";
import { buildMeta, CANONICAL_ORIGIN } from "@/lib/seo";
import { hasUniqueData } from "@/lib/page-index";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { HubLinksBar } from "@/components/seo/hub-links-bar";
import { StateCostAnalysis } from "@/components/seo/state-cost-analysis";
import { CategoryEditorial } from "@/components/seo/category-editorial";
import { AnswerBlock } from "@/components/seo/answer-block";
import { EmbedPanel } from "@/components/embed/embed-panel";
import { buildAnswerBlock } from "@/lib/seo/geo";
import { buildStateCostContext } from "@/lib/seo/state-context";
import { buildStateFaq } from "@/lib/seo/state-faq";

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

  const description = categoryInfo.seoDescriptionTemplate
    .replace("{state}", stateInfo.name)
    .replace("{year}", String(new Date().getFullYear()));

  // T09 thin-page gate: pages without a real per-page data point are
  // noindex,follow — never removed, never linked from T06/T07 modules.
  const indexable = hasUniqueData(stateInfo.code, categoryInfo.slug);

  return buildMeta({
    title: `${categoryInfo.displayName} Cost in ${stateInfo.name}`,
    description,
    path: `/${stateInfo.slug}/${categorySlug}-cost`,
    robots: indexable ? undefined : { index: false, follow: true },
  });
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

  // CODE-05 — per-entity FAQ answers. The five programmatic answers used to
  // restate the cost band, hourly band, duration and fee list that the answer
  // block, the tier cards and the cost-details section had already shown, which
  // made them the largest identical blocks shared between two sibling pages.
  // `buildStateFaq` keeps the same searched questions but answers each with
  // information found nowhere else on the page (rank, tier-by-tier standing,
  // implied hours, the fee total as a share of this state's median) and picks
  // each answer's shape from where this state's own figures fall. The
  // "currently being collected" fallbacks stay for pairs with no real row —
  // never a fabricated answer.
  const faqContext = buildStateCostContext(stateInfo.code, categoryInfo.slug);
  const dataDrivenFaq =
    faqContext && moderateCost
      ? buildStateFaq(faqContext, categoryInfo.displayName.toLowerCase())
      : [];

  const faqQuestions = [
    ...(dataDrivenFaq.length > 0
      ? dataDrivenFaq
      : [
          {
            question: `How much does a ${categoryInfo.displayName.toLowerCase()} cost in ${stateInfo.name}?`,
            answer: `Cost data for ${categoryInfo.displayName.toLowerCase()} in ${stateInfo.name} is currently being collected.`,
          },
          {
            question: `How much does a ${categoryInfo.displayName.toLowerCase()} lawyer charge per hour in ${stateInfo.name}?`,
            answer: `Hourly rate data for ${stateInfo.name} is currently being collected.`,
          },
          {
            question: `How long does a ${categoryInfo.displayName.toLowerCase()} take in ${stateInfo.name}?`,
            answer: `Duration data for ${categoryInfo.displayName.toLowerCase()} in ${stateInfo.name} is currently being collected.`,
          },
        ]),
    // Category-specific unique FAQ questions
    ...(categoryInfo.faqTemplates ?? []).map((t) => ({
      question: t.questionTemplate.replace(/\{state\}/g, stateInfo.name),
      answer: t.answerTemplate.replace(/\{state\}/g, stateInfo.name),
    })),
  ];

  // Related links
  const otherCategories = CATEGORIES.filter((c) => c.slug !== categoryInfo.slug);
  const allOtherStates = STATES.filter((s) => s.code !== stateInfo.code);

  // CODE-01: GEO answer block — built from this page's own already-computed
  // cost rows (real numbers only). Rendered directly below the H1, ahead of
  // every other content section on the page (calculator, tables, FAQ, etc.).
  const answerBlockData = buildAnswerBlock({
    category: categoryInfo,
    state: stateInfo,
    costs,
    dataVerifiedDate: moderateCost?.lastVerifiedAt ?? null,
  });

  const canonicalUrl = `${CANONICAL_ORIGIN}/${stateInfo.slug}/${categoryInfo.slug}-cost`;

  return (
    <div>
      {/* CODE-02: FAQPage JSON-LD removed (deprecated for SERP display in
          2026) — the Q&A remains as visible on-page H2/H3 text via
          CategoryEditorial below (GEO-relevant, just no longer schema).
          Replaced by the still-supported rich-result set: Article +
          BreadcrumbList (below) + SoftwareApplication + WebSite/SearchAction
          (root, via OrganizationSchema). */}
      <ArticleSchema
        headline={`How Much Does a ${categoryInfo.displayName} Cost in ${stateInfo.name}?`}
        description={`${categoryInfo.displayName} cost estimates in ${stateInfo.name}, including attorney fees, court costs, and other expenses.`}
        url={canonicalUrl}
        dateModified={moderateCost?.lastVerifiedAt ?? null}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: stateInfo.name, href: `/${stateInfo.slug}` },
          { name: `${categoryInfo.displayName} Cost`, href: `/${stateInfo.slug}/${categoryInfo.slug}-cost` },
        ]}
      />
      <SoftwareApplicationSchema
        name={`${categoryInfo.displayName} Cost Calculator — ${stateInfo.name}`}
        description={`Free calculator estimating ${categoryInfo.displayName.toLowerCase()} costs in ${stateInfo.name}, including attorney fees, court costs, and common fees.`}
        url={canonicalUrl}
        dateModified={moderateCost?.lastVerifiedAt ?? null}
      />

      <section className="bg-gradient-to-b from-teal-50 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Disclaimer />

          <div className="mt-8">
            <Breadcrumbs
              className="mb-4"
              items={[
                { name: "Home", href: "/" },
                { name: stateInfo.name, href: `/${stateInfo.slug}` },
                { name: categoryInfo.displayName, href: `/${stateInfo.slug}/${categoryInfo.slug}-cost` },
              ]}
            />

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                How Much Does a {categoryInfo.displayName} Cost in {stateInfo.name}?
              </h1>
              <UpdatedBadge lastVerified={moderateCost?.lastVerifiedAt ?? null} />
            </div>
            <p className="mt-3 text-lg text-slate-600">
              {year} cost estimates for {categoryInfo.displayName.toLowerCase()} in {stateInfo.name},
              including attorney fees, court costs, and other expenses.
            </p>

            {/* CODE-01 — GEO answer block: rendered immediately after the H1
                (server-rendered HTML, visible via curl with JS disabled),
                so it is the first substantive content block on the page
                without breaking H1-before-H2 heading order. Query-phrased
                H2, 40-60 word answer paragraph with real computed numbers,
                cost-breakdown table, cost-factor list, sourced stats,
                freshness marker. Supersedes the old shorter "Quick answer"
                callout (same real moderate-complexity figures, now with the
                full GEO-extractable structure). */}
            <div className="mt-4">
              <AnswerBlock block={answerBlockData} compact />
            </div>

            <AuthorByline lastUpdated={moderateCost?.lastVerifiedAt ?? null} className="mt-4" />
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
          costs={costs}
        />
      )}

      {/* T13: the standalone in-content <AdProvider> that previously rendered
          here (above the calculator/result) was removed — it violated both
          "exactly ONE programmatic unit per page" (it stacked with
          ResultMonetization's DisplaySlot once a result rendered) and "first
          in-content ad sits BELOW the result block" (this slot sat ABOVE any
          result, nearer the top of the page). The single programmatic slot
          for this page is now exclusively ResultMonetization's DisplaySlot,
          rendered inside CostResult directly below the result card. */}

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

      {/* T07 — hub links: exactly the 2nd of 3 automated link types per spoke
          (breadcrumb parent is #1 above; sibling cross-links via RelatedLinks
          below are #3). Points to the real state + category hub index pages. */}
      <HubLinksBar stateSlug={stateInfo.slug} stateName={stateInfo.name} categorySlug={categoryInfo.slug} categoryName={categoryInfo.displayName} />

      {/* Internal Links */}
      <RelatedLinks
        stateInfo={stateInfo}
        categoryInfo={categoryInfo}
        otherCategories={otherCategories}
        allOtherStates={allOtherStates}
      />

      {/* Cross-link module — sibling cost-calculator network. */}
      <RelatedCalculators />

      {/* CODE-03 — "Embed this calculator" copy-to-clipboard panel. Placed
          below the calculator/result area and existing monetization/link
          modules (same LCP/ad-exclusion-zone rationale as K01 below). */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <EmbedPanel
            embedPath={`/embed/${stateInfo.slug}/${categoryInfo.slug}-cost`}
            canonicalPath={`/${stateInfo.slug}/${categoryInfo.slug}-cost`}
            label={`${stateInfo.name} ${categoryInfo.displayName} Cost Calculator`}
          />
        </div>
      </section>

      {/* K01 — entity-level editorial depth (how-it-works + worked example +
          visible FAQ text, GEO-relevant on-page text — no longer mirrored as
          FAQPage schema, see CODE-02 note above). Placed below the
          calculator/result area and every existing monetization/link module
          so LCP and the ad-exclusion zone around the calculator widget are
          unaffected. Reuses the same faqQuestions array as before. */}
      <CategoryEditorial
        categoryInfo={categoryInfo}
        stateInfo={stateInfo}
        costs={costs}
        faqQuestions={faqQuestions}
      />

      {/* CODE-05 (부속W) — per-entity publisher content. Sibling pages here
          measured 85.2% identical by 5-gram overlap at ~830 body words, which
          is what AdSense's "low value content" verdict describes. This section
          adds methodology, a data-derived read of THIS state's position,
          two worked examples from its real simple/complex rows, the
          assumptions that break the estimate, and the row's sources — with
          sentence shapes chosen conditionally from this state's own numbers so
          two siblings differ structurally, not just numerically. Placed after
          the calculator/monetization modules so LCP and the ad-exclusion zone
          are unaffected. */}
      <StateCostAnalysis
        stateCode={stateInfo.code}
        stateName={stateInfo.name}
        categorySlug={categoryInfo.slug}
        matterLabel={categoryInfo.displayName.toLowerCase()}
        moderate={moderateCost}
        simple={costs.find((c) => c.complexity === "simple")}
        complex={costs.find((c) => c.complexity === "complex")}
      />

      {/* T13: the standalone in-content <AdProvider> that previously rendered
          here (after RelatedCalculators) was removed for the same "exactly
          ONE programmatic unit per page" reason as above — ResultMonetization's
          DisplaySlot (inside CostResult, below the result block) is the page's
          single ad slot. */}

      {/* Bottom Disclaimer */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Disclaimer />
        </div>
      </section>
    </div>
  );
}
