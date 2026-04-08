"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { STATES } from "@/lib/constants/states";
import { CATEGORIES } from "@/lib/constants/categories";

const ALL_STATE_SLUGS = STATES.map((s) => s.slug);
const ALL_CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function findClosestMatch(
  input: string,
  candidates: string[],
  maxDistance = 3,
): string | null {
  let best: string | null = null;
  let bestDist = maxDistance + 1;
  for (const candidate of candidates) {
    const dist = levenshtein(input.toLowerCase(), candidate.toLowerCase());
    if (dist < bestDist) {
      bestDist = dist;
      best = candidate;
    }
  }
  return bestDist <= maxDistance ? best : null;
}

interface Suggestion {
  label: string;
  href: string;
}

function parseSuggestions(pathname: string): Suggestion[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [];

  const suggestions: Suggestion[] = [];
  const stateSegment = segments[0];
  const slugSegment = segments[1];

  // Try to match state from first segment
  const matchedStateSlug = ALL_STATE_SLUGS.includes(stateSegment)
    ? stateSegment
    : findClosestMatch(stateSegment, ALL_STATE_SLUGS);
  const matchedState = matchedStateSlug
    ? STATES.find((s) => s.slug === matchedStateSlug)
    : null;

  // Try to match category from second segment (strip "-cost" suffix)
  let categoryInput = slugSegment;
  if (categoryInput) {
    categoryInput = categoryInput.replace(/-cost$/, "");
  }
  const matchedCategorySlug = categoryInput
    ? ALL_CATEGORY_SLUGS.includes(categoryInput)
      ? categoryInput
      : findClosestMatch(categoryInput, ALL_CATEGORY_SLUGS)
    : null;
  const matchedCategory = matchedCategorySlug
    ? CATEGORIES.find((c) => c.slug === matchedCategorySlug)
    : null;

  // Build suggestions
  if (matchedState && matchedCategory) {
    suggestions.push({
      label: `${matchedCategory.displayName} Cost in ${matchedState.name}`,
      href: `/${matchedState.slug}/${matchedCategory.slug}-cost`,
    });
  }
  if (matchedState && !matchedCategory) {
    // Suggest top categories for this state
    const topCategories = CATEGORIES.slice(0, 4);
    for (const cat of topCategories) {
      suggestions.push({
        label: `${cat.displayName} Cost in ${matchedState.name}`,
        href: `/${matchedState.slug}/${cat.slug}-cost`,
      });
    }
  }
  if (!matchedState && matchedCategory) {
    // Suggest top states for this category
    const topStates = STATES.filter((s) =>
      ["CA", "TX", "FL", "NY", "IL"].includes(s.code),
    );
    for (const state of topStates) {
      suggestions.push({
        label: `${matchedCategory.displayName} Cost in ${state.name}`,
        href: `/${state.slug}/${matchedCategory.slug}-cost`,
      });
    }
  }

  return suggestions;
}

export function Smart404Suggestions() {
  const pathname = usePathname();
  const suggestions = parseSuggestions(pathname);

  if (suggestions.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
        Did you mean?
      </h2>
      <div className="space-y-2">
        {suggestions.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex items-center justify-between rounded-lg border border-teal-200 bg-teal-50/50 p-3 text-sm transition-all hover:border-teal-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
          >
            <span className="font-medium text-teal-800">{s.label}</span>
            <ArrowRight className="h-5 w-5 text-teal-400" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </div>
  );
}
