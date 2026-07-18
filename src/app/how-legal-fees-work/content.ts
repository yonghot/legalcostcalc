// src/app/how-legal-fees-work/content.ts
// U-02 (부속U §4/§5) — original editorial guide content. INFORMATIONAL ONLY:
// explains how attorney fee structures and fee-regulation rules work in
// general; makes no recommendation, prediction, or claim about any specific
// case. Every fact below is grounded in a source in GUIDE_SOURCES, verified
// via live web search on the date in GUIDE_UPDATED — no invented numbers,
// dates, or citations. Volatile figures (average hourly rate, state-specific
// dollar/percentage thresholds) are framed as "verify at {official source}"
// rather than stated as permanent facts — see GUIDE_VERIFY_NOTES.
//
// Modeled on LaunchCostCalc's /how-to-start-an-llc guide (commit 2746a0a) per
// 부속U §4 U-02: numbered GuideSection prose, a sourced GUIDE_FACTS "at a
// glance" block, and a GUIDE_SOURCES citation list rendered on the page.

export interface GuideSection {
  heading: string;
  prose: string;
  bullets?: string[];
}
export interface GuideFact {
  fact: string;
  detail: string;
  sourceUrl: string;
}
export interface GuideSource {
  name: string;
  url: string;
}

/** Date this content was authored/verified against the live sources below. */
export const GUIDE_UPDATED = "2026-07-18";

export const GUIDE_FACTS: GuideFact[] = [
  {
    fact: "Lawyers bill four basic ways: hourly, flat, contingency, or a retainer against hourly work",
    detail:
      "Which one applies to a given matter depends mainly on how predictable the work is and whether the matter produces a cash recovery to take a percentage of — not on which lawyer is hired.",
    sourceUrl: "https://www.nolo.com/legal-encyclopedia/attorneys-fees-basics-30196.html",
  },
  {
    fact: "A fee must be \"reasonable\" under the professional-conduct rule every U.S. state has adopted a version of",
    detail:
      "ABA Model Rule 1.5 lists eight non-exclusive factors — time and skill required, case difficulty, customary local rates, amount at stake, and whether the fee is fixed or contingent, among others — rather than a fixed dollar cap.",
    sourceUrl:
      "https://www.americanbar.org/groups/professional_responsibility/publications/model_rules_of_professional_conduct/rule_1_5_fees/",
  },
  {
    fact: "Contingency fee agreements must be in writing and state the exact percentage",
    detail:
      "Model Rule 1.5(c) requires a signed writing stating the percentage at each stage, how case expenses are deducted, and a written accounting once the matter concludes.",
    sourceUrl:
      "https://www.americanbar.org/groups/professional_responsibility/publications/model_rules_of_professional_conduct/rule_1_5_fees/comment_on_rule_1_5/",
  },
  {
    fact: "Money paid upfront (a retainer) must sit in a separate client trust account, not the lawyer's own account",
    detail:
      "Model Rule 1.15 requires advance fees to be deposited into a trust account and withdrawn only as work is actually billed; most of these are IOLTA accounts, which pool small/short-term client balances and route the interest to legal-aid funding.",
    sourceUrl:
      "https://www.americanbar.org/groups/professional_responsibility/publications/model_rules_of_professional_conduct/rule_1_15_safekeeping_property/",
  },
  {
    fact: "California requires a written fee agreement once a matter is expected to cost more than $1,000",
    detail:
      "Business & Professions Code §6148 makes the written-contract requirement mandatory above that threshold and voidable at the client's option if skipped — one concrete, sourced example of a state-specific writing rule.",
    sourceUrl: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=6148.&lawCode=BPC",
  },
  {
    fact: "The national average lawyer hourly rate was about $349 in the 2025 Legal Trends Report",
    detail:
      "Clio's aggregated billing data put the state average range from roughly $196 (West Virginia) to roughly $492 (Washington, D.C.); this figure moves year to year, so treat it as a benchmark, not a quote for any case.",
    sourceUrl: "https://www.clio.com/resources/legal-trends/compare-lawyer-rates/",
  },
  {
    fact: "California caps the contingency fee in medical-malpractice cases at 25% (pre-filing) or 33% (post-filing)",
    detail:
      "Business & Professions Code §6146, as revised by AB 35 effective January 1, 2023, replaced the state's older sliding-scale formula with this simpler two-tier cap — a court may approve a higher fee for good cause if the case reaches trial or arbitration.",
    sourceUrl: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=6146.&lawCode=BPC",
  },
  {
    fact: "New York uses a five-tier sliding scale to cap medical-malpractice contingency fees",
    detail:
      "Judiciary Law §474-a sets 30% of the first $250,000 recovered, 25% of the next $250,000, 20% of the next $500,000, 15% of the next $250,000, and 10% of anything above $1,250,000 — so the effective percentage falls as the recovery grows.",
    sourceUrl: "https://www.nysenate.gov/legislation/laws/JUD/474-A",
  },
  {
    fact: "Every state allows a lawyer to handle just part of a case (\"limited-scope\" or \"unbundled\" representation)",
    detail:
      "Model Rule 1.2(c) permits this when the limitation is reasonable and the client gives informed consent — commonly billed as a flat fee for the specific task rather than the full matter.",
    sourceUrl:
      "https://www.americanbar.org/groups/professional_responsibility/publications/model_rules_of_professional_conduct/rule_1_2_scope_of_representation_allocation_of_authority_between_client_lawyer/",
  },
];

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    heading:
      "What \"legal fees\" actually means — and why two similar cases can cost wildly different amounts",
    prose:
      "When people ask how much a lawyer costs, they're really asking two separate questions: how the fee is structured (hourly, flat, contingency, or some mix) and how much the case will end up costing once that structure meets the actual work involved. The same divorce or personal injury claim can produce very different bills depending on which billing model applies and how much of the underlying work stays predictable versus unfolds unpredictably once it's in front of a court. Every U.S. state regulates lawyer fees through a professional-conduct rule modeled on the American Bar Association's Model Rules — states adopt their own versions and add their own statutes on top, but the reasonableness standard and writing requirements described in this guide trace back to the same source. This page walks through each fee structure, the rules governing how fees are set and disclosed, where cost typically comes from inside a legal matter, and how to read a fee agreement — it does not estimate what a specific case will cost; the calculator elsewhere on this site does that using sourced, state-level cost data.",
    bullets: [
      "This is general information about how legal fees work, not legal advice. No fee structure is inherently better or worse — the right one depends on the type of matter.",
      "Fee rules and dollar/percentage thresholds vary by state. California and New York are used below as concrete, sourced examples of real regulation, not as a national standard.",
      "For a specific case, consult a licensed attorney in the relevant state and get the fee agreement in writing before work begins.",
    ],
  },
  {
    heading: "Hourly billing: paying for time, not for outcome",
    prose:
      "Under hourly billing, the client pays for the actual time an attorney (and often support staff, at a lower rate) spends on the matter, typically tracked in increments of a tenth or a quarter of an hour and invoiced monthly. It's the default arrangement whenever the amount of work is hard to predict in advance — contested divorce litigation, criminal defense that might go to trial, or any dispute where the number of hearings and negotiation rounds depends on how the other side behaves. Hourly rates vary enormously by practice area and location: the 2025 Clio Legal Trends Report put the national average lawyer hourly rate at roughly $349, ranging from about $196 in West Virginia to about $492 in Washington, D.C., with corporate work commanding the highest per-hour rates and juvenile-related work among the lowest. Because the total bill is a function of hours worked rather than a number fixed at the outset, hourly engagements are usually paired with a retainer — an upfront deposit the attorney draws down as work is billed — rather than being billed after the fact with nothing set aside. The core trade-off is that hourly billing is the most transparent about what the lawyer is actually doing with the time, and the least predictable about the final number, since additional hearings or slower negotiations show up directly on the invoice.",
  },
  {
    heading: "Flat fees: one price for a defined piece of work",
    prose:
      "A flat fee sets a single price for a clearly defined scope of work, regardless of how many hours the attorney ultimately spends completing it. It works best when the task is repeatable enough that the attorney can reasonably estimate the labor in advance — drafting a will, preparing an uncontested divorce petition, handling a standard real estate closing, or defending a first-time misdemeanor expected to resolve through a plea rather than a trial. Because the price doesn't move once complications appear, flat-fee agreements typically define the scope narrowly and specify what happens — often a shift to hourly billing for the additional work — if the matter turns out to be more complex than assumed, such as a will becoming a contested probate or a routine charge picking up aggravating factors. From the client's side, a flat fee trades some flexibility for cost certainty: it's the easiest structure to compare across attorneys and budget for, but it generally isn't offered for open-ended litigation, where nobody can know in advance how many court appearances a matter will require.",
  },
  {
    heading: "Contingency fees: the lawyer is paid only if you recover money",
    prose:
      "In a contingency fee arrangement, the attorney's fee is a percentage of whatever the client ultimately recovers through settlement, arbitration, or a court judgment — and the attorney is paid nothing if there is no recovery. It's the standard model for personal injury and similar claims, since it lets a client with a valid claim but no cash on hand pursue it, and it aligns the attorney's incentive with maximizing the recovery. Under Model Rule 1.5(c), a contingency fee agreement must be in writing, signed by the client, and must state the exact percentage, how case expenses (filing fees, expert witnesses, deposition costs) are handled, and whether those expenses are deducted before or after the percentage is applied — a detail that materially changes what the client keeps. The percentage is generally negotiable and commonly rises if the case proceeds to litigation or trial rather than settling early, since a contested case requires substantially more attorney time and risk. A minority of matter types — most family law and criminal defense work — are barred from contingency billing entirely under professional-conduct rules, because tying a lawyer's fee to the outcome of a divorce or a criminal charge raises different concerns than it does in a claim for money damages.",
  },
  {
    heading: "Retainers and trust accounts: where an upfront payment actually goes",
    prose:
      "A retainer is an upfront payment a client makes before hourly work begins, meant to fund the early stages of a matter rather than serve as the attorney's fee itself. Under Model Rule 1.15, the attorney must deposit that advance payment into a separate client trust account and can withdraw from it only as fees are actually earned or expenses actually incurred — the money legally remains the client's until it is billed against, not the lawyer's the moment it's received. Most of these accounts are IOLTA (Interest on Lawyers' Trust Accounts) accounts, which pool many clients' short-term or small balances into one interest-bearing account and route the pooled interest to state legal-aid programs, since an individual balance is usually too small or held too briefly to earn meaningful interest on its own. A retainer agreement should specify the deposit amount, how it will be billed against over time, and when and how the client is expected to replenish it once it runs low — running out of retainer without replenishment is a common reason work on a case stalls.",
  },
  {
    heading:
      "What makes a fee \"reasonable\"? Inside the professional-conduct rule every state has adopted a version of",
    prose:
      "Every U.S. jurisdiction's rules of professional conduct include a version of ABA Model Rule 1.5, which prohibits a lawyer from charging or collecting an unreasonable fee. Rather than setting a specific dollar cap, the rule lists factors regulators and courts weigh when a fee is disputed: the time, labor, and skill the work actually required; the difficulty and novelty of the legal questions; whether taking the case precluded other work; the fee customarily charged for similar services in that locality; the amount at stake and the result obtained; any time pressure imposed by the client or circumstances; the length of the attorney-client relationship; the attorney's experience and reputation; and whether the fee is fixed or contingent. No single factor controls, and the rule states explicitly that not every factor is relevant in every matter — it is a multi-factor reasonableness test, not a formula. The same rule also requires that the scope of representation and the basis of the fee be communicated to the client, preferably in writing, before or within a reasonable time after the representation begins — the disclosure obligation covered in state-specific detail in the next section.",
  },
  {
    heading: "The written fee agreement: what the law requires you to get in writing",
    prose:
      "Beyond the general Model Rule 1.5 disclosure requirement, many states impose specific, mandatory writing rules once a matter crosses a certain size or fee type. California is a concrete, sourced example: Business & Professions Code §6148 requires a written fee contract whenever the total expected cost — including attorney fees — is reasonably foreseeable to exceed $1,000, and that contract must state the basis of compensation (hourly rate, flat fee, or other), the general scope of services, and each party's responsibilities; skipping this requirement makes the agreement voidable at the client's option. Contingency fee agreements face an even stricter, near-universal writing requirement under Model Rule 1.5(c) — the percentage, expense handling, and a post-case written accounting are all required elements, not optional disclosures. These rules exist because the fee agreement is one of the most common sources of later attorney-client disputes, and a clear written record — rather than a verbal understanding — is what regulators, fee-arbitration panels, and courts look to if a disagreement arises.",
  },
  {
    heading: "Why some states cap the lawyer's percentage in certain contingency cases",
    prose:
      "While contingency percentages are generally negotiable, a number of states place statutory limits on the percentage an attorney may charge specifically in medical malpractice cases. California's cap, revised by AB 35 effective January 1, 2023, limits the contingency fee to 25% of the recovery for cases that settle before a lawsuit or arbitration demand is filed, and 33% for cases resolved after a complaint or arbitration demand is filed, with a court able to approve a higher fee for good cause if the case proceeds to trial or arbitration. New York uses a five-tier sliding scale instead of a flat percentage: 30% of the first $250,000 recovered, 25% of the next $250,000, 20% of the next $500,000, 15% of the next $250,000, and 10% of any amount above $1,250,000 — so the attorney's effective percentage on a large recovery ends up lower than on a small one. These caps apply specifically to medical malpractice matters in the states that have enacted them; contingency fees in other case types are typically set by negotiation and the general reasonableness standard rather than a statutory limit, and cap structures vary — or don't exist — outside the states named here, so the applicable state's statute is the source to check for any other jurisdiction.",
  },
  {
    heading: "Limited-scope representation: paying for part of a case, not all of it",
    prose:
      "Every state now permits \"limited scope\" or \"unbundled\" representation, in which a lawyer handles one specific, defined task within a legal matter — reviewing a document, appearing at a single hearing, drafting one filing — rather than taking on the entire case from start to finish. Under Model Rule 1.2(c), this arrangement is allowed when the limitation is reasonable under the circumstances and the client gives informed consent, typically documented in the fee agreement itself. Because the task is narrow and defined, unbundled work is usually billed as a flat fee rather than hourly, which is part of why the model has been promoted as a way to make legal help more accessible to people who can't afford, or don't need, full representation. The trade-off is that a client handling an unbundled matter remains responsible for every part of the case the attorney wasn't hired to cover, so understanding exactly what is — and isn't — included in the engagement is the central thing a limited-scope agreement needs to make clear.",
  },
  {
    heading: "What a lawyer's hour actually costs, state by state",
    prose:
      "Average hourly rates differ substantially by both practice area and geography, and the two move independently — a routine matter handled in an expensive market can cost more per hour than a specialized matter handled somewhere cheaper. Per the 2025 Clio Legal Trends Report, the national average lawyer hourly rate is roughly $349, with corporate practice averaging the highest rates (around $461) and juvenile-related practice the lowest (around $135); by state, the reported average ranges from roughly $196 in West Virginia to roughly $492 in Washington, D.C. These figures are national averages compiled from aggregated billing data across many firms, not a quote for any specific matter, and they shift as the report is updated each year — the current, live rate table is a better reference than any single figure reproduced on this page. Rate alone also doesn't determine total cost: a lower hourly rate applied to more hours can easily exceed a higher rate applied to a more efficiently handled matter, which is one reason total estimated cost by state, category, and complexity — not hourly rate alone — is what the calculator on this site is built to surface.",
  },
  {
    heading: "How fee structure tends to track the type of legal matter",
    prose:
      "Fee structure isn't assigned randomly — it tends to follow from how predictable the work is and whether the matter produces a monetary recovery to take a percentage of. Matters that resolve into a cash settlement or award, most notably personal injury claims, are the classic contingency-fee setting, since the client typically has no funds to pay hourly upfront and the attorney's incentive is naturally aligned with the size of the recovery. Matters that produce a defined document or a single predictable proceeding — an uncontested divorce, a simple will, a standard real estate closing, a first-time misdemeanor expected to end in a plea — are commonly billed as a flat fee. Matters where the number of court appearances and the other side's conduct can't be known in advance — contested divorce, felony criminal defense, a probate that turns into a will contest, or litigation generally — tend toward hourly billing, sometimes starting as a flat-fee phase that converts to hourly once the matter becomes contested. These are general patterns rather than fixed rules; the specific fee an individual attorney offers for a given matter is set case by case.",
  },
  {
    heading: "If you think you were overcharged: fee disputes and fee arbitration",
    prose:
      "When a client disputes a bill, many states offer — and some require lawyers to notify clients of — a fee-dispute or fee-arbitration program run through the state or a local bar association, as an alternative to litigating over the bill in court. California's Mandatory Fee Arbitration Act is a well-documented example: before a lawyer can sue a client to collect unpaid fees, the lawyer must give the client written notice of the right to arbitrate the dispute through the State Bar or a local bar association's program; the client then has 30 days to request arbitration, and if they do, the lawyer is required to participate. The arbitration itself is informal and confidential, decided by a neutral arbitrator or a three-arbitrator panel for larger disputes, and is generally faster and less expensive than litigating the same dispute in court. Programs, deadlines, and whether arbitration is binding vary by state — the structure described here is California's specific process, illustrating the kind of forum many states provide rather than a nationwide standard — so the state or local bar association where a matter is pending is the source to check for the exact procedure available.",
  },
  {
    heading: "Before you sign: what a fee agreement should make clear",
    prose:
      "Whatever fee structure applies, professional-conduct rules and state law point to the same handful of items a written fee agreement is expected to address: which fee structure applies (hourly, flat, contingency, or a hybrid) and the actual rate or percentage; what is and isn't included in the scope of work, and what happens if the matter becomes more complex than expected; how expenses separate from the fee itself — filing fees, expert costs, deposition costs — are handled and who pays them; for a retainer, the deposit amount and how it will be billed against and replenished; and for a contingency fee, the exact percentage at each stage and how it is calculated against the recovery. None of this is a checklist for negotiating a better deal — it is simply the set of terms the applicable professional-conduct rules and, in some states, statutes already require to be addressed in writing, so having each one clearly stated is what makes an agreement enforceable and reduces the odds of a later dispute. A signed, dated copy of the agreement — not a verbal understanding — is what a fee-arbitration panel or court looks to if a disagreement arises later.",
  },
];

export const GUIDE_SOURCES: GuideSource[] = [
  {
    name: "American Bar Association — Model Rule 1.5: Fees",
    url: "https://www.americanbar.org/groups/professional_responsibility/publications/model_rules_of_professional_conduct/rule_1_5_fees/",
  },
  {
    name: "American Bar Association — Model Rule 1.5: Fees (Comment)",
    url: "https://www.americanbar.org/groups/professional_responsibility/publications/model_rules_of_professional_conduct/rule_1_5_fees/comment_on_rule_1_5/",
  },
  {
    name: "American Bar Association — Model Rule 1.15: Safekeeping Property (IOLTA)",
    url: "https://www.americanbar.org/groups/professional_responsibility/publications/model_rules_of_professional_conduct/rule_1_15_safekeeping_property/",
  },
  {
    name: "American Bar Association — Model Rule 1.2: Scope of Representation (limited scope, 1.2(c))",
    url: "https://www.americanbar.org/groups/professional_responsibility/publications/model_rules_of_professional_conduct/rule_1_2_scope_of_representation_allocation_of_authority_between_client_lawyer/",
  },
  {
    name: "The State Bar of California — Mandatory Fee Arbitration Program & Resources",
    url: "https://www.calbar.ca.gov/legal-professionals/legal-resource-center/mandatory-fee-arbitration-program-resources",
  },
  {
    name: "California Business & Professions Code §6148 (written fee agreement threshold)",
    url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=6148.&lawCode=BPC",
  },
  {
    name: "California Business & Professions Code §6146 (MICRA contingency fee limits, post-AB 35)",
    url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=6146.&lawCode=BPC",
  },
  {
    name: "New York Judiciary Law §474-a (medical malpractice contingency fee schedule)",
    url: "https://www.nysenate.gov/legislation/laws/JUD/474-A",
  },
  {
    name: "Clio — Compare Average Lawyer Hourly Rate by State (2025 Legal Trends Report)",
    url: "https://www.clio.com/resources/legal-trends/compare-lawyer-rates/",
  },
  {
    name: "Nolo — The Basics of Attorneys' Fees and Fee Contracts",
    url: "https://www.nolo.com/legal-encyclopedia/attorneys-fees-basics-30196.html",
  },
  {
    name: "Nolo — Why Do Lawyers Say They Don't Get Paid Unless You Win? (contingency fees)",
    url: "https://www.nolo.com/legal-encyclopedia/what-is-a-contingency-fee.html",
  },
  {
    name: "FindLaw — Types of Legal Fees",
    url: "https://www.findlaw.com/hirealawyer/attorney-fees-and-agreements/types-of-legal-fees.html",
  },
];

/**
 * Volatile items called out for verification — rendered as a callout on the
 * page (mirrors LaunchCostCalc's BOI-status callout pattern) and kept here
 * as the documented rationale for the "verify at {official source}" framing.
 * Never state these as permanent facts; they are dated to GUIDE_UPDATED.
 */
export const GUIDE_VERIFY_NOTES: string[] = [
  "The national average hourly rate (~$349) and the $196-$492 state range are from Clio's 2025 Legal Trends Report and change when Clio publishes its next report — verify the current figure at Clio's live rate table (clio.com/resources/legal-trends/compare-lawyer-rates) before relying on an exact number.",
  "California's medical-malpractice contingency cap (25% pre-filing / 33% post-filing) reflects AB 35, effective January 1, 2023, which replaced an older sliding-scale formula. Confirm no further amendment at leginfo.legislature.ca.gov (Business & Professions Code §6146) before relying on it.",
  "New York's sliding-scale percentages (Judiciary Law §474-a) and California's $1,000 written-agreement threshold (Business & Professions Code §6148) are statutory dollar/percentage figures subject to legislative amendment — verify the current text at nysenate.gov / leginfo.legislature.ca.gov before relying on exact numbers.",
  "Contingency-fee caps and fee-arbitration procedures on this page use California and New York as concrete, sourced examples. The rule in any other state may differ or may not exist — check that state's bar association or statutes directly.",
];
