import L from 'leaflet';

export const pulseIcon = L.divIcon({ className: '', html: '<div class="pulse-marker"></div>', iconSize: [18, 18], iconAnchor: [9, 9] });

export function pinIcon(kind: 'home' | 'parents' | 'milestone', done = false): L.DivIcon {
  const glyph = kind === 'home' ? '🏃' : kind === 'parents' ? '🏠' : done ? '★' : '☆';
  const cls = kind === 'milestone' ? (done ? 'pin done' : 'pin') : 'pin home';
  return L.divIcon({ className: '', html: `<div class="${cls}"><span>${glyph}</span></div>`, iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -28] });
}
