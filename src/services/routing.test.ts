import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchRoute } from './routing';

const osrmBody = { code: 'Ok', routes: [{ distance: 255000, geometry: { coordinates: [[13.405, 52.52], [11.5, 53.0], [9.9937, 53.5511]] } }] };

describe('fetchRoute', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('uses OSRM and converts [lon,lat] to [lat,lon]', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(osrmBody))));
    const { route, usedFallback } = await fetchRoute([52.52, 13.405], [53.5511, 9.9937], 'osrm');
    expect(usedFallback).toBe(false);
    expect(route.coords[0]).toEqual([52.52, 13.405]);
    expect(route.coords[2]).toEqual([53.5511, 9.9937]);
    expect(route.lengthKm).toBe(255);
    expect(route.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
  it('falls back to a straight line on error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    const { route, usedFallback } = await fetchRoute([52.52, 13.405], [53.5511, 9.9937], 'osrm');
    expect(usedFallback).toBe(true);
    expect(route.coords.length).toBe(65);
    expect(route.lengthKm).toBeGreaterThan(250);
  });
  it('straight mode never calls fetch', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    const { usedFallback } = await fetchRoute([52.52, 13.405], [53.5511, 9.9937], 'straight');
    expect(usedFallback).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });
});
