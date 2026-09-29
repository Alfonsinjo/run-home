import type { Milestone, Settings } from './types';

const PERCENT_MARKS: Array<[number, string]> = [
  [0.1, '10 % geschafft'],
  [0.25, 'Ein Viertel'],
  [0.5, 'Halbzeit'],
  [0.75, 'Drei Viertel'],
  [0.9, 'Endspurt: 90 %'],
  [1, 'Angekommen!'],
];

export function autoMilestones(targetKm: number): Milestone[] {
  const byKm = new Map<number, Milestone>();
  for (const [pct, title] of PERCENT_MARKS) {
    const km = Math.round(targetKm * pct * 10) / 10;
    byKm.set(km, {
      id: `auto-pct-${Math.round(pct * 100)}`,
      kind: 'auto',
      km,
      title,
      description: `${Math.round(pct * 100)} % der Strecke zu deinen Eltern.`,
    });
  }
  for (let km = 50; km < targetKm; km += 50) {
    if (!byKm.has(km)) {
      byKm.set(km, { id: `auto-${km}km`, kind: 'auto', km, title: `${km} km`, description: `${km} Kilometer gelaufen.` });
    }
  }
  return [...byKm.values()].sort((a, b) => a.km - b.km);
}

export function allMilestones(settings: Pick<Settings, 'targetKm' | 'manualMilestones'>): Milestone[] {
  return [...autoMilestones(settings.targetKm), ...settings.manualMilestones].sort((a, b) => a.km - b.km);
}

export function nextMilestone(milestones: Milestone[], totalKm: number): Milestone | null {
  return milestones.find((m) => m.km > totalKm) ?? null;
}

export function newlyReached<T extends { id: string; km: number }>(
  items: T[],
  totalKm: number,
  achieved: Record<string, string>,
): T[] {
  return items.filter((i) => i.km <= totalKm && !(i.id in achieved)).sort((a, b) => a.km - b.km);
}
