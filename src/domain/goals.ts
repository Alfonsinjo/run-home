import { addDays, startOfWeek } from './dates';
import { round1, type ProgressSummary } from './progress';
import type { DayEntry, Settings } from './types';

export function dailyGoalKm(
  settings: Pick<Settings, 'dailyGoalMode' | 'customDailyKm' | 'targetKm'>,
  progress: ProgressSummary,
): number {
  switch (settings.dailyGoalMode) {
    case 'custom':
      return round1(Math.max(0, settings.customDailyKm));
    case 'plan':
      return progress.daysTotal > 0 ? round1(settings.targetKm / progress.daysTotal) : 0;
    case 'catchup':
    default:
      // daysRemaining zählt ab morgen: am Deadline-Tag ist es 0, dann steht der ganze Rest an.
      if (progress.remainingKm <= 0 || progress.pastDeadline) return 0;
      if (progress.daysRemaining <= 0) return round1(progress.remainingKm);
      return round1(progress.remainingKm / progress.daysRemaining);
  }
}

export type DayStatus = 'done' | 'partial' | 'missed' | 'today' | 'future';
export type WeekDay = { date: string; km: number; status: DayStatus };
export type WeekSummary = { weekStart: string; weekGoalKm: number; weekKm: number; days: WeekDay[] };

export function computeWeek(entries: Record<string, DayEntry>, dailyGoal: number, today: string): WeekSummary {
  const weekStart = startOfWeek(today);
  const days: WeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i);
    const km = entries[date]?.km ?? 0;
    let status: DayStatus;
    if (date > today) status = 'future';
    else if (km <= 0) status = date === today ? 'today' : 'missed';
    else if (dailyGoal > 0 && km < dailyGoal) status = 'partial';
    else status = 'done';
    days.push({ date, km, status });
  }
  return {
    weekStart,
    weekGoalKm: dailyGoal * 7,
    weekKm: round1(days.reduce((s, d) => s + d.km, 0)),
    days,
  };
}

export function computeStreak(entries: Record<string, DayEntry>, today: string): number {
  let day = (entries[today]?.km ?? 0) > 0 ? today : addDays(today, -1);
  let streak = 0;
  while ((entries[day]?.km ?? 0) > 0) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

export function averageKmPerDay(entries: Record<string, DayEntry>, today: string, windowDays = 28): number {
  let sum = 0;
  for (let i = 0; i < windowDays; i++) sum += entries[addDays(today, -i)]?.km ?? 0;
  return windowDays > 0 ? sum / windowDays : 0;
}

export function forecastArrival(entries: Record<string, DayEntry>, progress: ProgressSummary, today: string): string | null {
  if (progress.finished) return today;
  const avg = averageKmPerDay(entries, today);
  if (avg <= 0) return null;
  const days = Math.ceil(progress.remainingKm / avg);
  return addDays(today, days);
}
