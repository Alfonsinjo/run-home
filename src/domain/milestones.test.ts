import { describe, expect, it } from 'vitest';
import { allMilestones, autoMilestones, newlyReached, nextMilestone } from './milestones';

describe('autoMilestones', () => {
  it('creates 50km steps and percent marks for 510 km', () => {
    const ms = autoMilestones(510);
    const kms = ms.map((m) => m.km);
    expect(kms).toContain(50);
    expect(kms).toContain(500);
    expect(kms).not.toContain(550);
    expect(kms).toContain(51); // 10 %
    expect(kms).toContain(127.5); // 25 %
    expect(kms).toContain(255); // 50 %
    expect(kms).toContain(382.5); // 75 %
    expect(kms).toContain(459); // 90 %
    expect(kms).toContain(510); // 100 %
    expect(ms.find((m) => m.km === 255)?.title).toBe('Halbzeit');
    expect(ms.find((m) => m.km === 510)?.title).toBe('Angekommen!');
    expect(new Set(ms.map((m) => m.id)).size).toBe(ms.length);
  });
  it('does not duplicate a 50km step that equals a percent mark', () => {
    const ms = autoMilestones(500); // 50 % = 250 (kein 50er-Schritt), 100 % = 500 = 50er-Schritt
    expect(ms.filter((m) => m.km === 500)).toHaveLength(1);
  });
});

describe('allMilestones / nextMilestone', () => {
  const manual = [{ id: 'manual-1', kind: 'manual' as const, km: 120, title: 'Würzburg' }];
  it('merges manual milestones and sorts by km', () => {
    const ms = allMilestones({ targetKm: 510, manualMilestones: manual });
    const kms = ms.map((m) => m.km);
    expect(kms).toEqual([...kms].sort((a, b) => a - b));
    expect(ms.some((m) => m.id === 'manual-1')).toBe(true);
  });
  it('nextMilestone is the first with km > total', () => {
    const ms = allMilestones({ targetKm: 510, manualMilestones: manual });
    expect(nextMilestone(ms, 100)?.km).toBe(120);
    expect(nextMilestone(ms, 120)?.km).toBe(127.5);
    expect(nextMilestone(ms, 510)).toBeNull();
  });
});

describe('newlyReached', () => {
  it('returns items with km <= total that are not yet achieved, ascending', () => {
    const items = [{ id: 'b', km: 20 }, { id: 'a', km: 10 }, { id: 'c', km: 30 }];
    expect(newlyReached(items, 25, { a: '2026-01-01' }).map((i) => i.id)).toEqual(['b']);
    expect(newlyReached(items, 35, {}).map((i) => i.id)).toEqual(['a', 'b', 'c']);
    expect(newlyReached(items, 5, {})).toEqual([]);
  });
});
