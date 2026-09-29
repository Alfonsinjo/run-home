import { Card, Stat } from '@/components';
import { formatKm } from '@/domain/progress';
import type { Derived } from '@/store/selectors';

export function NextMilestoneCard({ d }: { d: Derived }) {
  if (!d.next) return <Card title="Meilensteine"><p className="accent" style={{ fontWeight: 700 }}>Alle Meilensteine erreicht. Angekommen!</p></Card>;
  const rest = Math.max(0, d.next.km - d.progress.totalKm);
  const days = d.dailyGoal > 0 ? Math.ceil(rest / d.dailyGoal) : null;
  return (
    <Card title="Nächster Meilenstein" action={<span className="pill">{d.next.kind === 'manual' ? 'eigener' : 'automatisch'}</span>}>
      <div className="row between" style={{ alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{d.next.title}</div>
          <div className="muted num">bei {formatKm(d.next.km)}</div>
        </div>
        <Stat value={formatKm(rest)} label={days ? `noch ca. ${days} Tage` : 'noch'} size="md" tone="accent" />
      </div>
    </Card>
  );
}
