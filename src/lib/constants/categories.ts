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
          "An uncontested divorce in {state} is when both spouses agree on all terms (property, custody, support). A contested divorce involves disputes over those terms that require court hearings or attorney negotiations.",
      },
      {
        questionTemplate: "What does a self-represented (pro se) divorce cost in {state} compared with one handled by an attorney?",
        answerTemplate:
          "In a self-represented (pro se) divorce in {state} no attorney fees are billed, while court filing fees and other non-attorney charges, such as service of process or a document-preparation charge, still apply. When an attorney is hired, attorney fees are added; the estimates on this page rise from the simple tier to the complex tier. This information is for general awareness only and is not legal advice.",
      },
    ],
    costFormationNotes: [
      "The issues that can be in dispute in a divorce are property division, child custody, child support and alimony. An uncontested divorce with no minor children and no real estate can involve a single court filing fee and a document-preparation charge. Where custody or asset division is contested, the work can include discovery (formal document exchange), mediation sessions billed hourly and, in some cases, expert witnesses such as forensic accountants (business or investment valuation) and custody evaluators.",
      "Attorneys in divorce matters may bill hourly against a retainer, which is paid upfront and drawn down as the attorney bills time. Court filing fees and mediation fees are separate from attorney fees.",
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
          "Beyond attorney fees, DUI costs in {state} can include court fines, alcohol education programs, license reinstatement fees, increased insurance premiums, ignition interlock device costs, and towing or impound fees.",
      },
      {
        questionTemplate: "Is a first-time DUI in {state} a misdemeanor or felony?",
        answerTemplate:
          "How a first-time DUI in {state} is classified (as a misdemeanor, as a lesser traffic offense, or, with aggravating factors such as very high BAC, accidents with injuries or minors in the vehicle, as a felony) depends on {state} law and the facts of the case. The classification affects legal costs. This is general information only, not legal advice.",
      },
    ],
    costFormationNotes: [
      "DUI/DWI legal cost has two parts: the attorney fee, and the non-attorney costs that can follow a conviction or plea. The attorney fee can differ depending on whether the case goes to trial or resolves through a plea agreement, and on factors such as BAC level, prior offenses, or an accident with injuries.",
      "Beyond the attorney, a DUI case can add court fines, an alcohol education or treatment program, license reinstatement fees, and an ignition interlock device with ongoing monthly costs. Insurance premium increases are not a one-time legal cost; the figures on this page reflect legal defense costs specifically, not the lifetime cost of a conviction.",
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
          "The cost data on this page expresses the attorney fee in a personal injury matter as a percentage of any settlement or verdict (a contingency fee) rather than an hourly bill. Whether court costs and expenses are owed if there is no recovery depends on the fee agreement.",
      },
      {
        questionTemplate: "What is the statute of limitations for personal injury in {state}?",
        answerTemplate:
          "Each state sets its own statute of limitations for personal injury claims, so the deadline that applies in {state} is set by {state} law. Filing deadlines affect the ability to seek compensation and can impact legal costs. This is general information only, not legal advice.",
      },
    ],
    costFormationNotes: [
      "In a personal injury matter the attorney fee is a percentage of any settlement or verdict rather than an hourly bill. Case costs (filing fees, expert reports) are separate from that percentage, and whether they are owed if there is no recovery depends on the retainer agreement. A claim can resolve through a settlement agreement or through a verdict after trial.",
      "Separate from the attorney's percentage, a personal injury case can carry its own case costs: expert witness fees (medical experts, accident reconstructionists), records requests, deposition transcription, and court filing fees if a lawsuit is filed. A claim that settles with an insurer before litigation does not involve court filing fees.",
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
          "Chapter 7 is a liquidation bankruptcy and Chapter 13 is a repayment-plan bankruptcy that runs over 3-5 years. Attorney fees and federal filing fees can differ between the two chapters. Both are filed in federal bankruptcy court.",
      },
      {
        questionTemplate: "Which courses are required with a bankruptcy filing in {state}, and are they part of the attorney fee?",
        answerTemplate:
          "Federal law requires an approved credit counseling course within 180 days before filing and a debtor education course after filing, in every state including {state}. The course fees are paid in addition to the attorney fee and the federal court filing fee. This is general information, not legal advice.",
      },
    ],
    costFormationNotes: [
      "Bankruptcy estimates cover the two common filing types. Chapter 7 (liquidation) is a federal process with no repayment period. Chapter 13 (repayment plan) runs over a 3-5 year repayment period, during which attorney fees can be split into an upfront portion plus amounts paid through the repayment plan itself.",
      "On top of the attorney fee, a filer pays a federal court filing fee (set by statute, the same nationwide) plus credit counseling and debtor education course fees. Case complexity within either chapter — multiple creditors, contested exemptions, business assets, or a means-test dispute — can add attorney hours; the complex-tier estimates on this page are shown next to the simple-tier ones.",
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
        questionTemplate: "How do attorney fees fit into real estate closing costs in {state}?",
        answerTemplate:
          "Attorney fees are one line within total closing costs in {state}, alongside title search and title insurance, appraisal, recording fees, and any survey. Some states require an attorney to be present at closing and others do not, so whether that line appears at all varies by state. This is general information, not legal advice.",
      },
      {
        questionTemplate: "What closing costs does a buyer typically pay in {state}?",
        answerTemplate:
          "Closing costs for a buyer in {state} can include title insurance, appraisal fees, home inspection, loan origination fees, and attorney fees.",
      },
    ],
    costFormationNotes: [
      "A real estate closing is the point at which ownership of a property transfers from the seller to the buyer. A closing can be a standard residential purchase or one involving title problems, a short sale, new construction, or commercial elements. In a closing, the attorney's role can include contract review, title coordination, and attending the closing itself. A title defect that needs curing, a dispute between buyer and seller, or financing contingencies falling through can add attorney hours.",
      "Attorney fees are one line item inside total closing costs, next to title search and title insurance, appraisal, recording fees, and any survey costs. In some states an attorney is a required participant at closing; in others their involvement is optional.",
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
          "A will takes effect through probate after death. A revocable living trust is a document drafted during life that can hold assets outside probate. How each is handled depends on {state} probate law.",
      },
      {
        questionTemplate: "How much does probate cost in {state}?",
        answerTemplate:
          "Probate costs in {state} can include court filing fees, attorney fees (billed hourly or as a percentage of estate value), executor fees, and appraisal costs. Probate is the court process that validates a will and settles an estate, and its duration and cost vary by state law.",
      },
    ],
    costFormationNotes: [
      "Estate planning work happens in two phases: planning documents drafted while someone is alive — a will, a revocable living trust, powers of attorney — and probate, which happens after death when an estate moves through court. A will states how a person's property is to be distributed after death, and a trust is a separate document from a will. Probate can be billed hourly or as a percentage of the estate's value.",
      "Probate can involve court filing fees, executor fees, which are paid to the person who administers the estate, and appraisal costs. A contested estate — disputed will validity, disagreements among heirs, or complex assets like a business — can add litigation-style hourly billing on top of those probate costs.",
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
          "A defendant in {state} who cannot afford a private attorney may qualify for a court-appointed public defender at no cost. Eligibility for a public defender depends on income level.",
      },
      {
        questionTemplate: "Do criminal defense attorneys in {state} charge flat fees or hourly rates?",
        answerTemplate:
          "Criminal defense attorneys in {state} represent people charged with a crime. They can charge a flat fee or bill hourly, and some use a retainer drawn down at an hourly rate. The estimates on this page rise from the simple tier to the complex tier.",
      },
    ],
    costFormationNotes: [
      "Criminal defense work depends on the charge and on how the case resolves, whether through a plea negotiation or at trial. A criminal case can include an arraignment, pretrial motions, plea negotiations, a trial, and sentencing. Misdemeanor charges and felony charges are classified separately under state law. An attorney's work at each stage can include evidence review, witness preparation, and court appearances, and a case with multiple counts, or one that proceeds to trial, can involve all of these stages.",
      "Court-appointed public defenders are available at no direct cost to defendants who qualify financially. A public defender is an attorney appointed by the court to represent such a defendant. The figures on this page reflect private attorney costs.",
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
          "USCIS filing fees are set federally and apply regardless of state. Fees apply to applications such as adjustment of status, naturalization, and work permits. These fees change periodically; check USCIS.gov for current fee schedules.",
      },
      {
        questionTemplate: "What drives the attorney cost of a green card application from {state}?",
        answerTemplate:
          "The attorney cost of a green card application varies by the type of case, such as a family-based petition, an employment-based petition, a waiver, or removal defense; the simple, moderate and complex figures on this page are separate estimates. USCIS filing fees are separate from attorney fees and are set federally, not by {state}. This is general information, not legal advice.",
      },
    ],
    costFormationNotes: [
      "Immigration legal costs have two separate line items: the attorney's fee, and USCIS (or other federal agency) filing fees, which are set nationally and apply whether or not an attorney handles the case. Employment-based petitions, waivers, and removal defense can involve preparing evidence and responding to government requests.",
      "Filing fees are federal and do not differ by state. Cases that draw a Request for Evidence, involve a prior denial, or require appearing before an immigration judge can add attorney hours and, in some cases, additional filing fees. A Request for Evidence is a request from USCIS for additional documents supporting an application, and removal proceedings take place before an immigration judge.",
    ],
  },
];

export const CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.slug, c]));
