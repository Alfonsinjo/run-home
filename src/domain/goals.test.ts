import { describe, expect, it } from 'vitest';
import { averageKmPerDay, computeStreak, computeWeek, dailyGoalKm, forecastArrival } from './goals';
import { computeProgress } from './progress';
import type { DayEntry } from './types';

const base = { targetKm: 510, startDate: '2026-01-01', deadline: '2026-12-31' };
function entries(list: Array<[string, number]>): Record<string, DayEntry> {
  return Object.fromEntries(list.map(([date, km]) => [date, { date, km }]));
}

describe('dailyGoalKm', () => {
  const progress = computeProgress(entries([['2026-01-01', 341.7]]), base, '2026-09-28');
  it('catchup = remaining / remaining days, rounded to 0.1', () => {
    // 168.3 / 94 = 1.7904 -> 1.8
    expect(dailyGoalKm({ dailyGoalMode: 'catchup', customDailyKm: 2, targetKm: 510 }, progress)).toBe(1.8);
  });
  it('plan = target / total days', () => {
    expect(dailyGoalKm({ dailyGoalMode: 'plan', customDailyKm: 2, targetKm: 510 }, progress)).toBe(1.4);
  });
  it('custom = custom value', () => {
    expect(dailyGoalKm({ dailyGoalMode: 'custom', customDailyKm: 2.5, targetKm: 510 }, progress)).toBe(2.5);
  });
  it('catchup is 0 when finished or no days left', () => {
    const done = computeProgress(entries([['2026-01-01', 510]]), base, '2026-09-28');
    expect(dailyGoalKm({ dailyGoalMode: 'catchup', customDailyKm: 2, targetKm: 510 }, done)).toBe(0);
    const late = computeProgress(entries([['2026-01-01', 100]]), base, '2027-01-01');
    expect(dailyGoalKm({ dailyGoalMode: 'catchup', customDailyKm: 2, targetKm: 510 }, late)).toBe(0);
    expect(late.pastDeadline).toBe(true);
  });
  it('catchup on the deadline day is the whole remaining distance', () => {
    const last = computeProgress(entries([['2026-01-01', 500]]), base, '2026-12-31');
    expect(last.daysRemaining).toBe(0);
    expect(last.pastDeadline).toBe(false);
    expect(dailyGoalKm({ dailyGoalMode: 'catchup', customDailyKm: 2, targetKm: 510 }, last)).toBe(10);
  });
});

describe('computeWeek', () => {
  it('builds Monday..Sunday with statuses', () => {
    const e = entries([['2026-09-28', 2], ['2026-09-29', 1]]);
    const w = computeWeek(e, 1.8, '2026-09-30'); // Wednesday
    expect(w.weekStart).toBe('2026-09-28');
    expect(w.weekGoalKm).toBeCloseTo(12.6, 6);
    expect(w.weekKm).toBe(3);
    expect(w.days.map((d) => d.status)).toEqual(['done', 'partial', 'today', 'future', 'future', 'future', 'future']);
    expect(w.days[0].date).toBe('2026-09-28');
    expect(w.days[6].date).toBe('2026-10-04');
  });
  it('marks past days without km as missed and today with km as done', () => {
    const e = entries([['2026-09-30', 2]]);
    const w = computeWeek(e, 1.8, '2026-09-30');
    expect(w.days[0].status).toBe('missed');
    expect(w.days[2].status).toBe('done');
  });
});

describe('computeStreak', () => {
  it('counts consecutive days with km > 0 ending yesterday or today', () => {
    const e = entries([['2026-09-26', 1], ['2026-09-27', 2], ['2026-09-28', 2]]);
    expect(computeStreak(e, '2026-09-28')).toBe(3);
    expect(computeStreak(e, '2026-09-29')).toBe(3); // today not yet entered, streak survives
    expect(computeStreak(e, '2026-09-30')).toBe(0); // yesterday missed
  });
  it('ignores zero entries', () => {
    const e = entries([['2026-09-27', 0], ['2026-09-28', 2]]);
    expect(computeStreak(e, '2026-09-28')).toBe(1);
  });
});

describe('averageKmPerDay / forecastArrival', () => {
  it('averages over the window including zero days', () => {
    const e = entries([['2026-09-27', 2], ['2026-09-28', 2]]);
    expect(averageKmPerDay(e, '2026-09-28', 4)).toBe(1); // (0+0+2+2)/4
  });
  it('forecasts arrival date from the average', () => {
    const e = entries([['2026-09-01', 300], ['2026-09-27', 2], ['2026-09-28', 2]]);
    const p = computeProgress(e, base, '2026-09-28'); // 304 km, remaining 206
    // avg over 28 days = 304/28 = 10.857 -> ceil(206/10.857)=19 days -> 17.10.2026
    expect(forecastArrival(e, p, '2026-09-28')).toBe('2026-10-17');
  });
  it('returns null when average is zero and the date when finished', () => {
    expect(forecastArrival({}, computeProgress({}, base, '2026-09-28'), '2026-09-28')).toBeNull();
    const done = entries([['2026-09-01', 510]]);
    expect(forecastArrival(done, computeProgress(done, base, '2026-09-28'), '2026-09-28')).toBe('2026-09-28');
  });
});
