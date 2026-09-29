import { Card, Stat } from '@/components';
import { formatDateDe } from '@/domain/dates';
import { formatKm } from '@/domain/progress';
import type { Derived } from '@/store/selectors';

export function TodayCard({ d }: { d: Derived }) {
  const left = Math.max(0, d.dailyGoal - d.todayKm);
  const done = d.dailyGoal > 0 && d.todayKm >= d.dailyGoal;
  return (
    <Card title="Heute">
      <div className="grid-2">
        <Stat value={formatKm(d.todayKm)} label={done ? 'Tagesziel erreicht' : `noch ${formatKm(left)}`} size="lg" tone={done ? 'accent' : 'default'} />
        <Stat value={formatKm(d.dailyGoal)} label="Tagesziel" size="lg" tone="muted" />
      </div>
      <div className="row between">
        <span className="pill">🔥 {d.streak} {d.streak === 1 ? 'Tag' : 'Tage'} Serie</span>
        {d.forecast && <span className="pill muted">Ankunft ca. {formatDateDe(d.forecast)}</span>}
      </div>
      <p className="muted">{d.motivation}</p>
    </Card>
  );
}
