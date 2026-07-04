import { ImageResponse } from "next/og";
import { CATEGORY_MAP } from "@/lib/constants/categories";
import { INDEXABLE_PAGES, getModerateMedianCost } from "@/lib/page-index";
import { formatCurrency } from "@/lib/utils/format";
import { getOgAsOfLabel } from "@/lib/seo/og-freshness";

export const runtime = "edge";
export const alt = "Legal Cost by State Comparison";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categorySlug } = await params;
  const categoryInfo = CATEGORY_MAP.get(categorySlug);
  const categoryName = categoryInfo?.displayName ?? categorySlug;

  // K09 — data-visual OG image: the key stat is the REAL median across every
  // state's moderate-complexity row for this category (same INDEXABLE_PAGES/
  // getModerateMedianCost source of truth the hub page itself renders from)
  // — no interpolated or invented figures.
  const stateCosts = categoryInfo
    ? INDEXABLE_PAGES.filter((p) => p.category.slug === categoryInfo.slug)
        .map((p) => getModerateMedianCost(p.state.code, categoryInfo.slug))
        .filter((v): v is number => typeof v === "number")
    : [];
  const stateCount = stateCosts.length;
  const overallMedian =
    stateCount > 0 ? [...stateCosts].sort((a, b) => a - b)[Math.floor(stateCount / 2)] : null;
  const asOfLabel = getOgAsOfLabel();

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #F0FDFA 0%, #FFFFFF 50%, #F0FDFA 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, sans-serif",
          padding: "60px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "11px",
              background: "#0D9488",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "14px",
              color: "white",
              fontSize: "26px",
              fontWeight: 700,
            }}
          >
            $
          </div>
          <span
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "#0D9488",
            }}
          >
            LegalCostCalc
          </span>
        </div>

        <h1
          style={{
            fontSize: "50px",
            fontWeight: 700,
            color: "#0F172A",
            textAlign: "center",
            lineHeight: 1.2,
            marginBottom: "24px",
          }}
        >
          <span style={{ color: "#0D9488" }}>{categoryName}</span> Cost by State
        </h1>

        {overallMedian !== null && (
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "12px",
              background: "white",
              border: "2px solid #0D9488",
              borderRadius: "16px",
              padding: "20px 40px",
              marginBottom: "20px",
            }}
          >
            <span
              style={{
                fontSize: "64px",
                fontWeight: 700,
                color: "#0D9488",
                fontFamily: "monospace",
              }}
            >
              {formatCurrency(overallMedian)}
            </span>
            <span style={{ fontSize: "20px", color: "#64748B" }}>nationwide median</span>
          </div>
        )}

        <p style={{ fontSize: "22px", color: "#475569", textAlign: "center" }}>
          {stateCount} states compared &middot; Sourced &amp; dated estimates
        </p>
        {asOfLabel && (
          <p style={{ fontSize: "16px", color: "#94A3B8", marginTop: "8px" }}>{asOfLabel}</p>
        )}
      </div>
    ),
    { ...size },
  );
}
