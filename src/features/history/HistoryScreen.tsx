import { useMemo, useState } from 'react';
import { Button, Card, Screen, Stat, useToast } from '@/components';
import { formatDateDe } from '@/domain/dates';
import { formatKm } from '@/domain/progress';
import { EntrySheet } from '@/features/entry/EntrySheet';
import { useAppStore } from '@/store/useAppStore';
import { useDerived } from '@/store/selectors';
import { groupByMonth } from './groupByMonth';

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

  return (
    <Screen title="Verlauf" right={<Button variant="secondary" onClick={() => edit()}>Nachtragen</Button>}>
      <Card>
        <div className="grid-2">
          <Stat value={formatKm(d.progress.totalKm)} label="gesamt" size="lg" tone="accent" />
          <Stat value={`${d.progress.plusMinusKm >= 0 ? '+' : ''}${d.progress.plusMinusKm.toFixed(1).replace('.', ',')} km`} label="zum Plan" size="lg" tone={d.progress.plusMinusKm >= 0 ? 'accent' : 'warn'} />
        </div>
        <div className="row between muted" style={{ fontSize: 13 }}>
          <span>Plan-Soll heute: {formatKm(d.progress.planSollKm)}</span>
          <span>{runDays} Lauftage</span>
        </div>
      </Card>
      {groups.length === 0 && <Card><p className="muted">Noch keine Einträge. Trag deinen ersten Lauf ein.</p></Card>}
      {groups.map((g) => (
        <Card key={g.month} title={g.label} action={<span className="pill num">{formatKm(g.totalKm)}</span>}>
          <div className="list">
            {g.days.map((e) => (
              <div key={e.date} className="list-item">
                <div>
                  <div style={{ fontWeight: 700 }} className="num">{formatDateDe(e.date)}</div>
                  {e.note && <div className="muted" style={{ fontSize: 13 }}>{e.note}</div>}
                </div>
                <div className="row">
                  <span className={`num ${e.km > 0 ? 'accent' : 'muted'}`} style={{ fontWeight: 800, fontSize: 18 }}>{formatKm(e.km)}</span>
                  <Button variant="ghost" onClick={() => edit(e.date)} aria-label="Bearbeiten">✎</Button>
                  <Button variant="ghost" onClick={() => remove(e.date)} aria-label="Löschen">🗑</Button>
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
