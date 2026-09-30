import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ToastHost } from '@/components';
import { Celebration } from '@/features/entry/Celebration';
import { useAppStore } from '@/store/useAppStore';
import { Bootstrap } from './Bootstrap';
import { AppRoutes } from './routes';
import './theme.css';
import 'leaflet/dist/leaflet.css';

export function App() {
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  if (!hydrated) return <div className="screen"><p className="muted">Lade…</p></div>;
  return (
    <BrowserRouter>
      <Bootstrap />
      <AppRoutes />
      <Celebration />
      <ToastHost />
    </BrowserRouter>
  );
}
