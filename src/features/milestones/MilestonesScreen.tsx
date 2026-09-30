import { useMemo, useState } from 'react';
import { Card, Screen } from '@/components';
import { formatDateDe } from '@/domain/dates';
import { FUN_FACTS } from '@/domain/funfacts';
import { formatKm } from '@/domain/progress';
import { useAppStore } from '@/store/useAppStore';
import { useDerived } from '@/store/selectors';

type Item = { id: string; km: number; title: string; text?: string; source?: string; kind: 'milestone' | 'funfact' | 'manual' };

export function MilestonesScreen() {
  const d = useDerived();
  const achieved = useAppStore((s) => s.achieved);
  const [filter, setFilter] = useState<'all' | 'milestone' | 'funfact'>('all');
  const items = useMemo<Item[]>(() => {
    const ms: Item[] = d.milestones.map((m) => ({ id: m.id, km: m.km, title: m.title, text: m.description, kind: m.kind === 'manual' ? 'manual' : 'milestone' }));
    const ff: Item[] = FUN_FACTS.map((f) => ({ id: f.id, km: f.km, title: f.title, text: f.text, source: f.source, kind: 'funfact' }));
    return [...ms, ...ff].sort((a, b) => a.km - b.km);
  }, [d.milestones]);
  const visible = items.filter((i) => filter === 'all' || (filter === 'milestone' ? i.kind !== 'funfact' : i.kind === 'funfact'));
  const total = d.progress.totalKm;
  const nextId = visible.find((i) => i.km > total)?.id;
  const doneCount = items.filter((i) => i.id in achieved).length;

  return (
    <Screen title="Ziele" subtitle={`${doneCount} von ${items.length} erreicht`}>
      <div className="segmented" role="group" aria-label="Filter">
        {(['all', 'milestone', 'funfact'] as const).map((f) => (
          <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>{f === 'all' ? 'Alle' : f === 'milestone' ? 'Meilensteine' : 'Fun Facts'}</button>
        ))}
      </div>
      <Card>
        <div className="timeline">
          {visible.map((i) => {
            const done = i.id in achieved;
            const isNext = i.id === nextId;
            return (
              <div key={i.id} className={`timeline-item ${done ? 'done' : ''} ${isNext ? 'next' : ''}`}>
                <div className="dot" />
                <div className="body">
                  <div className="row between" style={{ alignItems: 'baseline' }}>
                    <div className="t-title">{i.title}</div>
                    <span className="t-km">{formatKm(i.km)}</span>
                  </div>
                  <div className="label">
                    {i.kind === 'funfact' ? 'Fun Fact' : i.kind === 'manual' ? 'Eigener Meilenstein' : 'Meilenstein'}
                    {done ? ` · erreicht am ${formatDateDe(achieved[i.id])}` : ` · noch ${formatKm(Math.max(0, i.km - total))}`}
                    {isNext ? ' · als Nächstes' : ''}
                  </div>
                  {(done || isNext) && i.text && <p className="muted small" style={{ marginTop: 6 }}>{i.text}</p>}
                  {done && i.source && <a className="small" style={{ marginTop: 4 }} href={i.source} target="_blank" rel="noreferrer">Quelle</a>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </Screen>
  );
}
