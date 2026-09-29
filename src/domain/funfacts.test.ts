import { describe, expect, it } from 'vitest';
import { FUN_FACTS, latestFact, nextFact } from './funfacts';

describe('FUN_FACTS data', () => {
  it('has at least 25 facts, unique ids, sources and ascending km', () => {
    expect(FUN_FACTS.length).toBeGreaterThanOrEqual(25);
    expect(new Set(FUN_FACTS.map((f) => f.id)).size).toBe(FUN_FACTS.length);
    for (const f of FUN_FACTS) {
      expect(f.source).toMatch(/^https?:\/\//);
      expect(f.text.length).toBeGreaterThan(10);
      expect(f.km).toBeGreaterThan(0);
    }
    for (let i = 1; i < FUN_FACTS.length; i++) expect(FUN_FACTS[i].km).toBeGreaterThan(FUN_FACTS[i - 1].km);
  });
});

describe('latestFact / nextFact', () => {
  it('returns the highest reached and the next unreached fact', () => {
    expect(latestFact(0)).toBeNull();
    expect(latestFact(42.2)?.id).toBe('ff-marathon');
    expect(latestFact(45)?.id).toBe('ff-marathon');
    expect(nextFact(45)?.id).toBe('ff-eurotunnel');
    expect(nextFact(10_000)).toBeNull();
  });
});
