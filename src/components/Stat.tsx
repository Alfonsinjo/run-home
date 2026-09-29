export function Stat({ value, label, size = 'md', tone = 'default' }: { value: string; label: string; size?: 'xl' | 'lg' | 'md'; tone?: 'default' | 'accent' | 'muted' | 'warn' }) {
  return (
    <div className={`stat stat-${size} stat-${tone}`}>
      <div className="stat-value num">{value}</div>
      <div className="label">{label}</div>
    </div>
  );
}
