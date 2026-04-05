import type { MetadataRoute } from "next";
import { STATES } from "@/lib/constants/states";
import { CATEGORIES } from "@/lib/constants/categories";

const BASE_URL = "https://legalcostcalc.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/compare`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const seoPages: MetadataRoute.Sitemap = [];
  for (const state of STATES) {
    for (const cat of CATEGORIES) {
      seoPages.push({
        url: `${BASE_URL}/${state.slug}/${cat.slug}-cost`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  return [...staticPages, ...seoPages];
}
