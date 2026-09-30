import type { ReactNode } from 'react';

export function Card({ title, action, className = '', children, 'aria-label': ariaLabel }: { title?: string; action?: ReactNode; className?: string; children: ReactNode; 'aria-label'?: string }) {
  return (
    <section className={`card ${className}`.trim()} aria-label={ariaLabel}>
      {(title || action) && (
        <div className="card-head">
          {title && <h2>{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
