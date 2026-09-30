import { useEffect, useState } from 'react';
import { Button, Card, Field, Screen, useToast } from '@/components';
import { isValidDateKey } from '@/domain/dates';
import { formatKm } from '@/domain/progress';
import type { DailyGoalMode, Place } from '@/domain/types';
import { fetchRoute } from '@/services/routing';
import { useAppStore } from '@/store/useAppStore';
import { DataSection } from './DataSection';
import { MilestoneEditor } from './MilestoneEditor';
import { PlacePicker } from './PlacePicker';
import { ReminderSection } from './ReminderSection';
import { UpdateSection } from './UpdateSection';

export function SettingsScreen() {
  const settings = useAppStore((s) => s.settings);
  const route = useAppStore((s) => s.route);
  const update = useAppStore((s) => s.updateSettings);
  const setRoute = useAppStore((s) => s.setRoute);
  const toast = useToast((s) => s.show);
  const [busy, setBusy] = useState(false);
  const [targetKm, setTargetKm] = useState(String(settings.targetKm).replace('.', ','));
  const [customKm, setCustomKm] = useState(String(settings.customDailyKm).replace('.', ','));

  useEffect(() => { setTargetKm(String(settings.targetKm).replace('.', ',')); }, [settings.targetKm]);
  useEffect(() => { setCustomKm(String(settings.customDailyKm).replace('.', ',')); }, [settings.customDailyKm]);

  const recompute = async (mode = settings.routeMode, home = settings.home, parents = settings.parents) => {
    if (!home || !parents) { toast('Bitte zuerst beide Orte setzen.', 'error'); return; }
    setBusy(true);
    const { route: r, usedFallback } = await fetchRoute([home.lat, home.lon], [parents.lat, parents.lon], mode);
    setRoute(r);
    setBusy(false);
    toast(usedFallback ? `Straßenroute nicht verfügbar, Luftlinie: ${formatKm(r.lengthKm)}` : `Route: ${formatKm(r.lengthKm)}`, usedFallback ? 'error' : 'success');
  };

  // Ein neuer Ort macht die alte Route ungültig; sind beide Orte gesetzt, wird sofort neu berechnet.
  const changePlace = (which: 'home' | 'parents', p: Place | null) => {
    update({ [which]: p });
    setRoute(null);
    const home = which === 'home' ? p : settings.home;
    const parents = which === 'parents' ? p : settings.parents;
    if (home && parents) void recompute(settings.routeMode, home, parents);
  };

  const commitDate = (which: 'startDate' | 'deadline', value: string) => {
    if (!isValidDateKey(value)) return;
    const start = which === 'startDate' ? value : settings.startDate;
    const end = which === 'deadline' ? value : settings.deadline;
    if (end <= start) { toast('Deadline muss nach dem Start liegen', 'error'); return; }
    update({ [which]: value });
  };

  const commitTarget = () => {
    const n = Number(targetKm.replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) { toast('Zieldistanz muss größer als 0 sein.', 'error'); return; }
    update({ targetKm: Math.round(n * 10) / 10 });
    toast('Zieldistanz gespeichert.', 'success');
  };
  const commitCustom = () => {
    const n = Number(customKm.replace(',', '.'));
    if (Number.isFinite(n) && n >= 0) update({ customDailyKm: Math.round(n * 10) / 10 });
  };

  return (
    <Screen title="Einstellungen">
      <PlacePicker label="Dein Zuhause" value={settings.home} onChange={(p) => changePlace('home', p)} />
      <PlacePicker label="Deine Eltern" value={settings.parents} onChange={(p) => changePlace('parents', p)} center={settings.home ? [settings.home.lat, settings.home.lon] : undefined} />
      <Card title="Route" action={route ? <span className="pill num">{formatKm(route.lengthKm)}</span> : undefined}>
        <Field label="Art">
          <select value={settings.routeMode} onChange={(e) => { const m = e.target.value as 'osrm' | 'straight'; update({ routeMode: m }); void recompute(m); }}>
            <option value="osrm">Straßenroute (OSRM)</option>
            <option value="straight">Luftlinie</option>
          </select>
        </Field>
        <Button variant="secondary" onClick={() => recompute()} disabled={busy}>{busy ? 'Berechne…' : 'Route neu berechnen'}</Button>
        {route && <Button variant="ghost" onClick={() => { setTargetKm(String(route.lengthKm).replace('.', ',')); update({ targetKm: route.lengthKm }); }}>Routenlänge als Ziel übernehmen</Button>}
      </Card>
      <Card title="Ziel">
        <Field label="Zieldistanz (km)"><input value={targetKm} onChange={(e) => setTargetKm(e.target.value)} onBlur={commitTarget} inputMode="decimal" /></Field>
        <div className="grid-2">
          <Field label="Start"><input type="date" value={settings.startDate} max={settings.deadline} onChange={(e) => commitDate('startDate', e.target.value)} /></Field>
          <Field label="Deadline"><input type="date" value={settings.deadline} min={settings.startDate} onChange={(e) => commitDate('deadline', e.target.value)} /></Field>
        </div>
        <Field label="Tagesziel">
          <select value={settings.dailyGoalMode} onChange={(e) => update({ dailyGoalMode: e.target.value as DailyGoalMode })}>
            <option value="catchup">Aufhol-Tempo (Rest ÷ Resttage)</option>
            <option value="plan">Fester Plan (Ziel ÷ Tage)</option>
            <option value="custom">Eigener Wert</option>
          </select>
        </Field>
        {settings.dailyGoalMode === 'custom' && <Field label="Eigenes Tagesziel (km)"><input value={customKm} onChange={(e) => setCustomKm(e.target.value)} onBlur={commitCustom} inputMode="decimal" /></Field>}
      </Card>
      <MilestoneEditor milestones={settings.manualMilestones} onChange={(list) => update({ manualMilestones: list })} targetKm={settings.targetKm} route={route} />
      <ReminderSection />
      <DataSection />
      <UpdateSection />
      <p className="muted" style={{ textAlign: 'center', fontSize: 12 }}>Run Home · Karte © OpenStreetMap-Mitwirkende, Routing OSRM, Suche Nominatim</p>
    </Screen>
  );
}
