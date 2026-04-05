import { ImageResponse } from "next/og";
import { STATE_BY_SLUG } from "@/lib/constants/states";
import { CATEGORY_MAP } from "@/lib/constants/categories";

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
  const year = new Date().getFullYear();

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
            marginBottom: "24px",
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
            fontSize: "52px",
            fontWeight: 700,
            color: "#0F172A",
            textAlign: "center",
            lineHeight: 1.2,
            marginBottom: "16px",
          }}
        >
          How Much Does a {categoryName}
          <br />
          Cost in{" "}
          <span style={{ color: "#0D9488" }}>{stateName}</span>?
        </h1>
        <p
          style={{
            fontSize: "22px",
            color: "#475569",
            textAlign: "center",
          }}
        >
          {year} Attorney Fees, Court Costs &amp; More
        </p>

        <div
          style={{
            display: "flex",
            gap: "32px",
            marginTop: "32px",
            fontSize: "16px",
            color: "#94A3B8",
          }}
        >
          <span>Simple &middot; Moderate &middot; Complex</span>
          <span>|</span>
          <span>Data from multiple sources</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
