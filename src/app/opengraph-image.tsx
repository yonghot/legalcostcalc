import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "LegalCostCalc — How Much Will Your Legal Matter Really Cost?";
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
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "#0D9488",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "16px",
              color: "white",
              fontSize: "28px",
              fontWeight: 700,
            }}
          >
            $
          </div>
          <span
            style={{
              fontSize: "32px",
              fontWeight: 700,
              color: "#0D9488",
            }}
          >
            LegalCostCalc
          </span>
        </div>
        <h1
          style={{
            fontSize: "56px",
            fontWeight: 700,
            color: "#0F172A",
            textAlign: "center",
            lineHeight: 1.2,
            marginBottom: "16px",
          }}
        >
          How Much Will Your Legal
          <br />
          Matter{" "}
          <span style={{ color: "#0D9488" }}>Really</span> Cost?
        </h1>
        <p
          style={{
            fontSize: "24px",
            color: "#475569",
            textAlign: "center",
            maxWidth: "800px",
          }}
        >
          Free cost estimates for 50 states &middot; 8 legal categories &middot; Real data
        </p>
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginTop: "32px",
          }}
        >
          {["Divorce", "DUI", "Bankruptcy", "Personal Injury"].map((cat) => (
            <div
              key={cat}
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
              {cat}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
