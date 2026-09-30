/** Trennt eine Einheit am Ende ("341,7 km", "67 %") ab, damit die Zahl groß und die Einheit klein gesetzt wird. */
function splitUnit(value: string): [string, string | null] {
  const m = value.match(/^(.*\S)\s(km|%|Tage?)$/);
  return m ? [m[1], m[2]] : [value, null];
}

export function Stat({ value, label, size = 'md', tone = 'default' }: { value: string; label: string; size?: 'xl' | 'lg' | 'md' | 'sm'; tone?: 'default' | 'accent' | 'muted' | 'warn' | 'success' }) {
  const [num, unit] = splitUnit(value);
  return (
    <div className={`stat stat-${size} stat-${tone}`}>
      <div className="stat-value">
        {num}
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
      <div className="label">{label}</div>
    </div>
  );
}
