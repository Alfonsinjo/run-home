import { describe, expect, it } from 'vitest';
import seed from '../data/seed-2026.json';
import type { DayEntry } from './types';

const entries = seed as DayEntry[];

describe('seed-2026', () => {
  it('matches the Excel sheet "2026" as of 28.09.2026', () => {
    expect(entries.length).toBe(271);
    expect(entries[0].date).toBe('2026-01-01');
    expect(entries[entries.length - 1].date).toBe('2026-09-28');
    const sum = Math.round(entries.reduce((s, e) => s + e.km, 0) * 10) / 10;
    expect(sum).toBe(341.7);
    expect(entries.filter((e) => e.km === 0)).toHaveLength(149);
    for (const e of entries) expect(e.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
