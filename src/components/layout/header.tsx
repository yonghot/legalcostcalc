import Link from "next/link";
import { Scale } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600">
            <Scale className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-slate-900">
            LegalCost<span className="text-teal-600">Calc</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-teal-600"
          >
            Calculator
          </Link>
          <Link
            href="/compare"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-teal-600"
          >
            Compare
          </Link>
        </nav>
      </div>
    </header>
  );
}
