import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly variant?: 'default' | 'success' | 'warning' | 'error' | 'outline' | 'accent';
  readonly size?: 'sm' | 'md';
  readonly children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
    default: 'bg-secondary text-secondary-foreground border border-border',
    success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25',
    warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25',
    error: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/25',
    outline: 'border border-border text-foreground bg-transparent',
    accent: 'bg-primary/15 text-primary border border-primary/25 font-semibold',
  };

  const sizeClasses: Record<NonNullable<BadgeProps['size']>, string> = {
    sm: 'text-xs px-2 py-0.5 rounded-full font-medium',
    md: 'text-xs px-2.5 py-1 rounded-full font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center justify-center transition-colors select-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
