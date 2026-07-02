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
    costFormationNotes: [
      "Divorce costs form around two variables that compound each other: how much the spouses disagree on, and how many separate issues (property division, child custody, child support, alimony) are in dispute. An uncontested divorce with no minor children and no real estate can resolve with a single court filing fee and a document-preparation charge. Once custody or asset division is contested, cost accumulates from discovery (formal document exchange), mediation sessions billed hourly, and — in the most complex cases — expert witnesses such as forensic accountants (business or investment valuation) and custody evaluators.",
      "Attorney billing in divorce is typically hourly rather than flat-fee, because the number of court appearances and negotiation rounds is not knowable in advance. A retainer is paid upfront and drawn down as the attorney bills time; complex cases often require replenishing the retainer more than once. Court filing fees and mediation fees are set by the state or county and apply regardless of which attorney is hired.",
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
    costFormationNotes: [
      "DUI/DWI legal cost has two layers that are easy to underestimate: the attorney fee itself, and the non-attorney costs that follow a conviction or plea. The attorney fee is driven mainly by whether the case goes to trial (far more hours billed) or resolves through a plea agreement, plus complicating factors like BAC level, prior offenses, or an accident with injuries. Many DUI attorneys charge a flat fee for a straightforward first offense and switch to hourly billing once the case becomes contested.",
      "Beyond the attorney, a DUI case typically layers on court fines, a state-mandated alcohol education or treatment program, license reinstatement fees, and — for many drivers — an ignition interlock device with ongoing monthly costs. Insurance premium increases are not a one-time legal cost but often the largest total expense over a 3-5 year period following conviction, which is why the figures on this page reflect legal defense costs specifically, not the lifetime cost of a conviction.",
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
    costFormationNotes: [
      "Personal injury cost formation works differently from most other legal matters because the attorney fee is usually contingent — a percentage of any settlement or verdict rather than an hourly bill. That percentage typically rises if the case proceeds to litigation or trial rather than settling early, since more attorney hours and case costs are involved. If there is no recovery, the client generally owes no attorney fee, though case costs (filing fees, expert reports) may still apply depending on the retainer agreement.",
      "Separate from the attorney's percentage, a personal injury case accumulates its own case costs: expert witness fees (medical experts, accident reconstructionists), records requests, deposition transcription, and court filing fees if a lawsuit is filed. Simple claims that settle directly with an insurer before litigation avoid most of these costs; complex cases involving disputed liability, multiple parties, or serious injury typically require the full expert and litigation cost stack.",
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
    costFormationNotes: [
      "Bankruptcy cost formation splits along the two most common filing types. Chapter 7 (liquidation) is a shorter federal process, so attorney fees are usually charged as a flat fee covering the whole case. Chapter 13 (repayment plan) requires the attorney to stay involved for the full 3-5 year repayment period, so the fee is higher and is often split into an upfront portion plus ongoing amounts paid through the repayment plan itself.",
      "On top of the attorney fee, every filer pays a federal court filing fee (set by statute, the same nationwide regardless of state) plus mandatory credit counseling and debtor education course fees. Case complexity within either chapter — multiple creditors, contested exemptions, business assets, or a means-test dispute — adds attorney hours beyond the base flat fee, which is why complex-case costs run well above the simple-case median shown on this page.",
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
    costFormationNotes: [
      "Real estate closing legal costs form mainly around whether the transaction is a standard residential purchase or one complicated by title problems, a short sale, new construction, or commercial elements. In a simple closing, the attorney's role is largely contract review, title coordination, and attending closing itself, which supports flat-fee pricing. Complications — a title defect that needs curing, a dispute between buyer and seller, or financing contingencies falling through — shift the engagement to hourly billing and add attorney hours.",
      "Attorney fees are only one line item inside total closing costs. Title search and title insurance, appraisal, recording fees, and any survey costs are set largely by the transaction's price and the title company or county, not by which attorney is hired. Attorneys in some states are required participants at closing while in others their involvement is optional but still commonly used to review the purchase contract before signing.",
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
    costFormationNotes: [
      "Estate planning and probate cost formation depends on which side of death the work happens on. Planning documents drafted while someone is alive — a will, a revocable living trust, powers of attorney — are usually flat-fee, priced by document complexity and whether a trust (which avoids probate but requires more drafting) is involved rather than a simple will alone. Probate, which happens after death when an estate moves through court, is billed differently: often hourly or as a percentage of the estate's value, and its cost tracks estate size and how many beneficiaries or disputes are involved.",
      "The biggest cost driver in probate specifically is whether the estate is contested. An estate with a clear will, cooperative beneficiaries, and no significant debts moves through simple probate with predictable court filing fees, executor fees, and appraisal costs. A contested estate — disputed will validity, disagreements among heirs, or complex assets like a business — adds litigation-style hourly billing on top of the base probate costs, which is why complex-case figures on this page run substantially above the simple-case median.",
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
    costFormationNotes: [
      "Criminal defense costs form primarily around charge severity and how the case resolves. A misdemeanor that ends in a straightforward plea negotiation is the least expensive scenario and is often billed as a flat fee, since the attorney can reasonably predict the hours involved. A felony charge, multiple counts, or a case that proceeds to trial multiplies the work substantially — pretrial motions, evidence review, witness preparation, and the trial itself — which is why most complex criminal defense engagements move to hourly billing or a large retainer with hourly drawdown.",
      "Court-appointed public defenders are available at no direct cost to defendants who qualify financially, which is why the figures on this page reflect private attorney costs specifically. Private representation typically offers more attorney time per case and can be worth it for serious charges, but the actual price a defendant pays scales directly with case complexity and whether the matter is resolved pretrial or goes to trial.",
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
    costFormationNotes: [
      "Immigration legal costs form around two separate line items that are easy to conflate: the attorney's fee for their work, and USCIS (or other federal agency) filing fees, which are set nationally and apply no matter which attorney — or no attorney — handles the case. A straightforward family-based petition with no complicating history is the lowest-cost scenario and is often billed as a flat fee. Employment-based petitions, waivers, or removal defense involve substantially more attorney hours preparing evidence and responding to government requests, which is reflected in the moderate and complex figures on this page.",
      "Because filing fees are federal and state-independent, cost differences between states for immigration matters come almost entirely from local attorney market rates rather than from any difference in the underlying legal process. Cases that draw a Request for Evidence, involve a prior denial, or require appearing before an immigration judge add attorney hours (and sometimes additional filing fees) well beyond the base petition cost.",
    ],
  },
];

export const CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.slug, c]));
