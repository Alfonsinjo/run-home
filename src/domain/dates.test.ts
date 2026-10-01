import { describe, expect, it } from 'vitest';
import {
  addDays,
  daysBetweenInclusive,
  formatDateDe,
  isValidDateKey,
  parseDateDe,
  parseDateKey,
  parseTimeDe,
  startOfWeek,
  toDateKey,
  todayKey,
} from './dates';

describe('parseDateDe', () => {
  it('accepts German and ISO formats', () => {
    expect(parseDateDe('28.09.2026')).toBe('2026-09-28');
    expect(parseDateDe('1.1.26')).toBe('2026-01-01');
    expect(parseDateDe(' 05/03/2026 ')).toBe('2026-03-05');
    expect(parseDateDe('2026-09-28')).toBe('2026-09-28');
  });
  it('rejects impossible or malformed dates', () => {
    expect(parseDateDe('31.02.2026')).toBeNull();
    expect(parseDateDe('2026')).toBeNull();
    expect(parseDateDe('')).toBeNull();
    expect(parseDateDe('28.09.202')).toBeNull();
  });
});

describe('parseTimeDe', () => {
  it('normalises 24h times', () => {
    expect(parseTimeDe('19:00')).toBe('19:00');
    expect(parseTimeDe('7:05')).toBe('07:05');
    expect(parseTimeDe('7')).toBe('07:00');
    expect(parseTimeDe('19.30')).toBe('19:30');
    expect(parseTimeDe('1930')).toBe('19:30');
  });
  it('rejects out-of-range or malformed input', () => {
    expect(parseTimeDe('7:5')).toBeNull();
    expect(parseTimeDe('24:00')).toBeNull();
    expect(parseTimeDe('19:60')).toBeNull();
    expect(parseTimeDe('abc')).toBeNull();
    expect(parseTimeDe('')).toBeNull();
  });
});

describe('dates', () => {
  it('toDateKey uses local date parts', () => {
    expect(toDateKey(new Date(2026, 8, 28, 23, 30))).toBe('2026-09-28');
    expect(toDateKey(new Date(2026, 0, 1, 0, 0))).toBe('2026-01-01');
  });

  it('parseDateKey roundtrips', () => {
    const d = parseDateKey('2026-02-03');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(1);
    expect(d.getDate()).toBe(3);
    expect(toDateKey(d)).toBe('2026-02-03');
  });

  it('addDays crosses month and year boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('daysBetweenInclusive counts both ends', () => {
    expect(daysBetweenInclusive('2026-01-01', '2026-01-01')).toBe(1);
    expect(daysBetweenInclusive('2026-01-01', '2026-12-31')).toBe(365);
    expect(daysBetweenInclusive('2026-01-01', '2026-09-28')).toBe(271);
    expect(daysBetweenInclusive('2026-09-29', '2026-12-31')).toBe(94);
    expect(daysBetweenInclusive('2026-02-01', '2026-01-01')).toBe(0);
  });

  it('startOfWeek returns the Monday', () => {
    expect(startOfWeek('2026-09-29')).toBe('2026-09-28'); // Tuesday -> Monday
    expect(startOfWeek('2026-09-28')).toBe('2026-09-28'); // Monday
    expect(startOfWeek('2026-10-04')).toBe('2026-09-28'); // Sunday
  });

  it('todayKey uses the provided clock', () => {
    expect(todayKey(new Date(2026, 8, 29, 8))).toBe('2026-09-29');
  });

  it('formatDateDe renders dd.mm.yyyy', () => {
    expect(formatDateDe('2026-09-05')).toBe('05.09.2026');
  });

  it('isValidDateKey rejects malformed and impossible dates', () => {
    expect(isValidDateKey('2026-09-29')).toBe(true);
    expect(isValidDateKey('2026-13-01')).toBe(false);
    expect(isValidDateKey('2026-02-30')).toBe(false);
    expect(isValidDateKey('29.09.2026')).toBe(false);
  });
});
