import Link from "next/link";
import { FOCUS_RING } from "@/lib/utils/styles";

interface EmbedPanelProps {
  embedPath: string;
  label: string;
}

export function EmbedPanel({ embedPath, label }: EmbedPanelProps) {
  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold text-slate-900">Embed this calculator</h2>
      <p className="text-sm text-slate-600">
        Want the {label} on your own site? The{" "}
        <Link href="/embed" className={`font-medium text-teal-700 underline hover:text-teal-800 ${FOCUS_RING} rounded-sm`}>
          embed page
        </Link>{" "}
        has the copy-and-paste code and a source-attribution link. For this page, use the address{" "}
        <code className="rounded bg-slate-100 px-1">{embedPath}</code>.
      </p>
    </div>
  );
}
