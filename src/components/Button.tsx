import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'lg';
  full?: boolean;
  icon?: ReactNode;
};

export function Button({ variant = 'primary', size = 'md', full, icon, className = '', children, type = 'button', ...rest }: Props) {
  const cls = ['btn', `btn-${variant}`, size === 'lg' ? 'btn-lg' : '', full ? 'btn-full' : '', className].filter(Boolean).join(' ');
  return (
    <button type={type} className={cls} {...rest}>
      {icon}
      {children}
    </button>
  );
}
