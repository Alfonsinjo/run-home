import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { formatKm } from '@/domain/progress';
import { pointAtKm, progressToRouteKm, splitAtKm } from '@/domain/route';
import type { LatLon, Milestone, Place, RouteData } from '@/domain/types';
import { TILE_ATTRIBUTION, TILE_URL } from '@/features/settings/PlacePicker';
import { milestoneIcon, pinIcon, pulseIcon } from './mapIcons';

type Props = {
  route: RouteData; home: Place | null; parents: Place | null; totalKm: number; targetKm: number;
  milestones: Milestone[]; achieved: Record<string, string>;
  /** Nächster Meilenstein: bekommt immer einen Pin. */
  nextId?: string;
  /** Wenn gesetzt, erscheint unten links der Zusammenfassungs-Chip. */
  remainingKm?: number;
  className?: string;
};

/** Unten mehr Rand, damit Chip und Verlauf keine Pins verdecken. */
const FIT_OPTS: L.FitBoundsOptions = { paddingTopLeft: [24, 48], paddingBottomRight: [24, 100] };
/** Auf der Karte nur die großen Marken; die 50-km-Schritte bleiben in Balken und Zeitstrahl. */
const MAP_PERCENT_IDS = new Set(['auto-pct-25', 'auto-pct-50', 'auto-pct-75', 'auto-pct-100']);

function FitOnce({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, FIT_OPTS);
  }, [map, bounds]);
  return null;
}

function FitButton({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap();
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (ref.current) L.DomEvent.disableClickPropagation(ref.current);
  }, []);
  return (
    <button ref={ref} type="button" className="btn btn-secondary btn-icon map-fit" aria-label="Zentrieren" title="Zentrieren" onClick={() => bounds && map.fitBounds(bounds, FIT_OPTS)}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="6" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>
    </button>
  );
}

export function RouteMap({ route, home, parents, totalKm, targetKm, milestones, achieved, nextId, remainingKm, className = 'map-hero' }: Props) {
  const coords = route?.coords ?? [];
  const lengthKm = route?.lengthKm ?? 0;
  const routeKm = progressToRouteKm(totalKm, targetKm, lengthKm);
  const { done, todo } = useMemo(() => splitAtKm(coords, routeKm), [coords, routeKm]);
  const position = useMemo<LatLon | null>(() => (coords.length ? pointAtKm(coords, routeKm) : null), [coords, routeKm]);
  const milestonePositions = useMemo(
    () => milestones
      .filter((m) => m.kind !== 'auto' || MAP_PERCENT_IDS.has(m.id) || m.id === nextId)
      .map((m) => ({ m, at: pointAtKm(coords, progressToRouteKm(m.km, targetKm, lengthKm)) })),
    [coords, milestones, targetKm, lengthKm, nextId],
  );
  const bounds = useMemo<L.LatLngBoundsExpression | null>(() => {
    const pts: LatLon[] = [...coords];
    if (home) pts.push([home.lat, home.lon]);
    if (parents) pts.push([parents.lat, parents.lon]);
    return pts.length >= 2 ? L.latLngBounds(pts) : null;
  }, [coords, home, parents]);

  if (!home || !parents) {
    return (
      <div className={`${className} empty`}>
        <p className="muted" style={{ textAlign: 'center', padding: 24, maxWidth: '34ch' }}>Lege Zuhause und Eltern in den Einstellungen fest, dann erscheint hier deine Route.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <MapContainer center={[home.lat, home.lon]} zoom={7} style={{ height: '100%', width: '100%' }} zoomControl={false} zoomSnap={0.25} className="map-full">
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <FitOnce bounds={bounds} />
        <FitButton bounds={bounds} />
        {todo.length > 1 && <Polyline positions={todo} pathOptions={{ color: '#6A6A72', weight: 4, opacity: 0.9 }} />}
        {done.length > 1 && <Polyline positions={done} pathOptions={{ color: '#D4FF3A', weight: 5 }} />}
        {milestonePositions.map(({ m, at }) => {
          const isDone = m.id in achieved;
          return (
            <Marker key={m.id} position={at} icon={milestoneIcon(isDone, m.id === nextId, m.kind)}>
              <Popup><b>{m.title}</b><br />{formatKm(m.km)}{isDone ? ` · erreicht am ${achieved[m.id]}` : ` · noch ${formatKm(Math.max(0, m.km - totalKm))}`}</Popup>
            </Marker>
          );
        })}
        <Marker position={[home.lat, home.lon]} icon={pinIcon('home')}><Popup>Start: {home.label}</Popup></Marker>
        <Marker position={[parents.lat, parents.lon]} icon={pinIcon('parents')}><Popup>Ziel: {parents.label}</Popup></Marker>
        {position && <Marker position={position} icon={pulseIcon} zIndexOffset={1000}><Popup>Du bist hier: {formatKm(totalKm)}</Popup></Marker>}
      </MapContainer>
      {remainingKm !== undefined && (
        <div className="map-chip" aria-label={`${formatKm(totalKm)} gelaufen, noch ${formatKm(remainingKm)}`}>
          <b>{formatKm(totalKm)}</b>
          <span>noch {formatKm(remainingKm)}</span>
        </div>
      )}
    </div>
  );
}
