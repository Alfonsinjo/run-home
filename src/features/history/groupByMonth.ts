import type { DayEntry } from '@/domain/types';

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

export function groupByMonth(entries: Record<string, DayEntry>) {
  const map = new Map<string, DayEntry[]>();
  for (const e of Object.values(entries)) {
    const month = e.date.slice(0, 7);
    map.set(month, [...(map.get(month) ?? []), e]);
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, days]) => ({
      month,
      label: `${MONTHS[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`,
      totalKm: Math.round(days.reduce((s, d) => s + d.km, 0) * 10) / 10,
      days: [...days].sort((a, b) => b.date.localeCompare(a.date)),
    }));
}
