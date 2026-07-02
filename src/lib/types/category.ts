export interface FaqTemplate {
  questionTemplate: string;
  answerTemplate: string;
}

export interface CategoryInfo {
  slug: string;
  displayName: string;
  description: string;
  seoTitleTemplate: string;
  seoDescriptionTemplate: string;
  sortOrder: number;
  faqTemplates?: FaqTemplate[];
  /**
   * K01 — entity-level "how this cost forms" editorial, one distinct set of
   * paragraphs per CATEGORY (not per state; state figures are interpolated
   * into the worked example separately using the page's own cost data).
   * Each entry describes the real cost-driving mechanics of that practice
   * area — never a noun-swapped template. See
   * src/components/seo/category-editorial.tsx.
   */
  costFormationNotes?: string[];
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
