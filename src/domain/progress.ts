import { daysBetweenInclusive, addDays } from './dates';
import type { DayEntry, Settings } from './types';

export type ProgressSummary = {
  totalKm: number;
  remainingKm: number;
  percent: number;
  daysTotal: number;
  daysElapsed: number;
  daysRemaining: number;
  planSollKm: number;
  plusMinusKm: number;
  finished: boolean;
};

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function formatKm(n: number, digits = 1): string {
  return `${n.toFixed(digits).replace('.', ',')} km`;
}

export function computeProgress(
  entries: Record<string, DayEntry>,
  settings: Pick<Settings, 'targetKm' | 'startDate' | 'deadline'>,
  today: string,
): ProgressSummary {
  const { targetKm, startDate, deadline } = settings;
  const totalKm = round1(
    Object.values(entries)
      .filter((e) => e.date >= startDate)
      .reduce((sum, e) => sum + e.km, 0),
  );
  const daysTotal = daysBetweenInclusive(startDate, deadline);
  const cappedToday = today > deadline ? deadline : today;
  const daysElapsed = today < startDate ? 0 : daysBetweenInclusive(startDate, cappedToday);
  const daysRemaining = today > deadline ? 0 : daysBetweenInclusive(today < startDate ? startDate : addDays(today, 1), deadline);
  const planSollKm = daysTotal > 0 ? (targetKm / daysTotal) * daysElapsed : 0;
  const remainingKm = Math.max(0, round1(targetKm - totalKm));
  return {
    totalKm,
    remainingKm,
    percent: targetKm > 0 ? Math.min(1, totalKm / targetKm) : 0,
    daysTotal,
    daysElapsed,
    daysRemaining,
    planSollKm,
    plusMinusKm: totalKm - planSollKm,
    finished: totalKm >= targetKm,
  };
}
