import { Card, ProgressBar, Stat, type ProgressMarker } from '@/components';
import { formatKm } from '@/domain/progress';
import type { Derived } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';

export function ProgressCard({ d }: { d: Derived }) {
  const { progress, milestones } = d;
  const targetKm = useAppStore((s) => s.settings.targetKm);
  const markers: ProgressMarker[] = milestones.filter((m) => m.km < targetKm).map((m) => ({ percent: m.km / targetKm, done: m.km <= progress.totalKm, title: `${m.title} (${formatKm(m.km)})`, manual: m.kind !== 'auto' }));
  const pm = progress.plusMinusKm;
  return (
    <Card aria-label="Fortschritt">
      <Stat value={formatKm(progress.totalKm)} label={`gelaufen von ${formatKm(targetKm)}`} size="xl" tone="accent" />
      <ProgressBar percent={progress.percent} markers={markers} />
      <div className="stat-row">
        <Stat value={`${Math.round(progress.percent * 100)} %`} label="geschafft" size="sm" />
        <Stat value={`${pm >= 0 ? '+' : '−'}${Math.abs(pm).toFixed(1).replace('.', ',')} km`} label="zum Plan" size="sm" tone={pm < 0 ? 'warn' : 'default'} />
        <Stat value={`${progress.daysRemaining} ${progress.daysRemaining === 1 ? 'Tag' : 'Tage'}`} label="bis zur Deadline" size="sm" />
      </div>
    </Card>
  );
}
