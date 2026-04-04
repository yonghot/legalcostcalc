import {
  findAllCategories,
  findCategoryBySlug,
} from "@/lib/repositories/category-repository";
import { CategoryInfo } from "@/lib/types";

export async function getAllCategories(): Promise<CategoryInfo[]> {
  return findAllCategories();
}

export async function getCategoryBySlug(
  slug: string,
): Promise<CategoryInfo | null> {
  return findCategoryBySlug(slug);
}
