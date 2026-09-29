export type GeoResult = { label: string; lat: number; lon: number };

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<GeoResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&accept-language=de&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Adresssuche fehlgeschlagen (${res.status}).`);
  const data = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
  return data.map((r) => ({ label: r.display_name, lat: Number(r.lat), lon: Number(r.lon) }));
}
