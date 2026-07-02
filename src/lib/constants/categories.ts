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
    faqTemplates: [
      {
        questionTemplate: "What is the difference between contested and uncontested divorce in {state}?",
        answerTemplate:
          "An uncontested divorce in {state} is when both spouses agree on all terms (property, custody, support) and is significantly cheaper. A contested divorce involves disputes requiring court hearings and attorney negotiations, substantially increasing legal costs.",
      },
      {
        questionTemplate: "Can I file for divorce without a lawyer in {state}?",
        answerTemplate:
          "Yes, you can file a pro se (self-represented) divorce in {state}, which reduces costs to court filing fees. Cases involving children, significant assets, or disputes are typically more complex and often involve legal representation. This information is for general awareness only and is not legal advice.",
      },
    ],
  },
  {
    slug: "dui",
    displayName: "DUI / DWI",
    description: "Legal costs for DUI and DWI defense",
    seoTitleTemplate: "DUI Cost in {state} {year} — LegalCostCalc",
    seoDescriptionTemplate:
      "How much does a DUI cost in {state}? Estimated legal fees, fines, court costs, and total expenses for DUI/DWI defense.",
    sortOrder: 2,
    faqTemplates: [
      {
        questionTemplate: "What are the total costs beyond attorney fees for a DUI in {state}?",
        answerTemplate:
          "Beyond attorney fees, DUI costs in {state} typically include court fines, alcohol education programs, license reinstatement fees, increased insurance premiums (often for 3-5 years), ignition interlock device costs, and possible towing/impound fees. Total out-of-pocket costs often exceed the attorney fee alone.",
      },
      {
        questionTemplate: "Is a first-time DUI in {state} a misdemeanor or felony?",
        answerTemplate:
          "In most cases, a first-time DUI in {state} is charged as a misdemeanor, though aggravating factors (very high BAC, accidents with injuries, minors in the vehicle) can elevate charges. Misdemeanor vs. felony classification significantly affects legal costs. This is general information only, not legal advice.",
      },
    ],
  },
  {
    slug: "personal-injury",
    displayName: "Personal Injury",
    description: "Legal costs for personal injury claims and lawsuits",
    seoTitleTemplate: "Personal Injury Lawyer Cost in {state} {year} — LegalCostCalc",
    seoDescriptionTemplate:
      "How much does a personal injury lawyer cost in {state}? Contingency fees, retainer costs, and total expense estimates.",
    sortOrder: 3,
    faqTemplates: [
      {
        questionTemplate: "How do contingency fees work for personal injury cases in {state}?",
        answerTemplate:
          "Most personal injury lawyers in {state} work on contingency, meaning you pay nothing upfront. The attorney receives a percentage (typically 33-40%) of any settlement or verdict. If you lose, you generally owe no attorney fees, though you may still owe court costs and expenses.",
      },
      {
        questionTemplate: "What is the statute of limitations for personal injury in {state}?",
        answerTemplate:
          "Each state sets its own statute of limitations for personal injury claims. Filing deadlines affect your ability to seek compensation and can impact legal costs. Consult the {state} state court website or an attorney for current deadlines. This is general information only, not legal advice.",
      },
    ],
  },
  {
    slug: "bankruptcy",
    displayName: "Bankruptcy",
    description: "Legal costs for Chapter 7 and Chapter 13 bankruptcy filings",
    seoTitleTemplate: "Bankruptcy Cost in {state} {year} — LegalCostCalc",
    seoDescriptionTemplate:
      "How much does bankruptcy cost in {state}? Attorney fees, filing fees, and total costs for Chapter 7 and Chapter 13.",
    sortOrder: 4,
    faqTemplates: [
      {
        questionTemplate: "What is the difference between Chapter 7 and Chapter 13 bankruptcy costs in {state}?",
        answerTemplate:
          "Chapter 7 (liquidation) bankruptcy in {state} generally costs less in attorney fees since it is a shorter process. Chapter 13 (repayment plan) requires ongoing attorney involvement over 3-5 years, making it more expensive. Federal filing fees differ between the two chapters as well.",
      },
      {
        questionTemplate: "Do I have to take a credit counseling course before filing bankruptcy in {state}?",
        answerTemplate:
          "Yes, federal law requires completing an approved credit counseling course within 180 days before filing and a debtor education course after filing. These courses typically cost $20-$50 each and are required in all states including {state}. This is general information, not legal advice.",
      },
    ],
  },
  {
    slug: "real-estate",
    displayName: "Real Estate Closing",
    description: "Legal costs for real estate transactions and closings",
    seoTitleTemplate: "Real Estate Closing Cost in {state} {year} — LegalCostCalc",
    seoDescriptionTemplate:
      "How much does a real estate attorney cost in {state}? Closing costs, title search fees, and legal expenses.",
    sortOrder: 5,
    faqTemplates: [
      {
        questionTemplate: "Is a real estate attorney required for closing in {state}?",
        answerTemplate:
          "Some states require an attorney to be present at closing, while others do not. Requirements vary in {state}. Even when not legally required, a real estate attorney can review contracts, resolve title issues, and protect your interests. Check {state} specific regulations for current requirements.",
      },
      {
        questionTemplate: "What closing costs does a buyer typically pay in {state}?",
        answerTemplate:
          "Buyers in {state} typically pay closing costs including title insurance, appraisal fees, home inspection, loan origination fees, and attorney fees. Total closing costs generally range from 2-5% of the purchase price, though this varies by property value and transaction complexity.",
      },
    ],
  },
  {
    slug: "estate-planning",
    displayName: "Estate Planning / Probate",
    description: "Legal costs for wills, trusts, and probate proceedings",
    seoTitleTemplate: "Estate Planning Cost in {state} {year} — LegalCostCalc",
    seoDescriptionTemplate:
      "How much does estate planning cost in {state}? Costs for wills, trusts, probate, and estate administration.",
    sortOrder: 6,
    faqTemplates: [
      {
        questionTemplate: "What is the difference between a will and a trust in {state}?",
        answerTemplate:
          "A will is simpler and cheaper to create but goes through probate after death. A revocable living trust costs more upfront but avoids probate, provides privacy, and can reduce estate settlement time. The right choice depends on your estate size, family situation, and {state} probate laws.",
      },
      {
        questionTemplate: "How much does probate cost in {state}?",
        answerTemplate:
          "Probate costs in {state} typically include court filing fees, attorney fees (often a percentage of estate value or hourly), executor fees, and appraisal costs. Simple estates may cost a few thousand dollars, while complex estates can cost significantly more. Probate duration and cost vary by state law.",
      },
    ],
  },
  {
    slug: "criminal-defense",
    displayName: "Criminal Defense",
    description: "Legal costs for misdemeanor and felony criminal defense",
    seoTitleTemplate: "Criminal Defense Lawyer Cost in {state} {year} — LegalCostCalc",
    seoDescriptionTemplate:
      "How much does a criminal defense lawyer cost in {state}? Attorney fees for misdemeanor and felony charges.",
    sortOrder: 7,
    faqTemplates: [
      {
        questionTemplate: "What is the difference between a public defender and a private attorney in {state}?",
        answerTemplate:
          "If you cannot afford a private attorney in {state}, you may qualify for a court-appointed public defender at no cost. Private attorneys generally offer more availability, smaller caseloads, and more resources, but at significantly higher cost. Eligibility for a public defender depends on income level.",
      },
      {
        questionTemplate: "Do criminal defense attorneys in {state} charge flat fees or hourly rates?",
        answerTemplate:
          "Criminal defense attorneys in {state} use both fee structures. Simple misdemeanors often have flat fees, while felonies and complex cases are typically billed hourly or with a retainer plus hourly arrangement. Trial cases cost significantly more than cases resolved through plea negotiations.",
      },
    ],
  },
  {
    slug: "immigration",
    displayName: "Immigration",
    description: "Legal costs for immigration applications and proceedings",
    seoTitleTemplate: "Immigration Lawyer Cost in {state} {year} — LegalCostCalc",
    seoDescriptionTemplate:
      "How much does an immigration lawyer cost in {state}? Visa, green card, citizenship, and deportation defense costs.",
    sortOrder: 8,
    faqTemplates: [
      {
        questionTemplate: "What government filing fees are required in addition to attorney fees for immigration in {state}?",
        answerTemplate:
          "USCIS filing fees are set federally and apply regardless of state. Common fees include adjustment of status, naturalization, and work permit applications. These fees change periodically and can total hundreds to thousands of dollars on top of attorney fees. Check USCIS.gov for current fee schedules.",
      },
      {
        questionTemplate: "Do I need an immigration lawyer for a green card application from {state}?",
        answerTemplate:
          "While not legally required, an immigration attorney can help navigate complex eligibility rules, prepare documentation, and respond to Requests for Evidence. Simple family-based petitions may not require an attorney, but employment-based, removal defense, and complex cases benefit from professional representation. This is general information, not legal advice.",
      },
    ],
  },
];

export const CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.slug, c]));
