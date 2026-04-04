import { CategoryInfo, StateInfo } from "@/lib/types";

const CURRENT_YEAR = new Date().getFullYear();

export function buildSeoTitle(category: CategoryInfo, state: StateInfo): string {
  return category.seoTitleTemplate
    .replace("{state}", state.name)
    .replace("{year}", String(CURRENT_YEAR));
}

export function buildSeoDescription(category: CategoryInfo, state: StateInfo): string {
  return category.seoDescriptionTemplate
    .replace("{state}", state.name)
    .replace("{year}", String(CURRENT_YEAR));
}

export function buildCanonicalUrl(stateSlug: string, categorySlug: string): string {
  return `/${stateSlug}/${categorySlug}-cost`;
}

export function buildFaqSchema(
  question: string,
  answer: string,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: question,
        acceptedAnswer: {
          "@type": "Answer",
          text: answer,
        },
      },
    ],
  };
}
