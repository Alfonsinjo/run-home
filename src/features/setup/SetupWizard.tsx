import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Field, Screen, useToast } from '@/components';
import seed from '@/data/seed-2026.json';
import { previewEntries } from '@/domain/importer';
import { formatKm } from '@/domain/progress';
import type { DailyGoalMode, DayEntry, Milestone, Place, RouteData } from '@/domain/types';
import { DEFAULT_SETTINGS } from '@/domain/types';
import { fetchRoute } from '@/services/routing';
import { ensureNotificationPermission } from '@/services/notifications';
import { pickTextFile } from '@/services/files';
import { parseCsv, parseEntriesJson } from '@/domain/importer';
import { useAppStore } from '@/store/useAppStore';
import { MilestoneEditor } from '@/features/settings/MilestoneEditor';
import { PlacePicker } from '@/features/settings/PlacePicker';

const STEPS = ['Willkommen', 'Orte', 'Ziel', 'Meilensteine', 'Erinnerung', 'Daten'] as const;

export function SetupWizard() {
  const navigate = useNavigate();
  const toast = useToast((s) => s.show);
  const store = useAppStore();
  const [step, setStep] = useState(0);
  const [home, setHome] = useState<Place | null>(store.settings.home);
  const [parents, setParents] = useState<Place | null>(store.settings.parents);
  const [route, setRoute] = useState<RouteData>(store.route);
  const [routeBusy, setRouteBusy] = useState(false);
  const [targetKm, setTargetKm] = useState(String(store.settings.targetKm));
  const [startDate, setStartDate] = useState(store.settings.startDate);
  const [deadline, setDeadline] = useState(store.settings.deadline);
  const [mode, setMode] = useState<DailyGoalMode>(store.settings.dailyGoalMode);
  const [customDailyKm, setCustomDailyKm] = useState(String(store.settings.customDailyKm));
  const [milestones, setMilestones] = useState<Milestone[]>(store.settings.manualMilestones);
  const [reminderEnabled, setReminderEnabled] = useState(DEFAULT_SETTINGS.reminderEnabled);
  const [reminderTime, setReminderTime] = useState(DEFAULT_SETTINGS.reminderTime);
  const [imported, setImported] = useState<DayEntry[] | null>(null);

  const targetNum = Number(targetKm.replace(',', '.'));
  const targetValid = Number.isFinite(targetNum) && targetNum > 0;
  const datesValid = startDate < deadline;

  const computeRoute = async () => {
    if (!home || !parents) return;
    setRouteBusy(true);
    const { route: r, usedFallback } = await fetchRoute([home.lat, home.lon], [parents.lat, parents.lon], 'osrm');
    setRoute(r);
    setRouteBusy(false);
    toast(usedFallback ? `Straßenroute nicht verfügbar, Luftlinie: ${formatKm(r.lengthKm)}` : `Route berechnet: ${formatKm(r.lengthKm)}`, usedFallback ? 'error' : 'success');
  };

  const importFile = async () => {
    const f = await pickTextFile('.csv,.json,text/csv,application/json');
    if (!f) return;
    try {
      const list = f.name.toLowerCase().endsWith('.json') ? parseEntriesJson(f.text) : parseCsv(f.text);
      setImported(list);
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };

  const finish = () => {
    store.updateSettings({
      home, parents, targetKm: Math.round(targetNum * 10) / 10, startDate, deadline, dailyGoalMode: mode,
      customDailyKm: Number(customDailyKm.replace(',', '.')) || DEFAULT_SETTINGS.customDailyKm,
      manualMilestones: milestones, reminderEnabled, reminderTime,
    });
    store.setRoute(route);
    if (imported) store.importEntries(imported, 'replace');
    store.completeSetup();
    navigate('/', { replace: true });
  };

  const next = async () => {
    if (step === 1 && home && parents && !route) await computeRoute();
    if (step === 4 && reminderEnabled) await ensureNotificationPermission();
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const canNext = step === 2 ? targetValid && datesValid : true;
  const preview = imported ? previewEntries(imported) : null;

  return (
    <Screen subtitle={`Schritt ${step + 1} von ${STEPS.length}`} title={STEPS[step]}>
      {step === 0 && (
        <div className="card">
          <h2 style={{ fontSize: 22 }}>Lauf nach Hause.</h2>
          <p className="muted">Trag jeden Tag deine Kilometer ein und sieh auf der Karte, wie weit du schon bei deinen Eltern bist. Unterwegs warten Meilensteine und Fun Facts.</p>
          <p className="muted">Zuerst ein paar Einstellungen. Alles lässt sich später ändern.</p>
        </div>
      )}
      {step === 1 && (
        <>
          <PlacePicker label="Dein Zuhause" value={home} onChange={(p) => { setHome(p); setRoute(null); }} />
          <PlacePicker label="Deine Eltern" value={parents} onChange={(p) => { setParents(p); setRoute(null); }} center={home ? [home.lat, home.lon] : undefined} />
          {home && parents && (
            <Button variant="secondary" onClick={computeRoute} disabled={routeBusy}>{routeBusy ? 'Berechne…' : route ? `Route: ${formatKm(route.lengthKm)} (neu berechnen)` : 'Route berechnen'}</Button>
          )}
          {!home || !parents ? <p className="muted">Du kannst die Orte auch später in den Einstellungen setzen.</p> : null}
        </>
      )}
      {step === 2 && (
        <div className="card">
          <Field label="Zieldistanz (km)" error={targetValid ? undefined : 'Bitte eine Zahl > 0'} hint={route ? `Berechnete Route: ${formatKm(route.lengthKm)}` : undefined}>
            <input value={targetKm} onChange={(e) => setTargetKm(e.target.value)} inputMode="decimal" />
          </Field>
          {route && <Button variant="secondary" onClick={() => setTargetKm(String(route.lengthKm).replace('.', ','))}>Routenlänge übernehmen</Button>}
          <div className="grid-2">
            <Field label="Start"><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
            <Field label="Deadline" error={datesValid ? undefined : 'Deadline muss nach dem Start liegen'}><input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></Field>
          </div>
          <Field label="Tagesziel">
            <select value={mode} onChange={(e) => setMode(e.target.value as DailyGoalMode)}>
              <option value="catchup">Aufhol-Tempo (Rest ÷ Resttage)</option>
              <option value="plan">Fester Plan (Ziel ÷ Tage)</option>
              <option value="custom">Eigener Wert</option>
            </select>
          </Field>
          {mode === 'custom' && <Field label="Eigenes Tagesziel (km)"><input value={customDailyKm} onChange={(e) => setCustomDailyKm(e.target.value)} inputMode="decimal" /></Field>}
        </div>
      )}
      {step === 3 && <MilestoneEditor milestones={milestones} onChange={setMilestones} targetKm={targetValid ? targetNum : 510} route={route} />}
      {step === 4 && (
        <div className="card">
          <label className="row between"><span>Tägliche Erinnerung, wenn noch nichts eingetragen ist</span><input type="checkbox" style={{ width: 24, height: 24 }} checked={reminderEnabled} onChange={(e) => setReminderEnabled(e.target.checked)} /></label>
          {reminderEnabled && <Field label="Uhrzeit"><input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} /></Field>}
          <p className="muted">Wie bei Duolingo: Die Erinnerung kommt nur an Tagen ohne Eintrag.</p>
        </div>
      )}
      {step === 5 && (
        <div className="card">
          <p className="muted">Bestehende Einträge übernehmen? Die Laufliste 2026 ist mit Stand 28.09.2026 eingebaut.</p>
          <Button variant="secondary" onClick={() => setImported(seed as DayEntry[])}>Laufliste 2026 übernehmen</Button>
          <Button variant="secondary" onClick={importFile}>Datei importieren (CSV/JSON)</Button>
          {preview && (
            <div className="pill accent">{preview.count} Tage, {preview.from} bis {preview.to}, {formatKm(preview.totalKm)}</div>
          )}
          {imported && <Button variant="ghost" onClick={() => setImported(null)}>Auswahl verwerfen</Button>}
        </div>
      )}
      <div className="row between" style={{ marginTop: 'auto' }}>
        <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>Zurück</Button>
        {step < STEPS.length - 1 ? (
          <Button size="lg" onClick={next} disabled={!canNext || routeBusy}>Weiter</Button>
        ) : (
          <Button size="lg" onClick={finish}>Los geht’s</Button>
        )}
      </div>
    </Screen>
  );
}
