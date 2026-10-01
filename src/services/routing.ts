import { polylineLengthKm, straightLine } from '@/domain/route';
import type { LatLon, RouteData } from '@/domain/types';

/** Fußrouting (FOSSGIS-OSRM, Profil foot); der Pfadteil "driving" ist bei OSRM nur ein Platzhalter. */
const OSRM_FOOT = 'https://routing.openstreetmap.de/routed-foot/route/v1/driving';
/** Fallback: öffentliche OSRM-Demo, kennt nur Auto. */
const OSRM_CAR = 'https://router.project-osrm.org/route/v1/driving';

type OsrmResponse = { code: string; routes?: Array<{ distance: number; legs: Array<{ distance: number }>; geometry: { coordinates: Array<[number, number]> } }> };

export type RouteResult = { route: NonNullable<RouteData>; usedFallback: boolean; profile: 'foot' | 'car' | 'straight' };

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

async function osrm(base: string, points: LatLon[]): Promise<NonNullable<RouteData>> {
  const pts = points.map((p) => `${p[1]},${p[0]}`).join(';');
  const url = `${base}/${pts}?overview=full&geometries=geojson&steps=false`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const data = (await res.json()) as OsrmResponse;
    const r = data.routes?.[0];
    if (data.code !== 'Ok' || !r) throw new Error(`OSRM ${data.code}`);
    const coords: LatLon[] = r.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
    const legKm = (r.legs ?? []).map((l) => l.distance / 1000);
    return { coords, lengthKm: round1(r.distance / 1000), fetchedAt: new Date().toISOString(), waypointKm: waypointKmFromLegs(legKm) };
  } finally {
    clearTimeout(t);
  }
}

/**
 * Route über alle Punkte in Reihenfolge (Start, Zwischenziele, Ziel).
 * osrm: erst Fußroute, dann Autoroute, zuletzt Luftlinie.
 */
export async function fetchRoute(points: LatLon[], mode: 'osrm' | 'straight'): Promise<RouteResult> {
  if (points.length < 2) throw new Error('Mindestens Start und Ziel nötig');
  if (mode === 'straight') return { route: straight(points), usedFallback: false, profile: 'straight' };
  try {
    return { route: await osrm(OSRM_FOOT, points), usedFallback: false, profile: 'foot' };
  } catch (err) {
    console.warn('[routing] foot routing failed, trying car', err);
  }
  try {
    return { route: await osrm(OSRM_CAR, points), usedFallback: true, profile: 'car' };
  } catch (err) {
    console.warn('[routing] OSRM failed, using straight line', err);
    return { route: straight(points), usedFallback: true, profile: 'straight' };
  }
}
