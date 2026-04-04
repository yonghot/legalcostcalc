import Link from "next/link";
import { Scale, Home } from "lucide-react";
import { Disclaimer } from "@/components/shared/disclaimer";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Disclaimer />
      <div className="mt-12 flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50">
          <Scale className="h-8 w-8 text-teal-600" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-slate-900">Page Not Found</h1>
        <p className="mt-3 max-w-md text-slate-600">
          The page you&apos;re looking for doesn&apos;t exist. Try using our cost calculator
          to find legal cost estimates for your state.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-teal-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          Back to Calculator
        </Link>
      </div>
      <div className="mt-16">
        <Disclaimer />
      </div>
    </div>
  );
}
