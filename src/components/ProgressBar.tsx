export type ProgressMarker = { percent: number; done: boolean; title: string; manual?: boolean };

export function ProgressBar({ percent, markers = [] }: { percent: number; markers?: ProgressMarker[] }) {
  const p = Math.max(0, Math.min(1, percent)) * 100;
  return (
    <div className="progress" role="progressbar" aria-valuenow={Math.round(p)} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress-fill" style={{ width: `${p}%` }} />
      {markers.map((m) => (
        <span key={`${m.title}-${m.percent}`} className={`progress-marker ${m.done ? 'done' : ''} ${m.manual ? 'manual' : ''}`} style={{ left: `${Math.min(100, Math.max(0, m.percent * 100))}%` }} title={m.title} />
      ))}
    </div>
  );
}
