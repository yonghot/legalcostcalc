/**
 * lib/reviewer.ts — K06: YMYL reviewer-byline config.
 *
 * A single env/config-driven slot for a real, licensed-attorney reviewer's
 * name (+ optional credentials), read at render time. No default value is
 * ever fabricated: when NEXT_PUBLIC_REVIEWER_NAME is unset, getReviewerConfig()
 * returns null and callers (AuthorByline, OrganizationSchema) state that no
 * licensed attorney has reviewed the page.
 *
 * Sourcing a real reviewer is an owner action (see the ad-revenue spec §9
 * K06 / §10 P04) — this module only wires the render path so the byline can
 * flip to the real name the moment the owner sets the env vars. Never
 * hardcode a name/credential here.
 */

export interface ReviewerConfig {
  /** Real reviewer's display name, e.g. "Jane Smith". */
  name: string;
  /** Optional credentials string, e.g. "Esq., California Bar #123456". */
  credentials: string | null;
}

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Returns the configured reviewer, or null when NEXT_PUBLIC_REVIEWER_NAME is
 * unset/blank. NEXT_PUBLIC_REVIEWER_CREDENTIALS is optional and only used
 * when a name is present.
 */
export function getReviewerConfig(): ReviewerConfig | null {
  const name = clean(process.env.NEXT_PUBLIC_REVIEWER_NAME);
  if (!name) return null;
  return {
    name,
    credentials: clean(process.env.NEXT_PUBLIC_REVIEWER_CREDENTIALS),
  };
}
