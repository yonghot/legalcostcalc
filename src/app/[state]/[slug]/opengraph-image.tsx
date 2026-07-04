import { ImageResponse } from "next/og";
import { STATE_BY_SLUG } from "@/lib/constants/states";
import { CATEGORY_MAP } from "@/lib/constants/categories";
import { getModerateCostRange } from "@/lib/page-index";
import { formatCurrency } from "@/lib/utils/format";
import { getOgAsOfLabel } from "@/lib/seo/og-freshness";

export const runtime = "edge";
export const alt = "Legal Cost Estimate";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function parseCategoryFromSlug(slug: string): string | null {
  if (slug.endsWith("-cost")) {
    return slug.replace(/-cost$/, "");
  }
  return null;
}

export default async function OGImage({
  params,
}: {
  params: Promise<{ state: string; slug: string }>;
}) {
  const { state: stateSlug, slug } = await params;
  const categorySlug = parseCategoryFromSlug(slug);
  const stateInfo = STATE_BY_SLUG.get(stateSlug);
  const categoryInfo = categorySlug ? CATEGORY_MAP.get(categorySlug) : null;

  const stateName = stateInfo?.name ?? stateSlug;
  const categoryName = categoryInfo?.displayName ?? categorySlug ?? "Legal";

  // CODE-05 — the KEY computed result baked in as text: this entity's REAL
  // moderate-complexity cost range, read directly from the static seed
  // dataset (same source of truth as getModerateMedianCost/page-index.ts —
  // no interpolated or invented figures, no fake ratings/superlatives).
  const range =
    stateInfo && categoryInfo ? getModerateCostRange(stateInfo.code, categoryInfo.slug) : null;
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
          padding: "56px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "#0D9488",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "12px",
              color: "white",
              fontSize: "24px",
              fontWeight: 700,
            }}
          >
            $
          </div>
          <span
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#0D9488",
            }}
          >
            LegalCostCalc
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              background: "#0D9488",
              color: "white",
              borderRadius: "20px",
              padding: "6px 20px",
              fontSize: "18px",
              fontWeight: 600,
            }}
          >
            {stateName}
          </div>
          <div
            style={{
              background: "white",
              border: "2px solid #0D9488",
              color: "#0D9488",
              borderRadius: "20px",
              padding: "6px 20px",
              fontSize: "18px",
              fontWeight: 600,
            }}
          >
            {categoryName}
          </div>
        </div>

        <h1
          style={{
            fontSize: "44px",
            fontWeight: 700,
            color: "#0F172A",
            textAlign: "center",
            lineHeight: 1.2,
            marginBottom: "20px",
          }}
        >
          How Much Does a {categoryName}
          <br />
          Cost in <span style={{ color: "#0D9488" }}>{stateName}</span>?
        </h1>

        {range !== null && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: "white",
              border: "2px solid #0D9488",
              borderRadius: "16px",
              padding: "18px 36px",
              marginBottom: "18px",
            }}
          >
            <span
              style={{
                fontSize: "52px",
                fontWeight: 700,
                color: "#0D9488",
                fontFamily: "monospace",
              }}
            >
              {formatCurrency(range.median)}
            </span>
            <span style={{ fontSize: "18px", color: "#64748B" }}>
              typical range {formatCurrency(range.low)} – {formatCurrency(range.high)}
            </span>
          </div>
        )}

        <p style={{ fontSize: "18px", color: "#94A3B8", textAlign: "center" }}>
          {asOfLabel ? `${asOfLabel} · ` : ""}
          Sourced &amp; dated estimates
        </p>
      </div>
    ),
    { ...size }
  );
}
