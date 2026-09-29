import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Button } from '@/components';
import { formatKm } from '@/domain/progress';
import { useAppStore } from '@/store/useAppStore';

export function Celebration() {
  const current = useAppStore((s) => s.celebrations[0]);
  const remaining = useAppStore((s) => s.celebrations.length);
  const shift = useAppStore((s) => s.shiftCelebration);

  useEffect(() => {
    if (!current) return;
    void confetti({ particleCount: 120, spread: 80, origin: { y: 0.65 }, colors: ['#D4FF3A', '#FFFFFF', '#5CFF9D'] });
  }, [current]);

  if (!current) return null;
  const item = current.item;
  return (
    <div className="celebration" role="dialog" aria-modal="true">
      <div className="kicker label">{current.kind === 'milestone' ? 'Meilenstein erreicht' : 'Fun Fact freigeschaltet'} · {formatKm(item.km)}</div>
      <h1>{item.title}</h1>
      <p>{current.kind === 'milestone' ? (current.item.description ?? 'Weiter so!') : current.item.text}</p>
      {current.kind === 'funfact' && <a href={current.item.source} target="_blank" rel="noreferrer">Quelle ansehen</a>}
      <Button size="lg" onClick={shift}>{remaining > 1 ? `Weiter (${remaining - 1} weitere)` : 'Weiter'}</Button>
    </div>
  );
}
