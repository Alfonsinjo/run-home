import { useState } from 'react';
import { Button, Field } from '@/components';
import type { LatLon, Place, Waypoint } from '@/domain/types';
import { PlacePicker } from './PlacePicker';

type Props = {
  waypoints: Waypoint[];
  onChange(list: Waypoint[]): void;
  home: Place | null;
  parents: Place | null;
};

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

/**
 * Zwischenziele: Orte, über die die Strecke führt. Reihenfolge = Reihenfolge auf der Route.
 * Beim Einfügen wählt man, nach welchem Punkt das neue Ziel kommt.
 */
export function WaypointEditor({ waypoints, onChange, home, parents }: Props) {
  const [pending, setPending] = useState<Place | null>(null);
  const [name, setName] = useState('');
  // Index in waypoints, vor dem eingefügt wird; waypoints.length = direkt vor den Eltern.
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const position = insertAt ?? waypoints.length;
  const center: LatLon | undefined = home ? [home.lat, home.lon] : undefined;

  const add = () => {
    if (!pending) return;
    const label = name.trim() || pending.label;
    const wp: Waypoint = { id: `wp-${Date.now()}`, label, lat: pending.lat, lon: pending.lon };
    const list = [...waypoints];
    list.splice(position, 0, wp);
    onChange(list);
    setPending(null);
    setName('');
    setInsertAt(null);
  };

  const rename = (id: string) => {
    const label = editName.trim();
    if (label) onChange(waypoints.map((w) => (w.id === id ? { ...w, label } : w)));
    setEditing(null);
  };

  const stops = [
    { key: 'home', label: home?.label ?? 'Zuhause', fixed: true },
    ...waypoints.map((w) => ({ key: w.id, label: w.label, fixed: false })),
    { key: 'parents', label: parents?.label ?? 'Eltern', fixed: true },
  ];

  return (
    <div className="card">
      <div className="card-head"><h2>Zwischenziele</h2>{waypoints.length > 0 && <span className="card-meta">{waypoints.length}</span>}</div>
      <p className="muted small">Orte, über die deine Strecke führt. Die Route wird durch jedes Zwischenziel geführt, und jedes wird ein Meilenstein.</p>
      <div className="list">
        {stops.map((s, i) => {
          const wi = i - 1; // Index in waypoints
          const isEditing = !s.fixed && editing === s.key;
          return (
            <div key={s.key} className="list-item">
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="label">{i === 0 ? 'Start' : i === stops.length - 1 ? 'Ziel' : `Zwischenziel ${i}`}</div>
                {isEditing ? (
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} onBlur={() => rename(s.key)} onKeyDown={(e) => { if (e.key === 'Enter') rename(s.key); }} autoFocus />
                ) : (
                  <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={() => { if (!s.fixed) { setEditing(s.key); setEditName(s.label); } }}>{s.label}</div>
                )}
              </div>
              {!s.fixed && (
                <div className="list-actions">
                  <Button variant="ghost" aria-label="Nach vorn" disabled={wi === 0} onClick={() => onChange(move(waypoints, wi, wi - 1))}>↑</Button>
                  <Button variant="ghost" aria-label="Nach hinten" disabled={wi === waypoints.length - 1} onClick={() => onChange(move(waypoints, wi, wi + 1))}>↓</Button>
                  <Button variant="ghost" onClick={() => onChange(waypoints.filter((w) => w.id !== s.key))}>Löschen</Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {waypoints.length > 0 && <p className="muted small">Tippe auf einen Namen, um ihn zu ändern.</p>}

      <PlacePicker bare label="Neues Zwischenziel" value={pending} onChange={setPending} center={center} hint="Ort suchen oder auf der Karte tippen." />
      {pending && (
        <>
          <div className="grid-2">
            <Field label="Name (optional)"><input value={name} onChange={(e) => setName(e.target.value)} placeholder={pending.label.split(',')[0]} /></Field>
            <Field label="Einfügen nach">
              <select value={position} onChange={(e) => setInsertAt(Number(e.target.value))}>
                <option value={0}>{home?.label.split(',')[0] ?? 'Zuhause'} (Start)</option>
                {waypoints.map((w, i) => <option key={w.id} value={i + 1}>{w.label.split(',')[0]}</option>)}
              </select>
            </Field>
          </div>
          <Button onClick={add}>Zwischenziel einfügen</Button>
        </>
      )}
    </div>
  );
}
