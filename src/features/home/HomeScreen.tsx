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
    <Screen noPadding className="home">
      <RouteMap
        route={route} home={settings.home} parents={settings.parents}
        totalKm={d.progress.totalKm} targetKm={settings.targetKm} remainingKm={d.progress.remainingKm}
        milestones={d.milestones} achieved={achieved} nextId={d.next?.id}
      />
      <div className="home-cards">
        <ProgressCard d={d} />
        <TodayCard d={d} />
        <WeekCard d={d} />
        <NextMilestoneCard d={d} />
        <FunFactCard d={d} />
      </div>
      <div className="entry-bar">
        <Button size="lg" full onClick={() => setEntryOpen(true)}>Heute eintragen</Button>
      </div>
      <EntrySheet open={entryOpen} onClose={() => setEntryOpen(false)} />
    </Screen>
  );
}
