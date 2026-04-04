import { CATEGORIES } from "@/lib/constants/categories";
import { CategoryInfo } from "@/lib/types";

// Categories are static data — no database query needed for MVP
export async function findAllCategories(): Promise<CategoryInfo[]> {
  return CATEGORIES;
}

export async function findCategoryBySlug(
  slug: string,
): Promise<CategoryInfo | null> {
  return CATEGORIES.find((c) => c.slug === slug) || null;
}
