import { useMemo } from 'react';
import { addDays } from '@/domain/dates';
import { latestFact, nextFact } from '@/domain/funfacts';
import { computeStreak, computeWeek, dailyGoalKm, forecastArrival, type WeekSummary } from '@/domain/goals';
import { allMilestones, nextMilestone } from '@/domain/milestones';
import { moodFor, pickMotivation, type Mood } from '@/domain/motivation';
import { computeProgress, type ProgressSummary } from '@/domain/progress';
import type { AppState, FunFact, Milestone } from '@/domain/types';
import { useAppStore } from './useAppStore';

export type Derived = {
  today: string;
  progress: ProgressSummary;
  dailyGoal: number;
  week: WeekSummary;
  streak: number;
  forecast: string | null;
  milestones: Milestone[];
  next: Milestone | null;
  latestFact: FunFact | null;
  nextFact: FunFact | null;
  mood: Mood;
  motivation: string;
  todayKm: number;
};

export function deriveAll(state: AppState, today: string): Derived {
  const progress = computeProgress(state.entries, state.settings, today);
  const dailyGoal = dailyGoalKm(state.settings, progress);
  const streak = computeStreak(state.entries, today);
  const mood = moodFor({
    plusMinusKm: progress.plusMinusKm,
    streak,
    enteredYesterday: (state.entries[addDays(today, -1)]?.km ?? 0) > 0,
    finished: progress.finished,
    totalKm: progress.totalKm,
  });
  const milestones = allMilestones(state.settings);
  const dayNumber = Number(today.replace(/-/g, ''));
  return {
    today,
    progress,
    dailyGoal,
    week: computeWeek(state.entries, dailyGoal, today),
    streak,
    forecast: forecastArrival(state.entries, progress, today),
    milestones,
    next: nextMilestone(milestones, progress.totalKm),
    latestFact: latestFact(progress.totalKm),
    nextFact: nextFact(progress.totalKm),
    mood,
    motivation: pickMotivation(mood, dayNumber),
    todayKm: state.entries[today]?.km ?? 0,
  };
}

export function useDerived(): Derived {
  const entries = useAppStore((s) => s.entries);
  const settings = useAppStore((s) => s.settings);
  const route = useAppStore((s) => s.route);
  const achieved = useAppStore((s) => s.achieved);
  const today = useAppStore((s) => s.today);
  return useMemo(
    () => deriveAll({ schemaVersion: 1, setupDone: true, entries, settings, route, achieved }, today),
    [entries, settings, route, achieved, today],
  );
}
