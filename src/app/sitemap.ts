import type { MetadataRoute } from "next";
import { STATES } from "@/lib/constants/states";
import { CATEGORIES } from "@/lib/constants/categories";
import { DATA_VERSION_DATE } from "@/lib/constants/data-meta";

const BASE_URL = "https://legalcostcalc.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = DATA_VERSION_DATE;

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified,
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/compare`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const seoPages: MetadataRoute.Sitemap = [];
  for (const state of STATES) {
    for (const cat of CATEGORIES) {
      seoPages.push({
        url: `${BASE_URL}/${state.slug}/${cat.slug}-cost`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  return [...staticPages, ...seoPages];
}
