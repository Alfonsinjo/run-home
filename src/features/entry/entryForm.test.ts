import { describe, expect, it } from 'vitest';
import { parseKmInput, validateEntryForm } from './entryForm';

describe('parseKmInput', () => {
  it('accepts comma and dot, rejects junk', () => {
    expect(parseKmInput('2,5')).toBe(2.5);
    expect(parseKmInput('2.25')).toBe(2.25);
    expect(parseKmInput(' 3 ')).toBe(3);
    expect(parseKmInput('')).toBeNull();
    expect(parseKmInput('abc')).toBeNull();
  });
});

describe('validateEntryForm', () => {
  const today = '2026-09-29';
  it('returns value for valid input', () => {
    expect(validateEntryForm({ date: '2026-09-29', km: '2,3' }, today)).toEqual({ errors: {}, value: { date: '2026-09-29', km: 2.3 } });
  });
  it('rejects future dates, invalid dates, negative and huge km', () => {
    expect(validateEntryForm({ date: '2026-09-30', km: '1' }, today).errors.date).toMatch(/Zukunft/);
    expect(validateEntryForm({ date: '', km: '1' }, today).errors.date).toBeDefined();
    expect(validateEntryForm({ date: '2026-09-29', km: '-1' }, today).errors.km).toBeDefined();
    expect(validateEntryForm({ date: '2026-09-29', km: '250' }, today).errors.km).toMatch(/200/);
    expect(validateEntryForm({ date: '2026-09-29', km: '' }, today).value).toBeNull();
  });
  it('allows 0 km (Ruhetag)', () => {
    expect(validateEntryForm({ date: '2026-09-29', km: '0' }, today).value).toEqual({ date: '2026-09-29', km: 0 });
  });
});
