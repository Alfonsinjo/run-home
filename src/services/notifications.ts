import { LocalNotifications, type LocalNotificationSchema } from '@capacitor/local-notifications';
import { addDays, parseDateKey } from '@/domain/dates';
import { formatKm } from '@/domain/progress';
import type { Settings } from '@/domain/types';
import { isNative } from './platform';

export type ReminderContext = { today: string; todayHasEntry: boolean; dailyGoalKm: number; remainingKm: number; now?: Date };
export type PlannedReminder = { id: number; at: Date; title: string; body: string };

const DAYS = 14;
const TITLES = ['Zeit zu laufen', 'Dein Tagesziel wartet', 'Kurz raus?', 'Noch nichts eingetragen', 'Der Weg nach Hause ruft'];
const BODIES = [
  (goal: string, rest: string) => `Heute stehen ${goal} an. Noch ${rest} bis zu deinen Eltern.`,
  (goal: string, rest: string) => `${goal} heute und die Serie lebt. Rest: ${rest}.`,
  (goal: string, rest: string) => `Ein kurzer Lauf reicht: ${goal}. Es bleiben ${rest}.`,
  (goal: string, rest: string) => `Du hast heute noch nichts eingetragen. Ziel: ${goal}, Rest ${rest}.`,
];

function atTime(dateKey: string, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = parseDateKey(dateKey);
  d.setHours(h, m, 0, 0);
  return d;
}

export function buildReminderPlan(settings: Settings, ctx: ReminderContext): PlannedReminder[] {
  if (!settings.reminderEnabled) return [];
  const now = ctx.now ?? new Date();
  const goal = formatKm(ctx.dailyGoalKm);
  const rest = formatKm(ctx.remainingKm);
  const plan: PlannedReminder[] = [];
  const slots: Array<[number, string]> = [[1000, settings.reminderTime]];
  if (settings.secondReminderEnabled) slots.push([2000, settings.secondReminderTime]);
  for (const [base, time] of slots) {
    for (let i = 0; i < DAYS; i++) {
      const date = addDays(ctx.today, i);
      const at = atTime(date, time);
      if (i === 0 && (ctx.todayHasEntry || at.getTime() <= now.getTime())) continue;
      plan.push({ id: base + i, at, title: TITLES[i % TITLES.length], body: BODIES[i % BODIES.length](goal, rest) });
    }
  }
  return plan;
}

const ALL_IDS = [...Array.from({ length: DAYS }, (_, i) => 1000 + i), ...Array.from({ length: DAYS }, (_, i) => 2000 + i)];
let webPlan: PlannedReminder[] = [];

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isNative()) return true;
  const status = await LocalNotifications.checkPermissions();
  if (status.display === 'granted') return true;
  const req = await LocalNotifications.requestPermissions();
  return req.display === 'granted';
}

export async function cancelAllReminders(): Promise<void> {
  webPlan = [];
  if (!isNative()) return;
  const pending = await LocalNotifications.getPending();
  const ours = pending.notifications.filter((n) => ALL_IDS.includes(n.id));
  if (ours.length) await LocalNotifications.cancel({ notifications: ours.map((n) => ({ id: n.id })) });
}

export async function scheduleReminders(settings: Settings, ctx: ReminderContext): Promise<number> {
  await cancelAllReminders();
  const plan = buildReminderPlan(settings, ctx);
  if (!isNative()) {
    webPlan = plan;
    console.info('[notifications] (web) geplant:', plan.map((p) => `${p.id} ${p.at.toLocaleString('de-DE')}`));
    return plan.length;
  }
  if (!plan.length) return 0;
  const ok = await ensureNotificationPermission();
  if (!ok) return 0;
  await LocalNotifications.createChannel({ id: 'reminders', name: 'Erinnerungen', description: 'Tägliche Lauf-Erinnerung', importance: 4 });
  const notifications: LocalNotificationSchema[] = plan.map((p) => ({
    id: p.id,
    title: p.title,
    body: p.body,
    channelId: 'reminders',
    schedule: { at: p.at, allowWhileIdle: true },
    smallIcon: 'ic_stat_run',
  }));
  await LocalNotifications.schedule({ notifications });
  return plan.length;
}

export function getWebPlanPreview(): PlannedReminder[] {
  return webPlan;
}

export async function sendTestNotification(): Promise<void> {
  if (!isNative()) {
    console.info('[notifications] (web) Test-Benachrichtigung');
    return;
  }
  const ok = await ensureNotificationPermission();
  if (!ok) throw new Error('Keine Berechtigung für Benachrichtigungen.');
  await LocalNotifications.schedule({
    notifications: [{ id: 9999, title: 'Run Home', body: 'Test-Benachrichtigung funktioniert.', schedule: { at: new Date(Date.now() + 3000) }, channelId: 'reminders' }],
  });
}
