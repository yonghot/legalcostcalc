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
