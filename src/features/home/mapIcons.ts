import L from 'leaflet';

export const pulseIcon = L.divIcon({ className: '', html: '<div class="pulse-marker"></div>', iconSize: [18, 18], iconAnchor: [9, 9] });

/** Start- und Ziel-Pin (22 px, Tropfenform). */
export function pinIcon(kind: 'home' | 'parents' | 'milestone', done = false): L.DivIcon {
  if (kind === 'milestone') return milestoneIcon(done, false, 'auto');
  const glyph = kind === 'home' ? '🏃' : '🏠';
  return L.divIcon({ className: '', html: `<div class="pin"><span>${glyph}</span></div>`, iconSize: [22, 22], iconAnchor: [11, 22], popupAnchor: [0, -22] });
}

/** Meilenstein-Punkt (22 px, rund). Erreicht: Volt-Rand; nächster: weiß gefüllt. */
export function milestoneIcon(done: boolean, next: boolean, kind: 'auto' | 'manual' | 'waypoint'): L.DivIcon {
  const glyph = kind === 'waypoint' ? '⚑' : kind === 'manual' ? '◆' : done ? '★' : '☆';
  const cls = ['mpin', done ? 'done' : '', next ? 'next' : ''].filter(Boolean).join(' ');
  return L.divIcon({ className: '', html: `<div class="${cls}">${glyph}</div>`, iconSize: [22, 22], iconAnchor: [11, 11], popupAnchor: [0, -12] });
}
