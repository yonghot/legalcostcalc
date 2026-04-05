import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Compare Legal Costs — LegalCostCalc";
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
          Compare Legal Costs
        </h1>
        <p
          style={{
            fontSize: "24px",
            color: "#475569",
            textAlign: "center",
            maxWidth: "700px",
          }}
        >
          Side-by-side cost comparison across states and categories
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            marginTop: "40px",
          }}
        >
          <div
            style={{
              background: "white",
              border: "2px solid #0D9488",
              borderRadius: "12px",
              padding: "16px 32px",
              fontSize: "20px",
              color: "#0D9488",
              fontWeight: 600,
            }}
          >
            California
          </div>
          <div
            style={{
              fontSize: "28px",
              color: "#94A3B8",
              fontWeight: 700,
            }}
          >
            vs
          </div>
          <div
            style={{
              background: "white",
              border: "2px solid #0D9488",
              borderRadius: "12px",
              padding: "16px 32px",
              fontSize: "20px",
              color: "#0D9488",
              fontWeight: 600,
            }}
          >
            Texas
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
