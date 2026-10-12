'use client';

import React, { useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  readonly label?: string;
  readonly error?: string;
  readonly helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  id: explicitId,
  className = '',
  disabled,
  ...props
}) => {
  const generatedId = useId();
  const inputId = explicitId || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div className="w-full flex flex-col space-y-1.5 text-start">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <input
        id={inputId}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        className={`w-full h-10 px-3 py-2 text-sm rounded-lg border bg-background text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 ${
          error ? 'border-rose-500 focus-visible:ring-rose-500' : 'border-border'
        } ${className}`}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-xs text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={helperId} className="text-xs text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  );
};
