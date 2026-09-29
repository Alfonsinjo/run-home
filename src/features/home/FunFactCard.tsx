import { Card } from '@/components';
import { formatKm } from '@/domain/progress';
import type { Derived } from '@/store/selectors';

export function FunFactCard({ d }: { d: Derived }) {
  const f = d.latestFact;
  const n = d.nextFact;
  return (
    <Card title="Fun Fact" action={f ? <span className="pill accent num">{formatKm(f.km)}</span> : undefined}>
      {f ? (
        <>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{f.title}</div>
          <p className="muted">{f.text}</p>
          <a className="muted" style={{ fontSize: 12 }} href={f.source} target="_blank" rel="noreferrer">Quelle</a>
        </>
      ) : (
        <p className="muted">Der erste Fun Fact wartet bei {n ? formatKm(n.km) : '…'}.</p>
      )}
      {f && n && <p className="muted" style={{ fontSize: 13 }}>Nächster bei {formatKm(n.km)}: noch {formatKm(Math.max(0, n.km - d.progress.totalKm))}.</p>}
    </Card>
  );
}
