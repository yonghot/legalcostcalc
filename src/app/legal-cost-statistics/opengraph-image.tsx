import { ImageResponse } from "next/og";
import { buildStatisticsAggregate } from "@/lib/seo/statistics";
import { formatCurrency } from "@/lib/utils/format";
import { getOgAsOfLabel } from "@/lib/seo/og-freshness";

export const runtime = "edge";
export const alt = "Legal Cost Statistics by State";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  // CODE-05 — the KEY computed result baked in as text: the real headline
  // stat from buildStatisticsAggregate() (same aggregation the page itself
  // renders — no interpolated or invented figures, no fake ratings).
  const { headline, categoryRows } = buildStatisticsAggregate();
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
          <span style={{ fontSize: "24px", fontWeight: 700, color: "#0D9488" }}>LegalCostCalc</span>
        </div>

        <h1
          style={{
            fontSize: "46px",
            fontWeight: 700,
            color: "#0F172A",
            textAlign: "center",
            lineHeight: 1.2,
            marginBottom: "24px",
          }}
        >
          Legal Cost Statistics by State
        </h1>

        {headline && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: "white",
              border: "2px solid #0D9488",
              borderRadius: "16px",
              padding: "20px 40px",
              marginBottom: "20px",
            }}
          >
            <span
              style={{
                fontSize: "56px",
                fontWeight: 700,
                color: "#0D9488",
                fontFamily: "monospace",
              }}
            >
              {formatCurrency(headline.nationalAverage)}
            </span>
            <span style={{ fontSize: "18px", color: "#64748B" }}>
              median {headline.categoryDisplayName.toLowerCase()} cost — most expensive matter type
            </span>
          </div>
        )}

        <p style={{ fontSize: "20px", color: "#475569", textAlign: "center" }}>
          {categoryRows.length} matter types &middot; 50 states &amp; DC &middot; Sourced &amp; dated data
        </p>
        {asOfLabel && (
          <p style={{ fontSize: "16px", color: "#94A3B8", marginTop: "8px" }}>{asOfLabel}</p>
        )}
      </div>
    ),
    { ...size },
  );
}
