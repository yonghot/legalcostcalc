import { Metadata } from "next";
import { notFound } from "next/navigation";
import { CostCalculator } from "@/components/calculator/cost-calculator";
import { Disclaimer } from "@/components/shared/disclaimer";
import { EmbedLoadedTracker } from "@/components/embed/embed-loaded-tracker";
import { STATES, STATE_BY_SLUG } from "@/lib/constants/states";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/constants/categories";

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
      params.push({ state: state.slug, slug: `${cat.slug}-cost` });
    }
  }
  return params;
}

export const revalidate = 604800; // 7 days

// Embeds shouldn't be indexed as standalone pages — the canonical content lives
// on the main /[state]/[slug] route.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { state: stateSlug, slug } = await params;
  const categorySlug = parseCategoryFromSlug(slug);
  const stateInfo = STATE_BY_SLUG.get(stateSlug);
  const categoryInfo = categorySlug ? CATEGORY_MAP.get(categorySlug) : null;
  const title =
    stateInfo && categoryInfo
      ? `${categoryInfo.displayName} Cost Calculator — ${stateInfo.name}`
      : "Legal Cost Calculator";

  return {
    title,
    robots: { index: false, follow: false },
  };
}

/**
 * Embeddable calculator — minimal chrome (no site nav/footer), intended to be
 * loaded inside a third-party iframe. Ads are intentionally OFF here. A
 * "Powered by LegalCostCalc" link points back to the canonical page (the SEO
 * attribution link belongs in the PARENT page HTML — see the embed snippet on
 * /embed).
 */
export default async function EmbedCalculatorPage({ params }: PageProps) {
  const { state: stateSlug, slug } = await params;
  const categorySlug = parseCategoryFromSlug(slug);
  const stateInfo = STATE_BY_SLUG.get(stateSlug);
  const categoryInfo = categorySlug ? CATEGORY_MAP.get(categorySlug) : null;

  if (!stateInfo || !categoryInfo) {
    notFound();
  }

  const canonicalUrl = `https://legalcostcalc.co/${stateInfo.slug}/${categoryInfo.slug}-cost`;
  // Attribution link policy (T04): rel="nofollow sponsored" (Google manual-
  // action vector for followed widget links), brand-name anchor text, and
  // UTM params. utm_campaign uses a stable "embed" value — the parent host
  // domain isn't knowable server-side at render time (that attribution lives
  // in the embed_loaded event's host_domain param instead, via
  // EmbedLoadedTracker below, which reads document.referrer client-side).
  const attributionUrl = `${canonicalUrl}?utm_source=embed&utm_medium=widget&utm_campaign=embed`;

  return (
    <div className="bg-white px-4 py-6 sm:px-6">
      {/* Widget must NOT load AdSense or track the host page's users beyond
          this single mount event. */}
      <EmbedLoadedTracker />
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {categoryInfo.displayName} Cost in {stateInfo.name}
          </h1>
          <Disclaimer variant="compact" />
        </div>

        <CostCalculator
          initialCategory={categoryInfo.slug}
          initialState={stateInfo.code}
        />

        <div className="border-t border-slate-100 pt-4 text-center">
          <a
            href={attributionUrl}
            target="_blank"
            rel="noopener nofollow sponsored"
            className="text-xs font-medium text-slate-500 hover:text-teal-600"
          >
            Powered by LegalCostCalc
          </a>
        </div>
      </div>
    </div>
  );
}
