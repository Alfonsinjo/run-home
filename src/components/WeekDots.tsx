import type { WeekDay } from '@/domain/goals';

const NAMES = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export function WeekDots({ days }: { days: WeekDay[] }) {
  return (
    <div className="weekdots">
      {days.map((d, i) => (
        <div key={d.date} className={`weekdot ${d.status}`} title={`${d.date}: ${d.km} km`}>
          <i />
          <span>{NAMES[i]}</span>
        </div>
      ))}
    </div>
  );
}
