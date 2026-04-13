"use client";

import Link from "next/link";
import { Scale, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";
import { FOCUS_RING } from "@/lib/utils/styles";

const NAV_LINKS = [
  { href: "/", label: "Calculator" },
  { href: "/compare", label: "Compare" },
  { href: "/about", label: "About" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="LegalCostCalc home">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600">
            <Scale className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <span className="text-xl font-semibold text-slate-900">
            LegalCost<span className="text-teal-600">Calc</span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium text-slate-600 transition-colors hover:text-teal-600 ${FOCUS_RING} rounded-sm`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className={`inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 ${FOCUS_RING} md:hidden`}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <div className="flex items-center gap-2.5 pb-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600">
                <Scale className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
              <span className="text-lg font-semibold text-slate-900">
                LegalCost<span className="text-teal-600">Calc</span>
              </span>
            </div>
            <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700 ${FOCUS_RING}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
