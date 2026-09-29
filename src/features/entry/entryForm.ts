import { isValidDateKey } from '@/domain/dates';
import { MAX_KM_PER_DAY } from '@/domain/importer';

export type EntryFormErrors = { date?: string; km?: string };

export function parseKmInput(raw: string): number | null {
  const s = raw.trim().replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

export function validateEntryForm(input: { date: string; km: string }, today: string): { errors: EntryFormErrors; value: { date: string; km: number } | null } {
  const errors: EntryFormErrors = {};
  if (!isValidDateKey(input.date)) errors.date = 'Bitte ein gültiges Datum wählen.';
  else if (input.date > today) errors.date = 'Das Datum liegt in der Zukunft.';
  const km = parseKmInput(input.km);
  if (km === null) errors.km = 'Bitte Kilometer eingeben, z. B. 2,5.';
  else if (km < 0) errors.km = 'Kilometer können nicht negativ sein.';
  else if (km > MAX_KM_PER_DAY) errors.km = `Mehr als ${MAX_KM_PER_DAY} km an einem Tag? Bitte prüfen.`;
  const ok = Object.keys(errors).length === 0 && km !== null;
  return { errors, value: ok ? { date: input.date, km } : null };
}
