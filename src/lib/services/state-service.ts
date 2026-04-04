import {
  findAllStates,
  findStateByCode,
  findStateBySlug,
} from "@/lib/repositories/state-repository";
import { StateInfo } from "@/lib/types";

export async function getAllStates(): Promise<StateInfo[]> {
  return findAllStates();
}

export async function getStateByCode(code: string): Promise<StateInfo | null> {
  return findStateByCode(code);
}

export async function getStateBySlug(slug: string): Promise<StateInfo | null> {
  return findStateBySlug(slug);
}
