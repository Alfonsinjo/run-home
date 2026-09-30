import { Card, Stat } from '@/components';
import { formatKm } from '@/domain/progress';
import type { Derived } from '@/store/selectors';

export function NextMilestoneCard({ d }: { d: Derived }) {
  if (!d.next) return <Card title="Meilensteine"><p style={{ fontWeight: 600 }}>Alle Meilensteine erreicht. Angekommen!</p></Card>;
  const rest = Math.max(0, d.next.km - d.progress.totalKm);
  const days = d.dailyGoal > 0 ? Math.ceil(rest / d.dailyGoal) : null;
  return (
    <Card title="Nächster Meilenstein" action={<span className="card-meta">{d.next.kind === 'manual' ? 'eigener' : 'automatisch'}</span>}>
      <div className="row between" style={{ alignItems: 'flex-end' }}>
        <div className="stat">
          <div className="display" style={{ fontSize: 26 }}>{d.next.title}</div>
          <div className="label num">bei {formatKm(d.next.km)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Stat value={formatKm(rest)} label={days ? `noch ca. ${days} Tage` : 'noch'} size="md" />
        </div>
      </div>
    </Card>
  );
}
