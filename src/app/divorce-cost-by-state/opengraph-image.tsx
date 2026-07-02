import { ImageResponse } from "next/og";
import { INDEXABLE_PAGES, getCostByComplexity } from "@/lib/page-index";
import { formatCurrency } from "@/lib/utils/format";

export const runtime = "edge";
export const alt = "Divorce Cost by State: Uncontested vs. Contested";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  // K09 — data-visual OG image: the key stats are the REAL nationwide
  // medians of the uncontested (simple) / contested (complex) columns this
  // hub page itself renders (same INDEXABLE_PAGES + getCostByComplexity
  // source used by the page and by tests/divorce-hub.test.ts) — no
  // interpolated or invented figures.
  const divorceRows = INDEXABLE_PAGES.filter((p) => p.category.slug === "divorce");
  const uncontestedCosts = divorceRows
    .map((p) => getCostByComplexity(p.state.code, "divorce", "simple"))
    .filter((v): v is number => typeof v === "number")
    .sort((a, b) => a - b);
  const contestedCosts = divorceRows
    .map((p) => getCostByComplexity(p.state.code, "divorce", "complex"))
    .filter((v): v is number => typeof v === "number")
    .sort((a, b) => a - b);

  const uncontestedMedian =
    uncontestedCosts.length > 0
      ? uncontestedCosts[Math.floor(uncontestedCosts.length / 2)]
      : null;
  const contestedMedian =
    contestedCosts.length > 0 ? contestedCosts[Math.floor(contestedCosts.length / 2)] : null;

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
          <span style={{ fontSize: "24px", fontWeight: 700, color: "#0D9488" }}>
            LegalCostCalc
          </span>
        </div>

        <h1
          style={{
            fontSize: "46px",
            fontWeight: 700,
            color: "#0F172A",
            textAlign: "center",
            lineHeight: 1.2,
            marginBottom: "28px",
          }}
        >
          Divorce Cost by State: Uncontested vs. Contested
        </h1>

        <div style={{ display: "flex", gap: "24px" }}>
          {uncontestedMedian !== null && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "white",
                border: "2px solid #0D9488",
                borderRadius: "16px",
                padding: "20px 32px",
              }}
            >
              <span style={{ fontSize: "16px", color: "#64748B", marginBottom: "6px" }}>
                Uncontested (median)
              </span>
              <span
                style={{
                  fontSize: "44px",
                  fontWeight: 700,
                  color: "#0D9488",
                  fontFamily: "monospace",
                }}
              >
                {formatCurrency(uncontestedMedian)}
              </span>
            </div>
          )}
          {contestedMedian !== null && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "white",
                border: "2px solid #CBD5E1",
                borderRadius: "16px",
                padding: "20px 32px",
              }}
            >
              <span style={{ fontSize: "16px", color: "#64748B", marginBottom: "6px" }}>
                Contested (median)
              </span>
              <span
                style={{
                  fontSize: "44px",
                  fontWeight: 700,
                  color: "#0F172A",
                  fontFamily: "monospace",
                }}
              >
                {formatCurrency(contestedMedian)}
              </span>
            </div>
          )}
        </div>

        <p style={{ fontSize: "20px", color: "#475569", textAlign: "center", marginTop: "24px" }}>
          All 50 states &amp; DC compared &middot; Sourced &amp; dated estimates
        </p>
      </div>
    ),
    { ...size },
  );
}
