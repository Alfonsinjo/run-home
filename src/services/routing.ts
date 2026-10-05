import { polylineLengthKm, straightLine } from '@/domain/route';
import type { LatLon, RouteData } from '@/domain/types';

/** Fußrouting (FOSSGIS-OSRM, Profil foot); der Pfadteil "driving" ist bei OSRM nur ein Platzhalter. */
const OSRM_FOOT = 'https://routing.openstreetmap.de/routed-foot/route/v1/driving';
/** Fallback: öffentliche OSRM-Demo, kennt nur Auto. */
const OSRM_CAR = 'https://router.project-osrm.org/route/v1/driving';

type OsrmRoute = { distance: number; legs: Array<{ distance: number }>; geometry: { coordinates: Array<[number, number]> } };
type OsrmResponse = { code: string; routes?: OsrmRoute[] };

export type RouteProfile = 'foot' | 'car' | 'straight';
export type RouteResult = { route: NonNullable<RouteData>; usedFallback: boolean; profile: RouteProfile };
export type RouteOptionsResult = { options: NonNullable<RouteData>[]; usedFallback: boolean; profile: RouteProfile };

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Routen-km an den Zwischenpunkten aus den Teilstrecken (ohne Start, ohne Ziel). */
function waypointKmFromLegs(legKm: number[]): number[] {
  const out: number[] = [];
  let acc = 0;
  for (let i = 0; i < legKm.length - 1; i++) { acc += legKm[i]; out.push(round1(acc)); }
  return out;
}

function straight(points: LatLon[]): NonNullable<RouteData> {
  const coords: LatLon[] = [];
  const legKm: number[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const seg = straightLine(points[i], points[i + 1], 64);
    legKm.push(polylineLengthKm(seg));
    coords.push(...(i === 0 ? seg : seg.slice(1)));
  }
  return { coords, lengthKm: round1(polylineLengthKm(coords)), fetchedAt: new Date().toISOString(), waypointKm: waypointKmFromLegs(legKm) };
}

function toRoute(r: OsrmRoute): NonNullable<RouteData> {
  const coords: LatLon[] = r.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
  const legKm = (r.legs ?? []).map((l) => l.distance / 1000);
  return { coords, lengthKm: round1(r.distance / 1000), fetchedAt: new Date().toISOString(), waypointKm: waypointKmFromLegs(legKm) };
}

/** Eine OSRM-Anfrage; mit `alternatives` > 1 liefert der Server bis zu so viele Varianten (nur ohne Zwischenpunkte). */
async function osrm(base: string, points: LatLon[], alternatives = 1): Promise<NonNullable<RouteData>[]> {
  const pts = points.map((p) => `${p[1]},${p[0]}`).join(';');
  const alt = alternatives > 1 ? `&alternatives=${alternatives}` : '';
  const url = `${base}/${pts}?overview=full&geometries=geojson&steps=false${alt}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const data = (await res.json()) as OsrmResponse;
    if (data.code !== 'Ok' || !data.routes?.length) throw new Error(`OSRM ${data.code}`);
    return data.routes.map(toRoute);
  } finally {
    clearTimeout(t);
  }
}

/** Hängt Teilstrecken zu einer durchgehenden Route zusammen (gemeinsame Übergangspunkte nur einmal). */
function joinLegs(legs: NonNullable<RouteData>[]): NonNullable<RouteData> {
  const coords: LatLon[] = [];
  const legKm: number[] = [];
  let total = 0;
  for (const [i, leg] of legs.entries()) {
    coords.push(...(i === 0 ? leg.coords : leg.coords.slice(1)));
    legKm.push(leg.lengthKm);
    total += leg.lengthKm;
  }
  return { coords, lengthKm: round1(total), fetchedAt: new Date().toISOString(), waypointKm: waypointKmFromLegs(legKm) };
}

/**
 * Bis zu `max` Routenvarianten über alle Punkte. OSRM liefert Alternativen nur ohne Zwischenpunkte;
 * mit Zwischenzielen werden je Teilstrecke Alternativen geholt und zur k-ten Gesamtvariante kombiniert.
 */
async function osrmOptions(base: string, points: LatLon[], max: number): Promise<NonNullable<RouteData>[]> {
  const full = await osrm(base, points, max);
  if (points.length === 2 || full.length >= 2) return full.slice(0, max);
  const legs = await Promise.all(points.slice(0, -1).map((p, i) => osrm(base, [p, points[i + 1]], max)));
  const count = Math.min(max, Math.max(...legs.map((l) => l.length)));
  const options: NonNullable<RouteData>[] = [];
  for (let k = 0; k < count; k++) {
    const candidate = joinLegs(legs.map((l) => l[Math.min(k, l.length - 1)]));
    if (!options.some((o) => Math.abs(o.lengthKm - candidate.lengthKm) < 0.05 && o.coords.length === candidate.coords.length)) options.push(candidate);
  }
  return options.length ? options : full;
}

/**
 * Route über alle Punkte in Reihenfolge (Start, Zwischenziele, Ziel).
 * osrm: erst Fußroute, dann Autoroute, zuletzt Luftlinie.
 */
export async function fetchRoute(points: LatLon[], mode: 'osrm' | 'straight'): Promise<RouteResult> {
  if (points.length < 2) throw new Error('Mindestens Start und Ziel nötig');
  if (mode === 'straight') return { route: straight(points), usedFallback: false, profile: 'straight' };
  try {
    return { route: (await osrm(OSRM_FOOT, points))[0], usedFallback: false, profile: 'foot' };
  } catch (err) {
    console.warn('[routing] foot routing failed, trying car', err);
  }
  try {
    return { route: (await osrm(OSRM_CAR, points))[0], usedFallback: true, profile: 'car' };
  } catch (err) {
    console.warn('[routing] OSRM failed, using straight line', err);
    return { route: straight(points), usedFallback: true, profile: 'straight' };
  }
}

/** Wie fetchRoute, liefert aber bis zu `max` Varianten (wie bei Google: kürzeste zuerst, dann Alternativen). */
export async function fetchRouteOptions(points: LatLon[], mode: 'osrm' | 'straight', max = 3): Promise<RouteOptionsResult> {
  if (points.length < 2) throw new Error('Mindestens Start und Ziel nötig');
  if (mode === 'straight') return { options: [straight(points)], usedFallback: false, profile: 'straight' };
  try {
    return { options: await osrmOptions(OSRM_FOOT, points, max), usedFallback: false, profile: 'foot' };
  } catch (err) {
    console.warn('[routing] foot alternatives failed, trying car', err);
  }
  try {
    return { options: await osrmOptions(OSRM_CAR, points, max), usedFallback: true, profile: 'car' };
  } catch (err) {
    console.warn('[routing] OSRM failed, using straight line', err);
    return { options: [straight(points)], usedFallback: true, profile: 'straight' };
  }
}
