import verifiedFeesData from "@/data/verified-fees.json";

export interface VerifiedFee {
  state: string;
  category: string;
  item: string;
  range: string;
  sourceUrl: string;
  fetchedOn: string;
}

export const UNVERIFIED_COURT_FEE_LINE = "Court filing fee (set by the court; varies by county)";

const SEEDED_COURT_FEE_LINE = /^Court filing fee \(\$/;

const VERIFIED_FEES: readonly VerifiedFee[] = verifiedFeesData;

export function verifiedFeeLine(fee: VerifiedFee): string {
  return `${fee.item} (${fee.range})`;
}

export function findVerifiedFee(stateCode: string, categorySlug: string): VerifiedFee | null {
  return VERIFIED_FEES.find((f) => f.state === stateCode && f.category === categorySlug) ?? null;
}

export function verifiedFeeForLine(
  line: string,
  stateCode: string,
  categorySlug: string,
): VerifiedFee | null {
  const fee = findVerifiedFee(stateCode, categorySlug);
  return fee && line === verifiedFeeLine(fee) ? fee : null;
}

export function presentCommonFees(
  lines: readonly string[],
  stateCode: string,
  categorySlug: string,
): string[] {
  const verified = findVerifiedFee(stateCode, categorySlug);
  return lines.map((line) => {
    if (!SEEDED_COURT_FEE_LINE.test(line)) return line;
    return verified ? verifiedFeeLine(verified) : UNVERIFIED_COURT_FEE_LINE;
  });
}
