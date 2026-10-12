'use client';

import React, { useId } from 'react';

export interface SelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface SelectProps {
  readonly options: readonly SelectOption[];
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly label?: string;
  readonly error?: string;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly id?: string;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  label,
  error,
  disabled = false,
  className = '',
  id: explicitId,
}) => {
  const generatedId = useId();
  const selectId = explicitId || generatedId;
  const errorId = `${selectId}-error`;

  return (
    <div className="w-full flex flex-col space-y-1.5 text-start">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative w-full">
        <select
          id={selectId}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`appearance-none w-full h-10 ps-3 pe-9 py-2 text-sm rounded-lg border bg-background text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${
            error ? 'border-rose-500 focus-visible:ring-rose-500' : 'border-border'
          } ${className}`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled} className="bg-background text-foreground">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-muted-foreground">
          <svg className="h-4 w-4 fill-none stroke-currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <p id={errorId} className="text-xs text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
};
