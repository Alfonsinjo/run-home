import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173';
const OUT_DIR = process.env.OUT_DIR ?? 'docs/screenshots';
mkdirSync(OUT_DIR, { recursive: true });
const seed = JSON.parse(readFileSync('src/data/seed-2026.json', 'utf-8'));
const entries = Object.fromEntries(seed.map((e) => [e.date, e]));
const state = {
  schemaVersion: 1, setupDone: true, entries, achieved: {}, route: null,
  settings: {
    home: { label: 'Frankfurt am Main', lat: 50.1109, lon: 8.6821 }, parents: { label: 'Hamburg', lat: 53.5511, lon: 9.9937 },
    targetKm: 510, startDate: '2026-01-01', deadline: '2026-12-31', dailyGoalMode: 'catchup', customDailyKm: 2,
    reminderEnabled: true, reminderTime: '19:00', secondReminderEnabled: false, secondReminderTime: '21:00',
    manualMilestones: [{ id: 'manual-1', kind: 'manual', km: 120, title: 'Gießen' }], routeMode: 'osrm',
  },
};
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.goto(BASE);
await page.evaluate((s) => localStorage.setItem('CapacitorStorage.runhome.state', JSON.stringify(s)), state);
for (const [name, path] of [['home', '/'], ['history', '/history'], ['milestones', '/milestones'], ['settings', '/settings']]) {
  await page.goto(BASE + path);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT_DIR}/${name}.png`, fullPage: name !== 'home' });
}
await browser.close();
console.log(`Screenshots in ${OUT_DIR}/`);
