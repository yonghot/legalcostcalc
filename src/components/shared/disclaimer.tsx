import { AlertTriangle } from "lucide-react";
import { DISCLAIMER_SHORT, DISCLAIMER_TEXT } from "@/lib/constants/disclaimer";
import { FOCUS_RING } from "@/lib/utils/styles";

export function DisclaimerNote({ className }: { className?: string }) {
  return (
    <p
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 ${className ?? ""}`}
    >
      <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <span>{DISCLAIMER_SHORT}</span>
      <a
        href="#disclaimer"
        className={`-my-3 inline-block rounded-sm py-3 font-medium text-amber-800 underline hover:text-amber-900 ${FOCUS_RING}`}
      >
        Read the full disclaimer
      </a>
    </p>
  );
}

export function Disclaimer({ variant = "full", id }: { variant?: "full" | "compact"; id?: string }) {
  if (variant === "compact") {
    return (
      <p id={id} className="text-xs text-amber-700">
        {DISCLAIMER_TEXT}
      </p>
    );
  }

  return (
    <div id={id} className="scroll-mt-24 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-amber-700">
          {DISCLAIMER_TEXT}
        </p>
      </div>
    </div>
  );
}
