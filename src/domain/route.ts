import type { LatLon } from './types';

const R = 6371.0088;
const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

export function haversineKm(a: LatLon, b: LatLon): number {
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function cumulative(coords: LatLon[]): number[] {
  const cum = [0];
  for (let i = 1; i < coords.length; i++) cum.push(cum[i - 1] + haversineKm(coords[i - 1], coords[i]));
  return cum;
}

export function polylineLengthKm(coords: LatLon[]): number {
  return coords.length < 2 ? 0 : cumulative(coords)[coords.length - 1];
}

function lerp(a: LatLon, b: LatLon, t: number): LatLon {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function locate(coords: LatLon[], km: number): { index: number; point: LatLon } {
  const cum = cumulative(coords);
  const total = cum[cum.length - 1];
  if (km <= 0) return { index: 0, point: coords[0] };
  if (km >= total) return { index: coords.length - 1, point: coords[coords.length - 1] };
  let i = 1;
  while (cum[i] < km) i++;
  const segLen = cum[i] - cum[i - 1];
  const t = segLen > 0 ? (km - cum[i - 1]) / segLen : 0;
  return { index: i, point: lerp(coords[i - 1], coords[i], t) };
}

export function pointAtKm(coords: LatLon[], km: number): LatLon {
  if (coords.length === 0) return [0, 0];
  if (coords.length === 1) return coords[0];
  return locate(coords, km).point;
}

export function splitAtKm(coords: LatLon[], km: number): { done: LatLon[]; todo: LatLon[] } {
  if (coords.length === 0) return { done: [], todo: [] };
  if (coords.length === 1) return { done: [coords[0]], todo: [coords[0]] };
  const total = polylineLengthKm(coords);
  if (km <= 0) return { done: [coords[0]], todo: [...coords] };
  if (km >= total) return { done: [...coords], todo: [coords[coords.length - 1]] };
  const { index, point } = locate(coords, km);
  return { done: [...coords.slice(0, index), point], todo: [point, ...coords.slice(index)] };
}

export function straightLine(a: LatLon, b: LatLon, segments = 64): LatLon[] {
  const lat1 = toRad(a[0]), lon1 = toRad(a[1]), lat2 = toRad(b[0]), lon2 = toRad(b[1]);
  const d = 2 * Math.asin(Math.sqrt(Math.sin((lat2 - lat1) / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2));
  if (d === 0) return [a, b];
  const pts: LatLon[] = [];
  for (let i = 0; i <= segments; i++) {
    const f = i / segments;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    pts.push([toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))), toDeg(Math.atan2(y, x))]);
  }
  pts[0] = a;
  pts[segments] = b;
  return pts;
}

export function kmAtNearestPoint(coords: LatLon[], p: LatLon): number {
  if (coords.length === 0) return 0;
  const cum = cumulative(coords);
  let best = 0, bestDist = Infinity;
  coords.forEach((c, i) => {
    const d = haversineKm(c, p);
    if (d < bestDist) { bestDist = d; best = i; }
  });
  return cum[best];
}

export function progressToRouteKm(totalKm: number, targetKm: number, lengthKm: number): number {
  if (targetKm <= 0 || lengthKm <= 0) return 0;
  return Math.min(lengthKm, (totalKm / targetKm) * lengthKm);
}
