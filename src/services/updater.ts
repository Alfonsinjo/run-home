import { App } from '@capacitor/app';
import { CapacitorHttp } from '@capacitor/core';
import { CapacitorUpdater, type BundleInfo } from '@capgo/capacitor-updater';
import { compareSemver } from '@/domain/semver';
import { isNative } from './platform';

export type UpdateStatus = { state: 'unsupported' | 'checking' | 'up-to-date' | 'downloaded' | 'error'; message: string; latestVersion?: string };

export const LATEST_JSON_URL = 'https://github.com/Alfonsinjo/run-home/releases/latest/download/latest.json';

type LatestJson = { version: string; url: string; minNativeVersion?: string; notes?: string };

let downloaded: BundleInfo | null = null;

export function currentBundleVersion(): string {
  return __APP_VERSION__;
}

/**
 * latest.json laden. In der App über den nativen HTTP-Client von Capacitor: GitHub beantwortet die
 * Release-Weiterleitung ohne CORS-Header, ein WebView-`fetch` scheitert deshalb mit „Failed to fetch".
 */
async function loadLatest(): Promise<LatestJson> {
  const url = `${LATEST_JSON_URL}?t=${Date.now()}`;
  if (isNative()) {
    const res = await CapacitorHttp.get({ url, responseType: 'json', connectTimeout: 15000, readTimeout: 15000 });
    if (res.status < 200 || res.status >= 300) throw new Error(`HTTP ${res.status}`);
    const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
    if (!data || typeof data.version !== 'string' || typeof data.url !== 'string') throw new Error('latest.json unvollständig');
    return data as LatestJson;
  }
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as LatestJson;
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
    const latest = await loadLatest();
    const current = currentBundleVersion();
    if (compareSemver(latest.version, current) <= 0) return { state: 'up-to-date', message: `Aktuell (Version ${current}).`, latestVersion: latest.version };
    const { native } = await CapacitorUpdater.current();
    if (latest.minNativeVersion && compareSemver(native, latest.minNativeVersion) < 0) {
      return { state: 'error', message: `Version ${latest.version} braucht eine neue APK (installiert: ${native}).`, latestVersion: latest.version };
    }
    if (downloaded && downloaded.version === latest.version) {
      return { state: 'downloaded', message: `Version ${latest.version} ist geladen. Jetzt neu starten, um sie zu aktivieren.`, latestVersion: latest.version };
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
