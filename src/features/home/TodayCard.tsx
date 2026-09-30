import { Card, Stat } from '@/components';
import { formatDateDe } from '@/domain/dates';
import { formatKm } from '@/domain/progress';
import type { Derived } from '@/store/selectors';

const R = 32;
const C = 2 * Math.PI * R;
const num = (km: number) => formatKm(km).replace(' km', '');

export function TodayCard({ d }: { d: Derived }) {
  const left = Math.max(0, d.dailyGoal - d.todayKm);
  const done = d.dailyGoal > 0 && d.todayKm >= d.dailyGoal;
  const ratio = d.dailyGoal > 0 ? Math.min(1, d.todayKm / d.dailyGoal) : 0;
  return (
    <Card title="Heute">
      <div className="today-main">
        <div className={`ring ${done ? 'done' : ''}`} role="img" aria-label={`${Math.round(ratio * 100)} % vom Tagesziel`}>
          <svg viewBox="0 0 76 76" aria-hidden="true">
            <circle className="ring-track" cx="38" cy="38" r={R} />
            <circle className="ring-fill" cx="38" cy="38" r={R} strokeDasharray={C} strokeDashoffset={C * (1 - ratio)} style={ratio === 0 ? { opacity: 0 } : undefined} />
          </svg>
          <div className="ring-center num">{Math.round(ratio * 100)}<span className="stat-unit">%</span></div>
        </div>
        <div className="stat">
          <div className="today-value num">{num(d.todayKm)} <span className="of">von {formatKm(d.dailyGoal)}</span></div>
          <div className="label">{done ? 'Tagesziel erreicht' : `noch ${formatKm(left)} bis zum Tagesziel`}</div>
        </div>
      </div>
      <div className="stat-row two">
        <Stat value={`${d.streak} ${d.streak === 1 ? 'Tag' : 'Tage'}`} label="Serie" size="sm" />
        {d.forecast && <Stat value={formatDateDe(d.forecast)} label="Ankunft ca." size="sm" />}
      </div>
      <p className="motivation">{d.motivation}</p>
    </Card>
  );
}
