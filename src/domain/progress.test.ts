import { describe, expect, it } from 'vitest';
import { computeProgress, formatKm, round1 } from './progress';
import type { DayEntry } from './types';

const settings = { targetKm: 510, startDate: '2026-01-01', deadline: '2026-12-31' };

function entries(list: Array<[string, number]>): Record<string, DayEntry> {
  return Object.fromEntries(list.map(([date, km]) => [date, { date, km }]));
}

describe('computeProgress', () => {
  it('sums entries within the goal period and computes remaining and percent', () => {
    const p = computeProgress(entries([['2026-01-01', 1.5], ['2026-01-02', 2], ['2025-12-31', 99]]), settings, '2026-01-02');
    expect(p.totalKm).toBe(3.5);
    expect(p.remainingKm).toBe(506.5);
    expect(p.percent).toBeCloseTo(3.5 / 510, 6);
    expect(p.finished).toBe(false);
  });

  it('computes day counts like the Excel sheet', () => {
    const p = computeProgress({}, settings, '2026-09-28');
    expect(p.daysTotal).toBe(365);
    expect(p.daysElapsed).toBe(271);
    expect(p.daysRemaining).toBe(94); // 29.09. bis 31.12. inklusive
  });

  it('computes plan-soll and plus/minus like the Excel sheet (28.09.2026)', () => {
    const p = computeProgress(entries([['2026-01-01', 341.7]]), settings, '2026-09-28');
    expect(p.planSollKm).toBeCloseTo(378.657534, 4);
    expect(p.plusMinusKm).toBeCloseTo(-36.957534, 4);
  });

  it('clamps before start and after deadline', () => {
    const before = computeProgress({}, settings, '2025-12-01');
    expect(before.daysElapsed).toBe(0);
    expect(before.daysRemaining).toBe(365);
    const after = computeProgress(entries([['2026-06-01', 600]]), settings, '2027-01-15');
    expect(after.daysElapsed).toBe(365);
    expect(after.daysRemaining).toBe(0);
    expect(after.remainingKm).toBe(0);
    expect(after.finished).toBe(true);
  });
});

describe('formatting', () => {
  it('round1 rounds to one decimal', () => {
    expect(round1(1.25)).toBe(1.3);
    expect(round1(341.70000001)).toBe(341.7);
  });
  it('formatKm uses German decimal comma', () => {
    expect(formatKm(341.7)).toBe('341,7 km');
    expect(formatKm(5)).toBe('5,0 km');
    expect(formatKm(1.397, 2)).toBe('1,40 km');
  });
});
