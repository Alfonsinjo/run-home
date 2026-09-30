import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Start', d: 'M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
  { to: '/history', label: 'Verlauf', d: 'M4 19h16M6 16V9m4 7V5m4 11v-4m4 4V7' },
  { to: '/milestones', label: 'Ziele', d: 'M6 3v18M6 4h11l-2 4 2 4H6' },
  { to: '/settings', label: 'Mehr', d: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8 4-2 .6a6 6 0 0 1-.5 1.3l1 1.8-1.4 1.4-1.8-1a6 6 0 0 1-1.3.5L13.4 20h-2.8l-.6-2a6 6 0 0 1-1.3-.5l-1.8 1-1.4-1.4 1-1.8A6 6 0 0 1 6 13.9L4 13.4v-2.8l2-.6a6 6 0 0 1 .5-1.3l-1-1.8L6.9 5.5l1.8 1A6 6 0 0 1 10 6l.6-2h2.8l.6 2a6 6 0 0 1 1.3.5l1.8-1 1.4 1.4-1 1.8a6 6 0 0 1 .5 1.3z' },
];

export function TabBar() {
  return (
    <nav className="tabbar" aria-label="Hauptnavigation">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.to === '/'} className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={t.d} /></svg>
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
