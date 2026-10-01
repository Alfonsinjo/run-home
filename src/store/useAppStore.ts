import { create } from 'zustand';
import { achievedDates, type Achievable } from '@/domain/achievements';
import { todayKey } from '@/domain/dates';
import { FUN_FACTS } from '@/domain/funfacts';
import { allMilestones } from '@/domain/milestones';
import { computeProgress } from '@/domain/progress';
import { mergeEntries, replaceEntries } from '@/domain/importer';
import { createInitialState, normalizeState, type AppState, type DayEntry, type FunFact, type Milestone, type RouteData, type Settings } from '@/domain/types';
import { loadState, saveState } from '@/services/storage';

export type Celebration = { kind: 'milestone'; item: Milestone } | { kind: 'funfact'; item: FunFact };

export type StoreState = AppState & {
  hydrated: boolean;
  celebrations: Celebration[];
  /** Aktuelles lokales Datum (YYYY-MM-DD); nicht persistiert, wird bei Resume/Mitternacht aufgefrischt. */
  today: string;
  refreshToday(): void;
  hydrate(): Promise<void>;
  saveEntry(entry: DayEntry, today?: string): Celebration[];
  deleteEntry(date: string): void;
  updateSettings(patch: Partial<Settings>): void;
  setRoute(route: RouteData): void;
  completeSetup(): void;
  importEntries(entries: DayEntry[], mode: 'merge' | 'replace'): void;
  importState(state: AppState): void;
  resetAll(): void;
  shiftCelebration(): void;
};

export function pickAppState(s: StoreState): AppState {
  return { schemaVersion: s.schemaVersion, setupDone: s.setupDone, entries: s.entries, settings: s.settings, route: s.route, achieved: s.achieved };
}

function achievables(settings: Settings, route: RouteData): Array<Achievable & { celebration: Celebration }> {
  return [
    ...allMilestones(settings, route).map((m) => ({ id: m.id, km: m.km, celebration: { kind: 'milestone', item: m } as Celebration })),
    ...FUN_FACTS.map((f) => ({ id: f.id, km: f.km, celebration: { kind: 'funfact', item: f } as Celebration })),
  ];
}

/** Recomputes `achieved` from history; returns celebrations for ids that are new compared to `before`. */
function recomputeAchieved(entries: Record<string, DayEntry>, settings: Settings, route: RouteData, before: Record<string, string>) {
  const items = achievables(settings, route);
  const achieved = achievedDates(entries, items, settings.startDate);
  const celebrations = items
    .filter((i) => i.id in achieved && !(i.id in before))
    .sort((a, b) => a.km - b.km)
    .map((i) => i.celebration);
  return { achieved, celebrations };
}

export const useAppStore = create<StoreState>()((set, get) => ({
  ...createInitialState(),
  hydrated: false,
  celebrations: [],
  today: todayKey(),

  refreshToday() {
    const today = todayKey();
    if (today !== get().today) set({ today });
  },

  async hydrate() {
    const loaded = await loadState();
    set({ ...(loaded ? normalizeState(loaded) : createInitialState()), hydrated: true });
  },

  saveEntry(entry, today = get().today) {
    const km = Math.round(entry.km * 100) / 100;
    const clean: DayEntry = entry.note?.trim() ? { date: entry.date, km, note: entry.note.trim() } : { date: entry.date, km };
    const entries = { ...get().entries, [entry.date]: clean };
    const { achieved, celebrations } = recomputeAchieved(entries, get().settings, get().route, get().achieved);
    void today; // Datum des Erreichens stammt aus der Historie (achievedDates); `today` bleibt für spätere Nutzung in der Signatur
    set({ entries, achieved, celebrations: [...get().celebrations, ...celebrations] });
    return celebrations;
  },

  deleteEntry(date) {
    const entries = { ...get().entries };
    delete entries[date];
    const { achieved } = recomputeAchieved(entries, get().settings, get().route, get().achieved);
    set({ entries, achieved });
  },

  updateSettings(patch) {
    const settings = { ...get().settings, ...patch };
    const { achieved } = recomputeAchieved(get().entries, settings, get().route, get().achieved);
    set({ settings, achieved });
  },

  setRoute(route) {
    const { achieved } = recomputeAchieved(get().entries, get().settings, route, get().achieved);
    set({ route, achieved });
  },

  completeSetup() {
    set({ setupDone: true });
  },

  importEntries(incoming, mode) {
    const entries = mode === 'replace' ? replaceEntries(incoming) : mergeEntries(get().entries, incoming);
    const { achieved } = recomputeAchieved(entries, get().settings, get().route, {});
    set({ entries, achieved, celebrations: [] });
  },

  importState(state) {
    const { achieved } = recomputeAchieved(state.entries, state.settings, state.route, {});
    set({ ...normalizeState(state), achieved, celebrations: [] });
  },

  resetAll() {
    set({ ...createInitialState(), celebrations: [] });
  },

  shiftCelebration() {
    set({ celebrations: get().celebrations.slice(1) });
  },
}));

// Persistenz: jede Änderung der AppState-Felder wird entprellt gespeichert.
let timer: ReturnType<typeof setTimeout> | null = null;
useAppStore.subscribe((state, prev) => {
  if (!state.hydrated || !prev.hydrated) return;
  const a = pickAppState(state), b = pickAppState(prev);
  if (a.entries === b.entries && a.settings === b.settings && a.route === b.route && a.achieved === b.achieved && a.setupDone === b.setupDone) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void saveState(pickAppState(useAppStore.getState())), 150);
});

export { computeProgress };
