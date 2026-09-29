import { Preferences } from '@capacitor/preferences';
import { SCHEMA_VERSION, type AppState } from '@/domain/types';

const KEY = 'runhome.state';

export async function loadState(): Promise<AppState | null> {
  try {
    const { value } = await Preferences.get({ key: KEY });
    if (!value) return null;
    const parsed = JSON.parse(value) as AppState;
    if (typeof parsed.schemaVersion !== 'number' || parsed.schemaVersion > SCHEMA_VERSION) return null;
    return parsed;
  } catch (err) {
    console.error('[storage] load failed', err);
    return null;
  }
}

export async function saveState(state: AppState): Promise<void> {
  try {
    await Preferences.set({ key: KEY, value: JSON.stringify(state) });
  } catch (err) {
    console.error('[storage] save failed', err);
  }
}

export async function clearState(): Promise<void> {
  await Preferences.remove({ key: KEY });
}
