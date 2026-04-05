import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "About LegalCostCalc — Our Data & Methodology";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
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
            marginBottom: "32px",
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
            fontSize: "52px",
            fontWeight: 700,
            color: "#0F172A",
            textAlign: "center",
            lineHeight: 1.2,
            marginBottom: "16px",
          }}
        >
          Our Data &amp; Methodology
        </h1>
        <p
          style={{
            fontSize: "24px",
            color: "#475569",
            textAlign: "center",
            maxWidth: "700px",
          }}
        >
          Transparent, source-verified legal cost estimates across all 50 US states
        </p>

        <div
          style={{
            display: "flex",
            gap: "24px",
            marginTop: "40px",
          }}
        >
          {["Data Sources", "Methodology", "Accuracy", "Transparency"].map((item) => (
            <div
              key={item}
              style={{
                background: "white",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                padding: "8px 20px",
                fontSize: "16px",
                color: "#0D9488",
                fontWeight: 600,
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
