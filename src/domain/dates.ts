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
