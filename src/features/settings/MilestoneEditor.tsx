import { useState } from 'react';
import { MapContainer, Polyline, TileLayer, useMapEvents } from 'react-leaflet';
import { Button, Field } from '@/components';
import { kmAtNearestPoint } from '@/domain/route';
import type { LatLon, Milestone, RouteData } from '@/domain/types';
import { formatKm } from '@/domain/progress';
import { TILE_ATTRIBUTION, TILE_URL } from './PlacePicker';

function RouteClick({ coords, onKm }: { coords: LatLon[]; onKm(km: number): void }) {
  useMapEvents({ click: (e) => onKm(Math.round(kmAtNearestPoint(coords, [e.latlng.lat, e.latlng.lng]) * 10) / 10) });
  return null;
}

export function MilestoneEditor({ milestones, onChange, targetKm, route }: { milestones: Milestone[]; onChange(list: Milestone[]): void; targetKm: number; route: RouteData }) {
  const [title, setTitle] = useState('');
  const [km, setKm] = useState('');
  const [showMap, setShowMap] = useState(false);
  const kmNum = Number(km.replace(',', '.'));
  const valid = title.trim().length > 0 && Number.isFinite(kmNum) && kmNum > 0 && kmNum < targetKm;
  // Wenn die Route länger/kürzer als das Ziel ist, wird die Karten-km proportional auf Ziel-km umgerechnet.
  const routeToTarget = (routeKm: number) => (route && route.lengthKm > 0 ? Math.round((routeKm / route.lengthKm) * targetKm * 10) / 10 : routeKm);

  const add = () => {
    if (!valid) return;
    onChange([...milestones, { id: `manual-${Date.now()}`, kind: 'manual' as const, km: Math.round(kmNum * 10) / 10, title: title.trim() }].sort((a, b) => a.km - b.km));
    setTitle('');
    setKm('');
  };

  return (
    <div className="card">
      <div className="card-head"><h2>Eigene Meilensteine</h2></div>
      {milestones.length === 0 && <p className="muted">Noch keine. Zum Beispiel eine Stadt auf dem Weg.</p>}
      <div className="list">
        {milestones.map((m) => (
          <div key={m.id} className="list-item">
            <div><div style={{ fontWeight: 700 }}>{m.title}</div><div className="muted num">{formatKm(m.km)}</div></div>
            <Button variant="ghost" onClick={() => onChange(milestones.filter((x) => x.id !== m.id))}>Löschen</Button>
          </div>
        ))}
      </div>
      <div className="grid-2">
        <Field label="Name"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Würzburg" /></Field>
        <Field label="Bei km" hint={`1 bis ${targetKm - 1}`}><input value={km} onChange={(e) => setKm(e.target.value)} inputMode="decimal" placeholder="120" /></Field>
      </div>
      {route && (
        <Button variant="secondary" onClick={() => setShowMap((s) => !s)}>{showMap ? 'Karte ausblenden' : 'Position auf der Route antippen'}</Button>
      )}
      {showMap && route && (
        <div style={{ height: 240, borderRadius: 12, overflow: 'hidden' }}>
          <MapContainer bounds={route.coords} style={{ height: '100%' }} attributionControl={false}>
            <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
            <Polyline positions={route.coords} pathOptions={{ color: '#9A9AA0', weight: 4 }} />
            <RouteClick coords={route.coords} onKm={(k) => setKm(String(routeToTarget(k)).replace('.', ','))} />
          </MapContainer>
        </div>
      )}
      <Button onClick={add} disabled={!valid}>Meilenstein hinzufügen</Button>
    </div>
  );
}
