import { BadgeCheck } from "lucide-react";
import { dateLabel, type FamilyDate } from "@/lib/content-dates";

interface UpdatedBadgeProps {
  /** The page family's record in content-dates; renders nothing when absent. */
  record: FamilyDate | undefined;
  className?: string;
}

export function UpdatedBadge({ record, className }: UpdatedBadgeProps) {
  if (!record) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 ${className ?? ""}`}
    >
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
      {dateLabel(record)}
    </span>
  );
}
