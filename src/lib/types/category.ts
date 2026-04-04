export interface CategoryInfo {
  slug: string;
  displayName: string;
  description: string;
  seoTitleTemplate: string;
  seoDescriptionTemplate: string;
  sortOrder: number;
}

export type LegalCategorySlug =
  | "divorce"
  | "dui"
  | "personal-injury"
  | "bankruptcy"
  | "real-estate"
  | "estate-planning"
  | "criminal-defense"
  | "immigration";
