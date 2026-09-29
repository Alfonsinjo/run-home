import { useState } from 'react';
import { Button, Screen } from '@/components';
import { EntrySheet } from '@/features/entry/EntrySheet';
import { useAppStore } from '@/store/useAppStore';
import { useDerived } from '@/store/selectors';
import { RouteMap } from './RouteMap';
import { ProgressCard } from './ProgressCard';
import { TodayCard } from './TodayCard';
import { WeekCard } from './WeekCard';
import { NextMilestoneCard } from './NextMilestoneCard';
import { FunFactCard } from './FunFactCard';

export function HomeScreen() {
  const d = useDerived();
  const settings = useAppStore((s) => s.settings);
  const route = useAppStore((s) => s.route);
  const achieved = useAppStore((s) => s.achieved);
  const [entryOpen, setEntryOpen] = useState(false);

  return (
    <Screen noPadding>
      <RouteMap route={route} home={settings.home} parents={settings.parents} totalKm={d.progress.totalKm} targetKm={settings.targetKm} milestones={d.milestones} achieved={achieved} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 16px' }}>
        <ProgressCard d={d} />
        <TodayCard d={d} />
        <WeekCard d={d} />
        <NextMilestoneCard d={d} />
        <FunFactCard d={d} />
      </div>
      <EntrySheet open={entryOpen} onClose={() => setEntryOpen(false)} />
      <Button size="lg" className="fab" onClick={() => setEntryOpen(true)}>+ Eintragen</Button>
    </Screen>
  );
}
