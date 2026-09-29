import { useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import { Button, Field } from '@/components';
import type { LatLon, Place } from '@/domain/types';
import { searchPlaces, type GeoResult } from '@/services/geocoding';
import { pinIcon } from '@/features/home/mapIcons';

export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende';

function ClickToPlace({ onPick }: { onPick(p: LatLon): void }) {
  useMapEvents({ click: (e) => onPick([e.latlng.lat, e.latlng.lng]) });
  return null;
}

export function PlacePicker({ label, value, onChange, center = [51.16, 10.45] }: { label: string; value: Place | null; onChange(p: Place | null): void; center?: LatLon }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    if (query.trim().length < 3) { setResults([]); return; }
    const t = setTimeout(async () => {
      abort.current?.abort();
      abort.current = new AbortController();
      setLoading(true);
      setError(undefined);
      try {
        setResults(await searchPlaces(query, abort.current.signal));
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const pick = (r: GeoResult) => {
    onChange({ label: r.label, lat: r.lat, lon: r.lon });
    setQuery('');
    setResults([]);
  };

  const mapCenter: LatLon = value ? [value.lat, value.lon] : center;

  return (
    <div className="card">
      <Field label={label} error={error} hint={loading ? 'Suche…' : 'Adresse oder Ort eingeben, oder auf der Karte tippen.'}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="z. B. Musterstraße 1, Frankfurt" autoComplete="off" />
      </Field>
      {results.length > 0 && (
        <div className="list">
          {results.map((r) => (
            <button key={`${r.lat},${r.lon}`} type="button" className="list-item" style={{ background: 'none', border: 0, textAlign: 'left', color: 'inherit', cursor: 'pointer' }} onClick={() => pick(r)}>
              <span>{r.label}</span>
            </button>
          ))}
        </div>
      )}
      {value && (
        <div className="row between">
          <div>
            <div style={{ fontWeight: 700 }}>{value.label}</div>
            <div className="muted num" style={{ fontSize: 12 }}>{value.lat.toFixed(5)}, {value.lon.toFixed(5)}</div>
          </div>
          <Button variant="ghost" onClick={() => onChange(null)}>Entfernen</Button>
        </div>
      )}
      <Button variant="secondary" onClick={() => setShowMap((s) => !s)}>{showMap ? 'Karte ausblenden' : 'Auf Karte wählen'}</Button>
      {showMap && (
        <div style={{ height: 220, borderRadius: 12, overflow: 'hidden' }}>
          <MapContainer center={mapCenter} zoom={value ? 13 : 6} style={{ height: '100%' }} attributionControl={false}>
            <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
            <ClickToPlace onPick={([lat, lon]) => onChange({ label: `Pin (${lat.toFixed(4)}, ${lon.toFixed(4)})`, lat, lon })} />
            {value && <Marker position={[value.lat, value.lon]} icon={pinIcon('home')} />}
          </MapContainer>
        </div>
      )}
    </div>
  );
}
