import { ImageResponse } from "next/og";
import { STATE_BY_SLUG } from "@/lib/constants/states";
import { INDEXABLE_PAGES, getModerateMedianCost } from "@/lib/page-index";
import { formatCurrency } from "@/lib/utils/format";

export const runtime = "edge";
export const alt = "Legal Costs by State";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state: stateSlug } = await params;
  const stateInfo = STATE_BY_SLUG.get(stateSlug);
  const stateName = stateInfo?.name ?? stateSlug;

  // K09 — data-visual OG image: the key stat is the REAL median of this
  // state's own moderate-complexity cost rows (same INDEXABLE_PAGES/
  // getModerateMedianCost source of truth the hub page itself renders from)
  // — no interpolated or invented figures.
  const stateCategoryCosts = stateInfo
    ? INDEXABLE_PAGES.filter((p) => p.state.code === stateInfo.code)
        .map((p) => getModerateMedianCost(stateInfo.code, p.category.slug))
        .filter((v): v is number => typeof v === "number")
    : [];
  const categoryCount = stateCategoryCosts.length;
  const overallMedian =
    categoryCount > 0
      ? [...stateCategoryCosts].sort((a, b) => a - b)[Math.floor(categoryCount / 2)]
      : null;

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
            fontSize: "54px",
            fontWeight: 700,
            color: "#0F172A",
            textAlign: "center",
            lineHeight: 1.2,
            marginBottom: "24px",
          }}
        >
          Legal Costs in <span style={{ color: "#0D9488" }}>{stateName}</span>
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
            <span style={{ fontSize: "20px", color: "#64748B" }}>typical median cost</span>
          </div>
        )}

        <p style={{ fontSize: "22px", color: "#475569", textAlign: "center" }}>
          {categoryCount} matter types compared &middot; Sourced &amp; dated estimates
        </p>
      </div>
    ),
    { ...size },
  );
}
