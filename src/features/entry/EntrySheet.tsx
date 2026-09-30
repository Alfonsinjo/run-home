import { useEffect, useState } from 'react';
import { Button, Field, Sheet, useToast } from '@/components';
import { todayKey } from '@/domain/dates';
import { formatKm } from '@/domain/progress';
import { useAppStore } from '@/store/useAppStore';
import { validateEntryForm, type EntryFormErrors } from './entryForm';

const QUICK = [1, 1.5, 2, 2.5, 3, 5];

export function EntrySheet({ open, onClose, date, onSaved }: { open: boolean; onClose(): void; date?: string; onSaved?(date: string): void }) {
  const toast = useToast((s) => s.show);
  const entries = useAppStore((s) => s.entries);
  const saveEntry = useAppStore((s) => s.saveEntry);
  const today = todayKey();
  const [d, setD] = useState(date ?? today);
  const [km, setKm] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<EntryFormErrors>({});

  useEffect(() => {
    if (!open) return;
    const target = date ?? today;
    const existing = entries[target];
    setD(target);
    setKm(existing ? String(existing.km).replace('.', ',') : '');
    setNote(existing?.note ?? '');
    setErrors({});
  }, [open, date, today, entries]);

  const submit = () => {
    const { errors: errs, value } = validateEntryForm({ date: d, km }, today);
    setErrors(errs);
    if (!value) return;
    const celebrations = saveEntry({ ...value, note });
    toast(celebrations.length ? `${formatKm(value.km)} gespeichert. ${celebrations.length} neue Erfolge!` : `${formatKm(value.km)} gespeichert.`, 'success');
    onSaved?.(value.date);
    onClose();
  };

  const existing = entries[d];

  return (
    <Sheet open={open} onClose={onClose} title={existing ? 'Eintrag bearbeiten' : 'Lauf eintragen'}>
      <Field label="Datum" error={errors.date}><input type="date" value={d} max={today} onChange={(e) => setD(e.target.value)} /></Field>
      <Field label="Kilometer" error={errors.km} hint={existing ? `Bisher ${formatKm(existing.km)} an diesem Tag. Der neue Wert ersetzt ihn.` : 'Mehrere Läufe? Einfach die Summe eintragen.'}>
        <input value={km} onChange={(e) => setKm(e.target.value)} inputMode="decimal" placeholder="2,5" autoFocus style={{ fontSize: 34, fontWeight: 700, fontFamily: 'var(--font-display)', minHeight: 64 }} className="num" />
      </Field>
      <div className="chips">
        {QUICK.map((q) => (
          <button key={q} type="button" className="chip" onClick={() => setKm(String(q).replace('.', ','))}>{formatKm(q)}</button>
        ))}
      </div>
      <Field label="Notiz (optional)"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="z. B. Intervalle, Regen, mit Kinderwagen" /></Field>
      <Button size="lg" full onClick={submit}>Speichern</Button>
    </Sheet>
  );
}
