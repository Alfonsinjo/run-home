import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchPlaces } from './geocoding';

describe('searchPlaces', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('maps Nominatim results', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify([{ display_name: 'Hamburg, Deutschland', lat: '53.55', lon: '9.99' }]))));
    const res = await searchPlaces('Hamburg');
    expect(res).toEqual([{ label: 'Hamburg, Deutschland', lat: 53.55, lon: 9.99 }]);
    const url = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('nominatim.openstreetmap.org/search');
    expect(url).toContain('q=Hamburg');
  });
  it('returns [] for short queries without calling fetch', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    expect(await searchPlaces(' a ')).toEqual([]);
    expect(f).not.toHaveBeenCalled();
  });
  it('throws a German error on HTTP failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 503 })));
    await expect(searchPlaces('Berlin')).rejects.toThrow(/Adresssuche/);
  });
});
