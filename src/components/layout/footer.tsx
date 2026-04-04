import Link from "next/link";
import { Scale } from "lucide-react";
import { DISCLAIMER_TEXT } from "@/lib/constants/disclaimer";
import { CATEGORIES } from "@/lib/constants/categories";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800 bg-slate-900 text-slate-300">
      {/* Disclaimer */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-amber-900/30 bg-amber-950/30 p-4">
          <p className="text-xs leading-relaxed text-amber-200/80">
            {DISCLAIMER_TEXT}
          </p>
        </div>
      </div>

      {/* Links */}
      <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Scale className="h-5 w-5 text-teal-400" />
              <span className="font-semibold text-white">LegalCostCalc</span>
            </div>
            <p className="text-sm text-slate-400">
              Free legal cost estimates for every US state. Helping you understand the
              real costs of legal matters.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">Legal Categories</h3>
            <ul className="space-y-2">
              {CATEGORIES.slice(0, 6).map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/california/${cat.slug}-cost`}
                    className="text-sm text-slate-400 hover:text-teal-400 transition-colors"
                  >
                    {cat.displayName} Costs
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-slate-400 hover:text-teal-400 transition-colors">
                  Cost Calculator
                </Link>
              </li>
              <li>
                <Link href="/compare" className="text-sm text-slate-400 hover:text-teal-400 transition-colors">
                  Compare States
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
          &copy; {currentYear} LegalCostCalc. All rights reserved. Not a law firm. Not legal advice.
        </div>
      </div>
    </footer>
  );
}
