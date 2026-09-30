import { beforeEach, describe, expect, it, vi } from 'vitest';

const saved: unknown[] = [];
vi.mock('@/services/storage', () => ({
  loadState: vi.fn(async () => null),
  saveState: vi.fn(async (s: unknown) => { saved.push(s); }),
  clearState: vi.fn(async () => {}),
}));

import { loadState } from '@/services/storage';
import { pickAppState, useAppStore } from './useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    saved.length = 0;
    useAppStore.getState().resetAll();
    useAppStore.setState({ hydrated: true });
  });

  it('saveEntry stores the entry, marks achievements and returns celebrations in km order', () => {
    const c1 = useAppStore.getState().saveEntry({ date: '2026-01-01', km: 30 }, '2026-01-01');
    const ids1 = c1.map((c) => c.item.id);
    expect(ids1).toContain('ff-halfmarathon'); // 21.1 km
    expect(ids1).not.toContain('ff-marathon'); // 42.2 km
    const c2 = useAppStore.getState().saveEntry({ date: '2026-01-02', km: 25 }, '2026-01-02'); // total 55
    const ids = c2.map((c) => c.item.id);
    expect(ids).toContain('auto-50km');
    expect(ids).toContain('auto-pct-10'); // 51 km
    expect(ids).toContain('ff-marathon'); // 42.2 km
    expect(ids).not.toContain('ff-halfmarathon'); // schon gefeiert
    expect(ids.indexOf('ff-marathon')).toBeLessThan(ids.indexOf('auto-50km'));
    expect(useAppStore.getState().achieved['auto-50km']).toBe('2026-01-02');
    expect(useAppStore.getState().celebrations.length).toBe(c1.length + c2.length);
    useAppStore.getState().shiftCelebration();
    expect(useAppStore.getState().celebrations.length).toBe(c1.length + c2.length - 1);
  });

  it('editing an entry downwards removes achievements that are no longer reached', () => {
    useAppStore.getState().saveEntry({ date: '2026-01-01', km: 60 }, '2026-01-01');
    expect(useAppStore.getState().achieved['auto-50km']).toBeDefined();
    useAppStore.getState().saveEntry({ date: '2026-01-01', km: 10 }, '2026-01-01');
    expect(useAppStore.getState().achieved['auto-50km']).toBeUndefined();
  });

  it('deleteEntry removes the day', () => {
    useAppStore.getState().saveEntry({ date: '2026-01-01', km: 3 });
    useAppStore.getState().deleteEntry('2026-01-01');
    expect(useAppStore.getState().entries['2026-01-01']).toBeUndefined();
  });

  it('importEntries merge/replace recomputes achievements silently with historical dates', () => {
    useAppStore.getState().saveEntry({ date: '2026-03-01', km: 1 });
    useAppStore.getState().importEntries([{ date: '2026-01-01', km: 45 }, { date: '2026-01-02', km: 10 }], 'merge');
    const s = useAppStore.getState();
    expect(Object.keys(s.entries).sort()).toEqual(['2026-01-01', '2026-01-02', '2026-03-01']);
    expect(s.achieved['ff-marathon']).toBe('2026-01-01');
    expect(s.achieved['auto-50km']).toBe('2026-01-02');
    expect(s.celebrations).toEqual([]);
    useAppStore.getState().importEntries([{ date: '2026-05-05', km: 2 }], 'replace');
    expect(Object.keys(useAppStore.getState().entries)).toEqual(['2026-05-05']);
    expect(useAppStore.getState().achieved).toEqual({ 'ff-mile': '2026-05-05' }); // 1,6 km ist die einzige erreichte Schwelle
  });

  it('updateSettings merges and completeSetup flips the flag; state is persisted', async () => {
    useAppStore.getState().updateSettings({ targetKm: 600 });
    useAppStore.getState().completeSetup();
    const s = useAppStore.getState();
    expect(s.settings.targetKm).toBe(600);
    expect(s.setupDone).toBe(true);
    await new Promise((r) => setTimeout(r, 250));
    expect(saved.length).toBeGreaterThan(0);
    expect((saved[saved.length - 1] as { settings: { targetKm: number } }).settings.targetKm).toBe(600);
  });

  it('refreshToday() updates the non-persisted today field', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date(2026, 8, 29, 23, 59));
      useAppStore.getState().refreshToday();
      expect(useAppStore.getState().today).toBe('2026-09-29');
      vi.setSystemTime(new Date(2026, 8, 30, 0, 0, 5));
      useAppStore.getState().refreshToday();
      expect(useAppStore.getState().today).toBe('2026-09-30');
    } finally {
      vi.useRealTimers();
    }
  });

  it('pickAppState contains only persisted fields', () => {
    expect(Object.keys(pickAppState(useAppStore.getState())).sort()).toEqual(['achieved', 'entries', 'route', 'schemaVersion', 'settings', 'setupDone']);
  });

  it('hydrate() does not persist the initial hydrate transition, but later changes are persisted', async () => {
    // beforeEach's resetAll() may have scheduled a debounced save while hydrated was still true
    // from the previous test; drain it before asserting so it can't be mistaken for a hydrate-triggered save.
    await new Promise((r) => setTimeout(r, 200));
    saved.length = 0;
    useAppStore.setState({ hydrated: false });
    vi.mocked(loadState).mockResolvedValueOnce(null);
    await useAppStore.getState().hydrate();
    expect(useAppStore.getState().hydrated).toBe(true);
    await new Promise((r) => setTimeout(r, 250));
    expect(saved.length).toBe(0);
    useAppStore.getState().saveEntry({ date: '2026-01-01', km: 3 }, '2026-01-01');
    await new Promise((r) => setTimeout(r, 250));
    expect(saved.length).toBeGreaterThan(0);
  });
});
