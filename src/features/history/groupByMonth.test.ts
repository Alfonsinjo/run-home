import { describe, expect, it } from 'vitest';
import { groupByMonth } from './groupByMonth';

describe('groupByMonth', () => {
  it('groups descending by month and day with sums and German labels', () => {
    const g = groupByMonth({
      '2026-08-30': { date: '2026-08-30', km: 1 },
      '2026-09-01': { date: '2026-09-01', km: 2 },
      '2026-09-15': { date: '2026-09-15', km: 3.5 },
    });
    expect(g.map((m) => m.month)).toEqual(['2026-09', '2026-08']);
    expect(g[0].label).toBe('September 2026');
    expect(g[0].totalKm).toBe(5.5);
    expect(g[0].days.map((d) => d.date)).toEqual(['2026-09-15', '2026-09-01']);
  });
});
