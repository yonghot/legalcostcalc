import Link from "next/link";
import { FOCUS_RING } from "@/lib/utils/styles";

const linkClass = `font-medium text-teal-700 underline hover:text-teal-800 ${FOCUS_RING} rounded-sm`;

export function GuideAndCompareLine({ className }: { className?: string }) {
  return (
    <p className={`text-sm text-slate-600 ${className ?? ""}`}>
      How these fees are billed is explained in{" "}
      <Link href="/how-legal-fees-work" className={linkClass}>
        how legal fees work
      </Link>
      . To weigh two states against each other, use the{" "}
      <Link href="/compare" className={linkClass}>
        compare tool
      </Link>
      .
    </p>
  );
}
