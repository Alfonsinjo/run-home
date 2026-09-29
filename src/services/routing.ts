import { polylineLengthKm, straightLine } from '@/domain/route';
import type { LatLon, RouteData } from '@/domain/types';

const OSRM = 'https://router.project-osrm.org/route/v1/driving';

type OsrmResponse = { code: string; routes?: Array<{ distance: number; geometry: { coordinates: Array<[number, number]> } }> };

function straight(from: LatLon, to: LatLon): NonNullable<RouteData> {
  const coords = straightLine(from, to, 64);
  return { coords, lengthKm: Math.round(polylineLengthKm(coords) * 10) / 10, fetchedAt: new Date().toISOString() };
}

export async function fetchRoute(from: LatLon, to: LatLon, mode: 'osrm' | 'straight'): Promise<{ route: NonNullable<RouteData>; usedFallback: boolean }> {
  if (mode === 'straight') return { route: straight(from, to), usedFallback: false };
  try {
    const url = `${OSRM}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson&steps=false`;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const data = (await res.json()) as OsrmResponse;
    const r = data.routes?.[0];
    if (data.code !== 'Ok' || !r) throw new Error(`OSRM ${data.code}`);
    const coords: LatLon[] = r.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
    return { route: { coords, lengthKm: Math.round(r.distance / 100) / 10, fetchedAt: new Date().toISOString() }, usedFallback: false };
  } catch (err) {
    console.warn('[routing] OSRM failed, using straight line', err);
    return { route: straight(from, to), usedFallback: true };
  }
}
