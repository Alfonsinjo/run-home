import raw from '../data/funfacts.de.json';
import type { FunFact } from './types';

export const FUN_FACTS: FunFact[] = [...(raw as FunFact[])].sort((a, b) => a.km - b.km);

export function latestFact(totalKm: number): FunFact | null {
  let result: FunFact | null = null;
  for (const f of FUN_FACTS) {
    if (f.km <= totalKm) result = f;
    else break;
  }
  return result;
}

export function nextFact(totalKm: number): FunFact | null {
  return FUN_FACTS.find((f) => f.km > totalKm) ?? null;
}
