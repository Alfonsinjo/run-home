import { describe, expect, it } from 'vitest';
import { moodFor, pickMotivation } from './motivation';

describe('motivation', () => {
  it('moodFor prioritises finished, then start, then missedYesterday, streak, behind, ahead', () => {
    expect(moodFor({ plusMinusKm: 5, streak: 3, enteredYesterday: true, finished: true, totalKm: 510 })).toBe('finished');
    expect(moodFor({ plusMinusKm: 0, streak: 0, enteredYesterday: false, finished: false, totalKm: 0 })).toBe('start');
    expect(moodFor({ plusMinusKm: 5, streak: 0, enteredYesterday: false, finished: false, totalKm: 10 })).toBe('missedYesterday');
    expect(moodFor({ plusMinusKm: -30, streak: 3, enteredYesterday: true, finished: false, totalKm: 10 })).toBe('streak');
    expect(moodFor({ plusMinusKm: -30, streak: 1, enteredYesterday: true, finished: false, totalKm: 10 })).toBe('behind');
    expect(moodFor({ plusMinusKm: 3, streak: 1, enteredYesterday: true, finished: false, totalKm: 10 })).toBe('ahead');
  });
  it('pickMotivation is deterministic for a seed and never empty', () => {
    expect(pickMotivation('behind', 3)).toBe(pickMotivation('behind', 3));
    for (const mood of ['ahead', 'behind', 'streak', 'missedYesterday', 'finished', 'start'] as const) {
      expect(pickMotivation(mood, 7).length).toBeGreaterThan(5);
    }
  });
});
