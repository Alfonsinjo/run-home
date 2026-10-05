import { useMemo, useState } from 'react';
import { MapContainer, Polyline, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { Button, useToast } from '@/components';
import { formatKm } from '@/domain/progress';
import type { LatLon, RouteData } from '@/domain/types';
import { fetchRouteOptions } from '@/services/routing';
import { TILE_ATTRIBUTION, TILE_URL } from './PlacePicker';

type Props = {
  /** Start, Zwischenziele, Ziel in Reihenfolge. */
  points: LatLon[];
  mode: 'osrm' | 'straight';
  current: RouteData;
  onPick(route: NonNullable<RouteData>): void;
};

function sameRoute(a: RouteData, b: NonNullable<RouteData>): boolean {
  return !!a && Math.abs(a.lengthKm - b.lengthKm) < 0.05 && a.coords.length === b.coords.length;
}

/**
 * Bis zu drei Routenvarianten wie bei Google Maps: Karte mit allen Varianten, Liste mit Kilometern,
 * Auswahl per Tipp auf Linie oder „Übernehmen". Die gewählte Variante wird als Route gespeichert.
 */
export function RouteVariants({ points, mode, current, onPick }: Props) {
  const toast = useToast((s) => s.show);
  const [options, setOptions] = useState<NonNullable<RouteData>[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(0);

  const load = async () => {
    setBusy(true);
    try {
      const { options: list, profile, usedFallback } = await fetchRouteOptions(points, mode, 3);
      setOptions(list);
      const active = list.findIndex((o) => sameRoute(current, o));
      setSelected(active >= 0 ? active : 0);
      if (usedFallback) toast(profile === 'car' ? 'Fußrouting nicht erreichbar, Autorouten angezeigt.' : 'Routing nicht erreichbar, Luftlinie angezeigt.', 'error');
      else if (list.length === 1) toast('Für diese Strecke gibt es nur eine Variante.');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const bounds = useMemo<L.LatLngBoundsExpression | null>(() => {
    const pts = options?.flatMap((o) => o.coords) ?? [];
    return pts.length >= 2 ? L.latLngBounds(pts) : null;
  }, [options]);

  const shortest = options ? Math.min(...options.map((o) => o.lengthKm)) : 0;

  return (
    <div className="route-variants">
      {!options && (
        <Button variant="secondary" onClick={load} disabled={busy || points.length < 2}>{busy ? 'Suche Varianten…' : 'Routenvarianten anzeigen'}</Button>
      )}
      {options && bounds && (
        <div className="route-variants-map">
          <MapContainer bounds={bounds} boundsOptions={{ padding: [16, 16] }} style={{ height: '100%' }} attributionControl={false} zoomControl={false}>
            <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
            {options.map((o, i) => i !== selected && (
              <Polyline key={`bg-${i}`} positions={o.coords} pathOptions={{ color: '#9A9AA0', weight: 5, opacity: 0.8 }} eventHandlers={{ click: () => setSelected(i) }} />
            ))}
            <Polyline key={`sel-${selected}`} positions={options[selected].coords} pathOptions={{ color: '#D4FF3A', weight: 6 }} />
          </MapContainer>
        </div>
      )}
      {options && (
        <div className="list" role="radiogroup" aria-label="Routenvarianten">
          {options.map((o, i) => {
            const active = sameRoute(current, o);
            const isSel = i === selected;
            return (
              <div key={i} className={`list-item route-variant ${isSel ? 'selected' : ''}`} role="radio" aria-checked={isSel} tabIndex={0}
                onClick={() => setSelected(i)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(i); } }}>
                <div>
                  <div className="title">Variante {i + 1}{o.lengthKm === shortest ? ' · kürzeste' : ''}{active ? ' · aktiv' : ''}</div>
                  <div className="muted small">{o.waypointKm && o.waypointKm.length ? `Zwischenziele bei ${o.waypointKm.map((k) => formatKm(k)).join(', ')}` : 'ohne Zwischenziele'}</div>
                </div>
                <div className="row">
                  <span className="km">{formatKm(o.lengthKm)}</span>
                  {!active && <Button variant={isSel ? 'primary' : 'ghost'} onClick={(e) => { e.stopPropagation(); onPick({ ...o, variant: i + 1 }); }}>Übernehmen</Button>}
                </div>
              </div>
            );
          })}
          <Button variant="ghost" onClick={load} disabled={busy}>{busy ? 'Suche Varianten…' : 'Varianten neu laden'}</Button>
        </div>
      )}
    </div>
  );
}
