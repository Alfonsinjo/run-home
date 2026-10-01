const pad = (n: number) => String(n).padStart(2, '0');

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function isValidDateKey(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const d = parseDateKey(key);
  return !Number.isNaN(d.getTime()) && toDateKey(d) === key;
}

export function addDays(key: string, n: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + n);
  return toDateKey(d);
}

export function daysBetweenInclusive(from: string, to: string): number {
  const a = Date.UTC(...ymd(from));
  const b = Date.UTC(...ymd(to));
  if (b < a) return 0;
  return Math.round((b - a) / 86_400_000) + 1;
}

function ymd(key: string): [number, number, number] {
  const [y, m, d] = key.split('-').map(Number);
  return [y, m - 1, d];
}

export function startOfWeek(key: string): string {
  const d = parseDateKey(key);
  const weekday = (d.getDay() + 6) % 7; // Monday = 0
  return addDays(key, -weekday);
}

export function todayKey(now: Date = new Date()): string {
  return toDateKey(now);
}

export function formatDateDe(key: string): string {
  const [y, m, d] = key.split('-');
  return `${d}.${m}.${y}`;
}

/** Parst deutsche Datumseingaben (TT.MM.JJJJ, auch T.M.JJ oder ISO) zu YYYY-MM-DD; null wenn ungültig. */
export function parseDateDe(text: string): string | null {
  const s = text.trim();
  if (isValidDateKey(s)) return s;
  const m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2}|\d{4})$/);
  if (!m) return null;
  const year = m[3].length === 2 ? `20${m[3]}` : m[3];
  const key = `${year}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return isValidDateKey(key) ? key : null;
}

/** Parst Uhrzeiten (H:MM, HH:MM, HH.MM, HHMM, 24 h) zu HH:MM; null wenn ungültig. */
export function parseTimeDe(text: string): string | null {
  const s = text.trim();
  const m = s.match(/^(\d{1,2})(?:[:.h]?(\d{2}))?$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = m[2] === undefined ? 0 : Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}
