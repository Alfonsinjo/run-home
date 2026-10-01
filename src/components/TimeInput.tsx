import { useEffect, useRef, useState } from 'react';
import { parseTimeDe } from '@/domain/dates';

type Props = { value: string; onChange(hhmm: string): void };

const TIME_RE = /^\d{2}:\d{2}$/;

/**
 * Uhrzeitfeld im 24-Stunden-Format (HH:MM): Texteingabe mit Übernahme beim Verlassen,
 * dazu ein Uhr-Button, der den nativen Picker öffnet.
 */
export function TimeInput({ value, onChange }: Props) {
  const [draft, setDraft] = useState(value);
  const picker = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    const t = parseTimeDe(draft);
    if (t) {
      if (t !== value) onChange(t);
      setDraft(t);
    } else {
      setDraft(value);
    }
  };

  const openPicker = () => {
    const el = picker.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') {
      try { el.showPicker(); return; } catch { /* ohne Nutzergeste nicht erlaubt */ }
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
        placeholder="HH:MM"
        aria-label="Uhrzeit, 24-Stunden-Format"
      />
      <button type="button" className="date-input-btn" onClick={openPicker} aria-label="Uhrzeit wählen">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
      </button>
      <input
        ref={picker}
        type="time"
        className="date-input-native"
        tabIndex={-1}
        aria-hidden="true"
        value={TIME_RE.test(value) ? value : ''}
        onChange={(e) => { if (TIME_RE.test(e.target.value)) onChange(e.target.value); }}
      />
    </div>
  );
}
