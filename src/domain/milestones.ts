import { kmAtNearestPoint } from './route';
import type { Milestone, RouteData, Settings } from './types';

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

/**
 * Zwischenziele als Meilensteine: Routen-km am Zwischenziel, proportional auf die Zieldistanz umgerechnet.
 * Ohne Route gibt es keine Position, dann entfallen sie.
 */
export function waypointMilestones(settings: Pick<Settings, 'targetKm'> & Partial<Pick<Settings, 'waypoints'>>, route: RouteData): Milestone[] {
  if (!route || route.lengthKm <= 0 || !settings.waypoints?.length) return [];
  const exact = route.waypointKm && route.waypointKm.length === settings.waypoints.length ? route.waypointKm : null;
  return settings.waypoints.map((w, i) => {
    const routeKm = exact ? exact[i] : kmAtNearestPoint(route.coords, [w.lat, w.lon]);
    const km = Math.round((routeKm / route.lengthKm) * settings.targetKm * 10) / 10;
    return { id: `wp-${w.id}`, kind: 'waypoint', km, title: w.label, description: 'Zwischenziel auf deiner Strecke.' };
  });
}

export function allMilestones(settings: Pick<Settings, 'targetKm' | 'manualMilestones'> & Partial<Pick<Settings, 'waypoints'>>, route: RouteData = null): Milestone[] {
  return [...autoMilestones(settings.targetKm), ...settings.manualMilestones, ...waypointMilestones(settings, route)].sort((a, b) => a.km - b.km);
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
