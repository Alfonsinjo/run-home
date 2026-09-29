import { describe, expect, it } from 'vitest';
import { compareSemver } from './semver';

describe('compareSemver', () => {
  it('orders numerically per segment', () => {
    expect(compareSemver('1.0.0', '1.0.1')).toBeLessThan(0);
    expect(compareSemver('1.2.0', '1.10.0')).toBeLessThan(0);
    expect(compareSemver('2.0.0', '1.99.99')).toBeGreaterThan(0);
    expect(compareSemver('1.0.0', '1.0.0')).toBe(0);
    expect(compareSemver('v1.0.1', '1.0.0')).toBeGreaterThan(0);
    expect(compareSemver('1.0', '1.0.0')).toBe(0);
  });
});
