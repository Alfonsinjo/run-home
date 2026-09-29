import type { ReactNode } from 'react';

export function Screen({ title, subtitle, right, children, noPadding }: { title?: string; subtitle?: string; right?: ReactNode; children: ReactNode; noPadding?: boolean }) {
  return (
    <div className={`screen ${noPadding ? 'no-padding' : ''}`}>
      {(title || right) && (
        <header className="screen-header">
          <div>
            {subtitle && <div className="label">{subtitle}</div>}
            {title && <h1>{title}</h1>}
          </div>
          {right}
        </header>
      )}
      {children}
    </div>
  );
}
