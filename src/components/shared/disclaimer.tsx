import { AlertTriangle } from "lucide-react";
import { DISCLAIMER_TEXT } from "@/lib/constants/disclaimer";

export function Disclaimer({ variant = "full" }: { variant?: "full" | "compact" }) {
  if (variant === "compact") {
    return (
      <p className="text-xs text-amber-700">
        {DISCLAIMER_TEXT}
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-amber-700">
          {DISCLAIMER_TEXT}
        </p>
      </div>
    </div>
  );
}
