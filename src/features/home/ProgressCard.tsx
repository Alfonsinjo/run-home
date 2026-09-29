import { Card, ProgressBar, Stat, type ProgressMarker } from '@/components';
import { formatKm } from '@/domain/progress';
import type { Derived } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';

export function ProgressCard({ d }: { d: Derived }) {
  const { progress, milestones } = d;
  const targetKm = useAppStore((s) => s.settings.targetKm);
  const markers: ProgressMarker[] = milestones.filter((m) => m.km < targetKm).map((m) => ({ percent: m.km / targetKm, done: m.km <= progress.totalKm, title: `${m.title} (${formatKm(m.km)})`, manual: m.kind === 'manual' }));
  const pm = progress.plusMinusKm;
  return (
    <Card>
      <div className="row between" style={{ alignItems: 'flex-end' }}>
        <Stat value={formatKm(progress.totalKm)} label="gelaufen" size="xl" tone="accent" />
        <Stat value={formatKm(progress.remainingKm)} label="noch offen" size="md" tone="muted" />
      </div>
      <ProgressBar percent={progress.percent} markers={markers} />
      <div className="row between">
        <span className="pill num">{Math.round(progress.percent * 100)} %</span>
        <span className={`pill num ${pm >= 0 ? 'accent' : ''}`} style={pm < 0 ? { color: 'var(--warn)' } : undefined}>
          {pm >= 0 ? '+' : ''}{pm.toFixed(1).replace('.', ',')} km zum Plan
        </span>
        <span className="pill num">{progress.daysRemaining} Tage</span>
      </div>
    </Card>
  );
}
