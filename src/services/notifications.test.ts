import { describe, expect, it } from 'vitest';
import { buildReminderPlan } from './notifications';
import { DEFAULT_SETTINGS } from '@/domain/types';

const ctx = { today: '2026-09-29', todayHasEntry: false, dailyGoalKm: 1.8, remainingKm: 168.3, now: new Date(2026, 8, 29, 10, 0) };

describe('buildReminderPlan', () => {
  it('plans 14 days of primary reminders at the configured time, ids 1000+i', () => {
    const plan = buildReminderPlan({ ...DEFAULT_SETTINGS, reminderTime: '19:00' }, ctx);
    expect(plan).toHaveLength(14);
    expect(plan[0].id).toBe(1000);
    expect(plan[0].at.getHours()).toBe(19);
    expect(plan[0].at.getDate()).toBe(29);
    expect(plan[13].at.getMonth()).toBe(9); // Oktober
    expect(plan[0].body).toContain('1,8 km');
  });
  it('skips today when an entry exists or the time already passed', () => {
    const withEntry = buildReminderPlan(DEFAULT_SETTINGS, { ...ctx, todayHasEntry: true });
    expect(withEntry[0].at.getDate()).toBe(30);
    const late = buildReminderPlan(DEFAULT_SETTINGS, { ...ctx, now: new Date(2026, 8, 29, 20, 0) });
    expect(late[0].at.getDate()).toBe(30);
  });
  it('adds second reminders with ids 2000+i when enabled and nothing when disabled', () => {
    const both = buildReminderPlan({ ...DEFAULT_SETTINGS, secondReminderEnabled: true }, ctx);
    expect(both.filter((p) => p.id >= 2000)).toHaveLength(14);
    expect(buildReminderPlan({ ...DEFAULT_SETTINGS, reminderEnabled: false }, ctx)).toEqual([]);
  });
  it('stops at the deadline and plans nothing after it', () => {
    const s = { ...DEFAULT_SETTINGS, deadline: '2026-10-02' };
    const plan = buildReminderPlan(s, ctx);
    expect(plan).toHaveLength(4); // 29.09. bis 02.10.
    expect(plan.at(-1)!.at.getDate()).toBe(2);
    expect(buildReminderPlan({ ...s, deadline: '2026-09-28' }, ctx)).toEqual([]);
  });
  it('treats an empty or invalid time like disabled', () => {
    expect(buildReminderPlan({ ...DEFAULT_SETTINGS, reminderTime: '' }, ctx)).toEqual([]);
    const second = buildReminderPlan({ ...DEFAULT_SETTINGS, secondReminderEnabled: true, secondReminderTime: '' }, ctx);
    expect(second.every((p) => p.id < 2000)).toBe(true);
  });
});
