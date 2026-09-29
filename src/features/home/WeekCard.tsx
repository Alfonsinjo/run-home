import { Card, WeekDots } from '@/components';
import { formatKm } from '@/domain/progress';
import type { Derived } from '@/store/selectors';

export function WeekCard({ d }: { d: Derived }) {
  const w = d.week;
  const pct = w.weekGoalKm > 0 ? Math.min(100, Math.round((w.weekKm / w.weekGoalKm) * 100)) : 0;
  return (
    <Card title="Diese Woche" action={<span className="pill num">{formatKm(w.weekKm)} / {formatKm(w.weekGoalKm)}</span>}>
      <WeekDots days={w.days} />
      <div className="progress"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
    </Card>
  );
}
