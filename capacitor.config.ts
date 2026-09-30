/// <reference types="@capgo/capacitor-updater" />
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.stabel.runhome',
  appName: 'Run Home',
  webDir: 'dist',
  android: { allowMixedContent: false, backgroundColor: '#0B0B0C' },
  plugins: {
    CapacitorUpdater: { autoUpdate: false, autoDeleteFailed: true, autoDeletePrevious: true },
    LocalNotifications: { smallIcon: 'ic_stat_run', iconColor: '#D4FF3A' },
  },
};

export default config;
