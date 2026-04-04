import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LegalCostCalc — Legal Cost Calculator",
    short_name: "LegalCostCalc",
    description:
      "Free legal cost calculator for all 50 US states. Get estimated costs for divorce, DUI, bankruptcy, personal injury, and more.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0D9488",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
