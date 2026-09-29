export type DayEntry = { date: string; km: number; note?: string };

export type Place = { label: string; lat: number; lon: number };

export type Milestone = {
  id: string;
  kind: 'auto' | 'manual';
  km: number;
  title: string;
  description?: string;
};

export type FunFact = {
  id: string;
  km: number;
  title: string;
  text: string;
  source: string;
};

export type DailyGoalMode = 'catchup' | 'plan' | 'custom';

export type Settings = {
  home: Place | null;
  parents: Place | null;
  targetKm: number;
  startDate: string;
  deadline: string;
  dailyGoalMode: DailyGoalMode;
  customDailyKm: number;
  reminderEnabled: boolean;
  reminderTime: string;
  secondReminderEnabled: boolean;
  secondReminderTime: string;
  manualMilestones: Milestone[];
  routeMode: 'osrm' | 'straight';
};

export type LatLon = [number, number];

export type RouteData = { coords: LatLon[]; lengthKm: number; fetchedAt: string } | null;

export type AppState = {
  schemaVersion: number;
  setupDone: boolean;
  entries: Record<string, DayEntry>;
  settings: Settings;
  route: RouteData;
  achieved: Record<string, string>;
};

export const SCHEMA_VERSION = 1;

export const DEFAULT_SETTINGS: Settings = {
  home: null,
  parents: null,
  targetKm: 510,
  startDate: '2026-01-01',
  deadline: '2026-12-31',
  dailyGoalMode: 'catchup',
  customDailyKm: 2,
  reminderEnabled: true,
  reminderTime: '19:00',
  secondReminderEnabled: false,
  secondReminderTime: '21:00',
  manualMilestones: [],
  routeMode: 'osrm',
};

export function createInitialState(): AppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    setupDone: false,
    entries: {},
    settings: { ...DEFAULT_SETTINGS, manualMilestones: [] },
    route: null,
    achieved: {},
  };
}
