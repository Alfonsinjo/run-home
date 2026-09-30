import { useMemo, useState } from 'react';
import { Button, Card, Screen, Stat, useToast } from '@/components';
import { formatDateDe } from '@/domain/dates';
import { formatKm } from '@/domain/progress';
import { EntrySheet } from '@/features/entry/EntrySheet';
import { useAppStore } from '@/store/useAppStore';
import { useDerived } from '@/store/selectors';
import { groupByMonth } from './groupByMonth';

const EditIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></svg>;
const TrashIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>;

export function HistoryScreen() {
  const entries = useAppStore((s) => s.entries);
  const deleteEntry = useAppStore((s) => s.deleteEntry);
  const toast = useToast((s) => s.show);
  const d = useDerived();
  const groups = useMemo(() => groupByMonth(entries), [entries]);
  const [editDate, setEditDate] = useState<string | undefined>();
  const [open, setOpen] = useState(false);

  const edit = (date?: string) => { setEditDate(date); setOpen(true); };
  const remove = (date: string) => {
    if (!window.confirm(`Eintrag vom ${formatDateDe(date)} löschen?`)) return;
    deleteEntry(date);
    toast('Eintrag gelöscht.');
  };
  const runDays = Object.values(entries).filter((e) => e.km > 0).length;
  const pm = d.progress.plusMinusKm;

  return (
    <Screen title="Verlauf" subtitle={`${runDays} Lauftage`} right={<Button variant="secondary" onClick={() => edit()}>Nachtragen</Button>}>
      <Card>
        <div className="grid-2">
          <Stat value={formatKm(d.progress.totalKm)} label="gesamt" size="lg" tone="accent" />
          <Stat value={`${pm >= 0 ? '+' : '−'}${Math.abs(pm).toFixed(1).replace('.', ',')} km`} label="zum Plan" size="lg" tone={pm >= 0 ? 'default' : 'warn'} />
        </div>
        <div className="label num">Plan-Soll heute: {formatKm(d.progress.planSollKm)}</div>
      </Card>
      {groups.length === 0 && <Card><p className="muted">Noch keine Einträge. Trag deinen ersten Lauf ein.</p></Card>}
      {groups.map((g) => (
        <Card key={g.month} title={g.label} action={<span className="card-meta">{formatKm(g.totalKm)}</span>}>
          <div className="list">
            {g.days.map((e) => (
              <div key={e.date} className="list-item">
                <div style={{ minWidth: 0 }}>
                  <div className="title num">{formatDateDe(e.date)}</div>
                  {e.note && <div className="muted small">{e.note}</div>}
                </div>
                <div className="row" style={{ gap: 4 }}>
                  <span className={`km ${e.km > 0 ? '' : 'muted'}`}>{formatKm(e.km)}</span>
                  <div className="list-actions">
                    <Button variant="ghost" className="btn-icon" onClick={() => edit(e.date)} aria-label="Bearbeiten"><EditIcon /></Button>
                    <Button variant="ghost" className="btn-icon" onClick={() => remove(e.date)} aria-label="Löschen"><TrashIcon /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
      <EntrySheet open={open} onClose={() => setOpen(false)} date={editDate} />
    </Screen>
  );
}
