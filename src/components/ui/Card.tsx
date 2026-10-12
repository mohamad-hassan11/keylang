import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly variant?: 'default' | 'elevated' | 'bordered';
  readonly padding?: 'none' | 'sm' | 'md' | 'lg';
  readonly children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  className = '',
  children,
  ...props
}) => {
  const variantClasses: Record<NonNullable<CardProps['variant']>, string> = {
    default: 'bg-card text-card-foreground border border-border shadow-xs',
    elevated: 'bg-card text-card-foreground shadow-md border border-border/40 hover:shadow-lg transition-shadow',
    bordered: 'bg-card text-card-foreground border-2 border-border',
  };

  const paddingClasses: Record<NonNullable<CardProps['padding']>, string> = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`rounded-xl overflow-hidden ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div className={`flex flex-col space-y-1.5 pb-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className = '', children, ...props }) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight text-foreground ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className = '', children, ...props }) => (
  <p className={`text-sm text-muted-foreground ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div className={`pt-0 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div className={`flex items-center pt-4 ${className}`} {...props}>
    {children}
  </div>
);
