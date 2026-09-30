import { useEffect, useState } from 'react';
import { App as CapApp } from '@capacitor/app';
import { useToast } from '@/components';
import { scheduleReminders } from '@/services/notifications';
import { isNative } from '@/services/platform';
import { checkForUpdate, initUpdater } from '@/services/updater';
import { useAppStore } from '@/store/useAppStore';
import { useDerived } from '@/store/selectors';

/** Hält Erinnerungen mit dem Datenstand synchron und prüft beim Start auf OTA-Updates. Rendert nichts. */
export function Bootstrap() {
  const setupDone = useAppStore((s) => s.setupDone);
  const settings = useAppStore((s) => s.settings);
  const d = useDerived();
  const toast = useToast((s) => s.show);
  const [resumeTick, setResumeTick] = useState(0);

  useEffect(() => {
    void initUpdater();
    if (isNative()) {
      void checkForUpdate().then((s) => { if (s.state === 'downloaded') toast(s.message); });
      const sub = CapApp.addListener('resume', () => setResumeTick((t) => t + 1));
      return () => { void sub.then((h) => h.remove()); };
    }
    const onVis = () => document.visibilityState === 'visible' && setResumeTick((t) => t + 1);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [toast]);

  useEffect(() => {
    if (!setupDone) return;
    void scheduleReminders(settings, { today: d.today, todayHasEntry: d.todayKm > 0, dailyGoalKm: d.dailyGoal, remainingKm: d.progress.remainingKm });
  }, [setupDone, resumeTick, d.today, d.todayKm, d.dailyGoal, d.progress.remainingKm, settings]);

  return null;
}
