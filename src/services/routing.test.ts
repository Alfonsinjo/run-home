import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchRoute, fetchRouteOptions } from './routing';

const osrmBody = { code: 'Ok', routes: [{ distance: 255000, legs: [{ distance: 255000 }], geometry: { coordinates: [[13.405, 52.52], [11.5, 53.0], [9.9937, 53.5511]] } }] };
const osrmVia = { code: 'Ok', routes: [{ distance: 300000, legs: [{ distance: 120000 }, { distance: 180000 }], geometry: { coordinates: [[13.405, 52.52], [11.5, 53.0], [9.9937, 53.5511]] } }] };

describe('fetchRoute', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('uses the foot profile first and converts [lon,lat] to [lat,lon]', async () => {
    const f = vi.fn(async (_url: string) => new Response(JSON.stringify(osrmBody)));
    vi.stubGlobal('fetch', f);
    const { route, usedFallback, profile } = await fetchRoute([[52.52, 13.405], [53.5511, 9.9937]], 'osrm');
    expect(usedFallback).toBe(false);
    expect(profile).toBe('foot');
    expect(String(f.mock.calls[0][0])).toContain('routed-foot');
    expect(String(f.mock.calls[0][0])).toContain('13.405,52.52;9.9937,53.5511');
    expect(route.waypointKm).toEqual([]);
    expect(route.coords[0]).toEqual([52.52, 13.405]);
    expect(route.coords[2]).toEqual([53.5511, 9.9937]);
    expect(route.lengthKm).toBe(255);
    expect(route.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
  it('passes waypoints in order and derives waypointKm from legs', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(osrmVia))));
    const { route } = await fetchRoute([[52.52, 13.405], [53.0, 11.5], [53.5511, 9.9937]], 'osrm');
    expect(route.lengthKm).toBe(300);
    expect(route.waypointKm).toEqual([120]);
  });
  it('falls back to the car profile when foot routing fails', async () => {
    const f = vi.fn(async (url: string) => (url.includes('routed-foot') ? new Response('', { status: 503 }) : new Response(JSON.stringify(osrmBody))));
    vi.stubGlobal('fetch', f);
    const { usedFallback, profile } = await fetchRoute([[52.52, 13.405], [53.5511, 9.9937]], 'osrm');
    expect(profile).toBe('car');
    expect(usedFallback).toBe(true);
    expect(f).toHaveBeenCalledTimes(2);
  });
  it('falls back to a straight line on error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    const { route, usedFallback, profile } = await fetchRoute([[52.52, 13.405], [53.5511, 9.9937]], 'osrm');
    expect(usedFallback).toBe(true);
    expect(profile).toBe('straight');
    expect(route.coords.length).toBe(65);
    expect(route.lengthKm).toBeGreaterThan(250);
  });
  it('straight line through a waypoint reports its km', async () => {
    const { route } = await fetchRoute([[52.52, 13.405], [53.0, 11.5], [53.5511, 9.9937]], 'straight');
    expect(route.waypointKm).toHaveLength(1);
    expect(route.waypointKm![0]).toBeGreaterThan(100);
    expect(route.waypointKm![0]).toBeLessThan(route.lengthKm);
  });
  it('straight mode never calls fetch', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    const { usedFallback } = await fetchRoute([[52.52, 13.405], [53.5511, 9.9937]], 'straight');
    expect(usedFallback).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });
});

const alt2 = { code: 'Ok', routes: [
  { distance: 255000, legs: [{ distance: 255000 }], geometry: { coordinates: [[13.405, 52.52], [11.5, 53.0], [9.9937, 53.5511]] } },
  { distance: 262000, legs: [{ distance: 262000 }], geometry: { coordinates: [[13.405, 52.52], [11.9, 53.2], [9.9937, 53.5511]] } },
] };
const legA = { code: 'Ok', routes: [
  { distance: 120000, legs: [{ distance: 120000 }], geometry: { coordinates: [[13.405, 52.52], [12.4, 52.8], [11.5, 53.0]] } },
  { distance: 130000, legs: [{ distance: 130000 }], geometry: { coordinates: [[13.405, 52.52], [12.6, 52.6], [11.5, 53.0]] } },
] };
const legB = { code: 'Ok', routes: [
  { distance: 180000, legs: [{ distance: 180000 }], geometry: { coordinates: [[11.5, 53.0], [10.7, 53.3], [9.9937, 53.5511]] } },
] };

describe('fetchRouteOptions', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('requests alternatives and returns them in server order', async () => {
    const f = vi.fn(async (_url: string) => new Response(JSON.stringify(alt2)));
    vi.stubGlobal('fetch', f);
    const { options, profile } = await fetchRouteOptions([[52.52, 13.405], [53.5511, 9.9937]], 'osrm');
    expect(profile).toBe('foot');
    expect(String(f.mock.calls[0][0])).toContain('alternatives=3');
    expect(options.map((o) => o.lengthKm)).toEqual([255, 262]);
    expect(f).toHaveBeenCalledTimes(1);
  });
  it('combines per-leg alternatives when the full request yields only one route through waypoints', async () => {
    const f = vi.fn(async (url: string) => {
      const pts = url.split('/driving/')[1].split('?')[0].split(';');
      if (pts.length === 3) return new Response(JSON.stringify(osrmVia));
      return new Response(JSON.stringify(pts[0].startsWith('13.405') ? legA : legB));
    });
    vi.stubGlobal('fetch', f);
    const { options } = await fetchRouteOptions([[52.52, 13.405], [53.0, 11.5], [53.5511, 9.9937]], 'osrm');
    expect(options).toHaveLength(2);
    expect(options[0].lengthKm).toBe(300);
    expect(options[0].waypointKm).toEqual([120]);
    expect(options[1].lengthKm).toBe(310);
    expect(options[1].waypointKm).toEqual([130]);
    expect(options[1].coords).toHaveLength(5); // 3 + 3 - gemeinsamer Übergangspunkt
    expect(f).toHaveBeenCalledTimes(3);
  });
  it('straight mode yields a single straight option', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    const { options, profile } = await fetchRouteOptions([[52.52, 13.405], [53.5511, 9.9937]], 'straight');
    expect(profile).toBe('straight');
    expect(options).toHaveLength(1);
    expect(f).not.toHaveBeenCalled();
  });
});
