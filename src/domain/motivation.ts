export type Mood = 'ahead' | 'behind' | 'streak' | 'missedYesterday' | 'finished' | 'start';

const TEXTS: Record<Mood, string[]> = {
  start: [
    'Jeder Weg beginnt mit dem ersten Kilometer. Los geht’s!',
    'Die Strecke wartet. Heute ist ein guter Tag für den Anfang.',
  ],
  ahead: [
    'Du liegst vor dem Plan. Genau so weiterlaufen!',
    'Vorsprung ist Freiheit. Halte ihn!',
    'Stark. Der Plan hinkt dir hinterher.',
  ],
  behind: [
    'Rückstand ist nur ein Wort. Ein Lauf heute macht ihn kleiner.',
    'Jeder Kilometer heute holt ein Stück auf. Raus mit dir!',
    'Der Plan wartet nicht, aber er verzeiht. Heute einen Schritt nach vorn.',
  ],
  streak: [
    'Deine Serie läuft. Nicht heute abreißen lassen!',
    'Tag für Tag. Genau das ist der Weg nach Hause.',
    'Serie am Leben halten: Ein kurzer Lauf reicht.',
  ],
  missedYesterday: [
    'Gestern war Pause. Heute ist die Chance auf einen Neustart.',
    'Ein Tag ohne Lauf ist okay. Zwei wären schade.',
  ],
  finished: [
    'Angekommen! Du hast die ganze Strecke zu deinen Eltern geschafft.',
    'Ziel erreicht. Jeder weitere Kilometer ist Bonus.',
  ],
};

export function moodFor(args: {
  plusMinusKm: number;
  streak: number;
  enteredYesterday: boolean;
  finished: boolean;
  totalKm: number;
}): Mood {
  if (args.finished) return 'finished';
  if (args.totalKm <= 0) return 'start';
  if (!args.enteredYesterday) return 'missedYesterday';
  if (args.streak >= 3) return 'streak';
  if (args.plusMinusKm < 0) return 'behind';
  return 'ahead';
}

export function pickMotivation(mood: Mood, seed: number): string {
  const list = TEXTS[mood];
  return list[Math.abs(Math.floor(seed)) % list.length];
}
