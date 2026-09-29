import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { formatKm } from '@/domain/progress';
import { pointAtKm, progressToRouteKm, splitAtKm } from '@/domain/route';
import type { LatLon, Milestone, Place, RouteData } from '@/domain/types';
import { TILE_ATTRIBUTION, TILE_URL } from '@/features/settings/PlacePicker';
import { pinIcon, pulseIcon } from './mapIcons';

type Props = { route: RouteData; home: Place | null; parents: Place | null; totalKm: number; targetKm: number; milestones: Milestone[]; achieved: Record<string, string>; className?: string };

function FitOnce({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [24, 24] });
  }, [map, bounds]);
  return null;
}

export function RouteMap({ route, home, parents, totalKm, targetKm, milestones, achieved, className = 'map-hero' }: Props) {
  const coords = route?.coords ?? [];
  const lengthKm = route?.lengthKm ?? 0;
  const routeKm = progressToRouteKm(totalKm, targetKm, lengthKm);
  const { done, todo } = useMemo(() => splitAtKm(coords, routeKm), [coords, routeKm]);
  const position = useMemo<LatLon | null>(() => (coords.length ? pointAtKm(coords, routeKm) : null), [coords, routeKm]);
  const milestonePositions = useMemo(
    () => milestones.map((m) => ({ m, at: pointAtKm(coords, progressToRouteKm(m.km, targetKm, lengthKm)) })),
    [coords, milestones, targetKm, lengthKm],
  );
  const bounds = useMemo<L.LatLngBoundsExpression | null>(() => {
    const pts: LatLon[] = [...coords];
    if (home) pts.push([home.lat, home.lon]);
    if (parents) pts.push([parents.lat, parents.lon]);
    return pts.length >= 2 ? L.latLngBounds(pts) : null;
  }, [coords, home, parents]);

  if (!home || !parents) {
    return (
      <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
        <p className="muted" style={{ textAlign: 'center', padding: 24 }}>Lege Zuhause und Eltern in den Einstellungen fest, dann erscheint hier deine Route.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <MapContainer center={[home.lat, home.lon]} zoom={7} style={{ height: '100%', width: '100%' }} zoomControl={false} className="map-full">
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <FitOnce bounds={bounds} />
        {todo.length > 1 && <Polyline positions={todo} pathOptions={{ color: '#5A5A60', weight: 5, opacity: 0.9 }} />}
        {done.length > 1 && <Polyline positions={done} pathOptions={{ color: '#D4FF3A', weight: 6 }} />}
        {milestonePositions.map(({ m, at }) => {
          const isDone = m.id in achieved;
          return (
            <Marker key={m.id} position={at} icon={pinIcon('milestone', isDone)}>
              <Popup><b>{m.title}</b><br />{formatKm(m.km)}{isDone ? ` · erreicht am ${achieved[m.id]}` : ` · noch ${formatKm(Math.max(0, m.km - totalKm))}`}</Popup>
            </Marker>
          );
        })}
        <Marker position={[home.lat, home.lon]} icon={pinIcon('home')}><Popup>Start: {home.label}</Popup></Marker>
        <Marker position={[parents.lat, parents.lon]} icon={pinIcon('parents')}><Popup>Ziel: {parents.label}</Popup></Marker>
        {position && <Marker position={position} icon={pulseIcon} zIndexOffset={1000}><Popup>Du bist hier: {formatKm(totalKm)}</Popup></Marker>}
      </MapContainer>
    </div>
  );
}
