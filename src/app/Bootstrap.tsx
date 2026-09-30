import { useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { useToast } from '@/components';
import { cancelAllReminders, scheduleReminders } from '@/services/notifications';
import { isNative } from '@/services/platform';
import { checkForUpdate, initUpdater } from '@/services/updater';
import { useAppStore } from '@/store/useAppStore';
import { useDerived } from '@/store/selectors';

/** Millisekunden bis 00:00:05 des nächsten Tages (lokale Zeit). */
function msUntilNextMidnight(now = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
  return next.getTime() - now.getTime();
}

/** Hält „heute" und die Erinnerungen mit dem Datenstand synchron und prüft beim Start auf OTA-Updates. Rendert nichts. */
export function Bootstrap() {
  const setupDone = useAppStore((s) => s.setupDone);
  const settings = useAppStore((s) => s.settings);
  const refreshToday = useAppStore((s) => s.refreshToday);
  const d = useDerived();
  const toast = useToast((s) => s.show);

  useEffect(() => {
    void initUpdater();
    if (isNative()) void checkForUpdate().then((s) => { if (s.state === 'downloaded') toast(s.message); });
  }, [toast]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      refreshToday();
      if (timer) clearTimeout(timer);
      timer = setTimeout(tick, msUntilNextMidnight());
    };
    tick();
    const onVis = () => { if (document.visibilityState === 'visible') tick(); };
    document.addEventListener('visibilitychange', onVis);
    const sub = isNative() ? CapApp.addListener('resume', tick) : null;
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVis);
      void sub?.then((h) => h.remove());
    };
  }, [refreshToday]);

  useEffect(() => {
    if (!setupDone) { cancelAllReminders().catch((e) => console.warn('[bootstrap] Erinnerungen abbrechen fehlgeschlagen:', e)); return; }
    void scheduleReminders(settings, { today: d.today, todayHasEntry: d.todayKm > 0, dailyGoalKm: d.dailyGoal, remainingKm: d.progress.remainingKm });
  }, [setupDone, d.today, d.todayKm, d.dailyGoal, d.progress.remainingKm, settings]);

  return null;
}
