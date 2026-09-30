import { formatDateDe, isValidDateKey } from './dates';
import { createInitialState, DEFAULT_SETTINGS, SCHEMA_VERSION, type AppState, type DayEntry } from './types';

export const MAX_KM_PER_DAY = 200;

export type ImportPreview = { count: number; from: string; to: string; totalKm: number };

function normalizeDate(raw: string): string | null {
  const s = raw.trim();
  const de = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  const key = de ? `${de[3]}-${de[2].padStart(2, '0')}-${de[1].padStart(2, '0')}` : s;
  return isValidDateKey(key) ? key : null;
}

function normalizeKm(raw: string | number): number | null {
  const n = typeof raw === 'number' ? raw : Number(String(raw).trim().replace(',', '.'));
  if (!Number.isFinite(n) || n < 0 || n > MAX_KM_PER_DAY) return null;
  return Math.round(n * 100) / 100;
}

function validateEntry(e: unknown, where: string): DayEntry {
  if (!e || typeof e !== 'object') throw new Error(`${where}: kein Eintrag`);
  const { date, km, note } = e as { date?: unknown; km?: unknown; note?: unknown };
  const d = typeof date === 'string' ? normalizeDate(date) : null;
  if (!d) throw new Error(`${where}: ungültiges Datum`);
  const k = typeof km === 'number' || typeof km === 'string' ? normalizeKm(km) : null;
  if (k === null) throw new Error(`${where}: ungültige km (0 bis ${MAX_KM_PER_DAY})`);
  const entry: DayEntry = { date: d, km: k };
  if (typeof note === 'string' && note.trim()) entry.note = note.trim();
  return entry;
}

export function parseCsv(text: string): DayEntry[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const entries: DayEntry[] = [];
  lines.forEach((line, i) => {
    const sep = line.includes(';') ? ';' : ',';
    const cells = line.split(sep).map((c) => c.trim());
    if (i === 0 && /^datum/i.test(cells[0])) return;
    const where = `Zeile ${i + 1}`;
    if (cells.length < 2) throw new Error(`${where}: erwartet "Datum;km"`);
    entries.push(validateEntry({ date: cells[0], km: cells[1], note: cells[2] }, where));
  });
  if (entries.length === 0) throw new Error('Die Datei enthält keine Einträge.');
  return entries;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Die Datei ist kein gültiges JSON.');
  }
}

export function parseEntriesJson(text: string): DayEntry[] {
  const data = parseJson(text);
  const list = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && 'entries' in data
      ? Object.values((data as { entries: Record<string, unknown> }).entries)
      : null;
  if (!list) throw new Error('Erwartet eine Liste von Einträgen oder eine Export-Datei.');
  return list.map((e, i) => validateEntry(e, `Eintrag ${i + 1}`));
}

export function parseExportJson(text: string): AppState {
  const data = parseJson(text) as Partial<AppState> | null;
  if (!data || typeof data !== 'object' || typeof data.schemaVersion !== 'number' || !data.entries || typeof data.entries !== 'object') {
    throw new Error('Das ist keine Run-Home-Export-Datei.');
  }
  const base = createInitialState();
  const entries: Record<string, DayEntry> = {};
  for (const [key, value] of Object.entries(data.entries)) {
    const e = validateEntry(value, `Eintrag ${key}`);
    entries[e.date] = e;
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    setupDone: data.setupDone === true,
    entries,
    settings: { ...DEFAULT_SETTINGS, ...(data.settings ?? {}), manualMilestones: [...(data.settings?.manualMilestones ?? [])] },
    route: data.route ?? base.route,
    achieved: { ...(data.achieved ?? {}) },
  };
}

export function previewEntries(entries: DayEntry[]): ImportPreview {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  return {
    count: sorted.length,
    from: sorted[0]?.date ?? '',
    to: sorted[sorted.length - 1]?.date ?? '',
    totalKm: Math.round(sorted.reduce((s, e) => s + e.km, 0) * 10) / 10,
  };
}

export function mergeEntries(existing: Record<string, DayEntry>, incoming: DayEntry[]): Record<string, DayEntry> {
  const result = { ...existing };
  for (const e of incoming) result[e.date] = { ...e };
  return result;
}

export function replaceEntries(incoming: DayEntry[]): Record<string, DayEntry> {
  return mergeEntries({}, incoming);
}

export function toCsv(entries: Record<string, DayEntry>): string {
  const rows = Object.values(entries)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => `${formatDateDe(e.date)};${e.km.toFixed(2).replace('.', ',')};${(e.note ?? '').replace(/[;\n]/g, ' ')}`);
  return `Datum;km;Notiz\n${rows.join('\n')}\n`;
}

export function toExportJson(state: AppState): string {
  return JSON.stringify(state, null, 2);
}
