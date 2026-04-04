import { STATES } from "@/lib/constants/states";
import { StateInfo } from "@/lib/types";

// States are static data — no database query needed for MVP
export async function findAllStates(): Promise<StateInfo[]> {
  return STATES;
}

export async function findStateByCode(
  code: string,
): Promise<StateInfo | null> {
  return STATES.find((s) => s.code === code.toUpperCase()) || null;
}

export async function findStateBySlug(
  slug: string,
): Promise<StateInfo | null> {
  return STATES.find((s) => s.slug === slug) || null;
}
