import type { DayEntry } from './types';

export type Achievable = { id: string; km: number };

export function achievedDates(entries: Record<string, DayEntry>, items: Achievable[], startDate: string): Record<string, string> {
  const sorted = Object.values(entries).filter((e) => e.date >= startDate).sort((a, b) => a.date.localeCompare(b.date));
  const pending = [...items].sort((a, b) => a.km - b.km);
  const result: Record<string, string> = {};
  let sum = 0;
  for (const e of sorted) {
    sum += e.km;
    while (pending.length && pending[0].km <= sum + 1e-9) result[pending.shift()!.id] = e.date;
    if (!pending.length) break;
  }
  return result;
}
