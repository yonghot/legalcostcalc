import { AffiliateCTA } from "@/components/shared/affiliate-cta";
import { getActivePartners } from "@/lib/constants/affiliates";
import { isSafeUrl } from "@/lib/utils/sanitize";

export function AffiliateSection({
  categorySlug,
  stateName,
  className,
}: {
  categorySlug?: string;
  stateName?: string;
  className: string;
}) {
  if (getActivePartners(categorySlug, isSafeUrl).length === 0) return null;

  return (
    <section className={className}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AffiliateCTA categorySlug={categorySlug} stateName={stateName} />
      </div>
    </section>
  );
}
