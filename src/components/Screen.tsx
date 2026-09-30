import type { ReactNode } from 'react';

export function Screen({ title, subtitle, right, children, noPadding, className = '' }: { title?: string; subtitle?: string; right?: ReactNode; children: ReactNode; noPadding?: boolean; className?: string }) {
  return (
    <div className={['screen', noPadding ? 'no-padding' : '', className].filter(Boolean).join(' ')}>
      {(title || right) && (
        <header className="screen-header">
          <div>
            {title && <h1>{title}</h1>}
            {subtitle && <div className="subtitle">{subtitle}</div>}
          </div>
          {right}
        </header>
      )}
      {children}
    </div>
  );
}
