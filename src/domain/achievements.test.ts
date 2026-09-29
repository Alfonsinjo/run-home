import { describe, expect, it } from 'vitest';
import { achievedDates } from './achievements';

describe('achievedDates', () => {
  it('assigns the date on which the cumulative sum first reaches each threshold', () => {
    const entries = {
      '2026-01-01': { date: '2026-01-01', km: 4 },
      '2026-01-02': { date: '2026-01-02', km: 0 },
      '2026-01-03': { date: '2026-01-03', km: 6 },
      '2026-01-04': { date: '2026-01-04', km: 1 },
    };
    const items = [{ id: 'a', km: 4 }, { id: 'b', km: 10 }, { id: 'c', km: 12 }];
    expect(achievedDates(entries, items, '2026-01-01')).toEqual({ a: '2026-01-01', b: '2026-01-03' });
  });
  it('ignores entries before startDate', () => {
    const entries = { '2025-12-31': { date: '2025-12-31', km: 50 }, '2026-01-01': { date: '2026-01-01', km: 1 } };
    expect(achievedDates(entries, [{ id: 'x', km: 10 }], '2026-01-01')).toEqual({});
  });
});
