import { App } from '@capacitor/app';
import { CapacitorUpdater, type BundleInfo } from '@capgo/capacitor-updater';
import { compareSemver } from '@/domain/semver';
import { isNative } from './platform';

export type UpdateStatus = { state: 'unsupported' | 'checking' | 'up-to-date' | 'downloaded' | 'error'; message: string; latestVersion?: string };

// OWNER/REPO werden in Task 21 nach dem Anlegen des GitHub-Repos gesetzt.
export const LATEST_JSON_URL = 'https://github.com/gitbydbcconsulting/run-home-releases/releases/latest/download/latest.json';

type LatestJson = { version: string; url: string; minNativeVersion?: string; notes?: string };

let downloaded: BundleInfo | null = null;

export function currentBundleVersion(): string {
  return __APP_VERSION__;
}

export async function initUpdater(): Promise<void> {
  if (!isNative()) return;
  try {
    await CapacitorUpdater.notifyAppReady();
  } catch (err) {
    console.warn('[updater] notifyAppReady failed', err);
  }
  App.addListener('appStateChange', (state) => {
    if (!state.isActive && downloaded) {
      const bundle = downloaded;
      downloaded = null;
      void CapacitorUpdater.set(bundle).catch((e) => console.warn('[updater] set failed', e));
    }
  });
}

export async function checkForUpdate(): Promise<UpdateStatus> {
  if (!isNative()) return { state: 'unsupported', message: 'OTA-Updates gibt es nur in der Android-App.' };
  try {
    const res = await fetch(`${LATEST_JSON_URL}?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const latest = (await res.json()) as LatestJson;
    const current = currentBundleVersion();
    if (compareSemver(latest.version, current) <= 0) return { state: 'up-to-date', message: `Aktuell (Version ${current}).`, latestVersion: latest.version };
    const { native } = await CapacitorUpdater.current();
    if (latest.minNativeVersion && compareSemver(native, latest.minNativeVersion) < 0) {
      return { state: 'error', message: `Version ${latest.version} braucht eine neue APK (installiert: ${native}).`, latestVersion: latest.version };
    }
    downloaded = await CapacitorUpdater.download({ version: latest.version, url: latest.url });
    return { state: 'downloaded', message: `Version ${latest.version} geladen. Wird beim nächsten Start aktiv.`, latestVersion: latest.version };
  } catch (err) {
    return { state: 'error', message: `Update-Prüfung fehlgeschlagen: ${(err as Error).message}` };
  }
}

export async function applyDownloadedUpdate(): Promise<void> {
  if (!downloaded) return;
  const bundle = downloaded;
  downloaded = null;
  await CapacitorUpdater.set(bundle);
}
