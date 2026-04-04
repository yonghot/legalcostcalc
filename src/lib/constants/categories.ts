import { CategoryInfo } from "@/lib/types";

export const CATEGORIES: CategoryInfo[] = [
  {
    slug: "divorce",
    displayName: "Divorce",
    description: "Legal costs for contested and uncontested divorce proceedings",
    seoTitleTemplate: "Divorce Cost in {state} {year} — LegalCostCalc",
    seoDescriptionTemplate:
      "How much does a divorce cost in {state}? Get estimated costs for contested and uncontested divorce, including attorney fees, filing fees, and court costs.",
    sortOrder: 1,
  },
  {
    slug: "dui",
    displayName: "DUI / DWI",
    description: "Legal costs for DUI and DWI defense",
    seoTitleTemplate: "DUI Cost in {state} {year} — LegalCostCalc",
    seoDescriptionTemplate:
      "How much does a DUI cost in {state}? Estimated legal fees, fines, court costs, and total expenses for DUI/DWI defense.",
    sortOrder: 2,
  },
  {
    slug: "personal-injury",
    displayName: "Personal Injury",
    description: "Legal costs for personal injury claims and lawsuits",
    seoTitleTemplate: "Personal Injury Lawyer Cost in {state} {year} — LegalCostCalc",
    seoDescriptionTemplate:
      "How much does a personal injury lawyer cost in {state}? Contingency fees, retainer costs, and total expense estimates.",
    sortOrder: 3,
  },
  {
    slug: "bankruptcy",
    displayName: "Bankruptcy",
    description: "Legal costs for Chapter 7 and Chapter 13 bankruptcy filings",
    seoTitleTemplate: "Bankruptcy Cost in {state} {year} — LegalCostCalc",
    seoDescriptionTemplate:
      "How much does bankruptcy cost in {state}? Attorney fees, filing fees, and total costs for Chapter 7 and Chapter 13.",
    sortOrder: 4,
  },
  {
    slug: "real-estate",
    displayName: "Real Estate Closing",
    description: "Legal costs for real estate transactions and closings",
    seoTitleTemplate: "Real Estate Closing Cost in {state} {year} — LegalCostCalc",
    seoDescriptionTemplate:
      "How much does a real estate attorney cost in {state}? Closing costs, title search fees, and legal expenses.",
    sortOrder: 5,
  },
  {
    slug: "estate-planning",
    displayName: "Estate Planning / Probate",
    description: "Legal costs for wills, trusts, and probate proceedings",
    seoTitleTemplate: "Estate Planning Cost in {state} {year} — LegalCostCalc",
    seoDescriptionTemplate:
      "How much does estate planning cost in {state}? Costs for wills, trusts, probate, and estate administration.",
    sortOrder: 6,
  },
  {
    slug: "criminal-defense",
    displayName: "Criminal Defense",
    description: "Legal costs for misdemeanor and felony criminal defense",
    seoTitleTemplate: "Criminal Defense Lawyer Cost in {state} {year} — LegalCostCalc",
    seoDescriptionTemplate:
      "How much does a criminal defense lawyer cost in {state}? Attorney fees for misdemeanor and felony charges.",
    sortOrder: 7,
  },
  {
    slug: "immigration",
    displayName: "Immigration",
    description: "Legal costs for immigration applications and proceedings",
    seoTitleTemplate: "Immigration Lawyer Cost in {state} {year} — LegalCostCalc",
    seoDescriptionTemplate:
      "How much does an immigration lawyer cost in {state}? Visa, green card, citizenship, and deportation defense costs.",
    sortOrder: 8,
  },
];

export const CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.slug, c]));
