import { useEffect, useRef, useState } from 'react';
import { formatDateDe, isValidDateKey, parseDateDe } from '@/domain/dates';

type Props = {
  value: string; // YYYY-MM-DD oder ''
  onChange(iso: string): void;
  min?: string;
  max?: string;
  placeholder?: string;
};

/**
 * Datumsfeld im deutschen Format (TT.MM.JJJJ): Texteingabe mit Übernahme beim Verlassen,
 * dazu ein Kalender-Button, der den nativen Picker öffnet (auf Android der System-Dialog).
 */
export function DateInput({ value, onChange, min, max, placeholder = 'TT.MM.JJJJ' }: Props) {
  const [draft, setDraft] = useState(value ? formatDateDe(value) : '');
  const picker = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value ? formatDateDe(value) : '');
  }, [value]);

  const commit = () => {
    const iso = parseDateDe(draft);
    if (iso && (!min || iso >= min) && (!max || iso <= max)) {
      if (iso !== value) onChange(iso);
      setDraft(formatDateDe(iso));
    } else {
      setDraft(value ? formatDateDe(value) : '');
    }
  };

  const openPicker = () => {
    const el = picker.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') {
      try { el.showPicker(); return; } catch { /* z. B. ohne Nutzergeste nicht erlaubt */ }
    }
    el.click();
  };

  return (
    <div className="date-input">
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
        inputMode="numeric"
        placeholder={placeholder}
        aria-label="Datum, Format Tag Punkt Monat Punkt Jahr"
      />
      <button type="button" className="date-input-btn" onClick={openPicker} aria-label="Kalender öffnen">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
      </button>
      <input
        ref={picker}
        type="date"
        className="date-input-native"
        tabIndex={-1}
        aria-hidden="true"
        value={isValidDateKey(value) ? value : ''}
        min={min}
        max={max}
        onChange={(e) => { if (isValidDateKey(e.target.value)) onChange(e.target.value); }}
      />
    </div>
  );
}
