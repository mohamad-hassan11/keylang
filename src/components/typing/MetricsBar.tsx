'use client';

import React from 'react';
import type { SessionStatus } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

export interface MetricsBarProps {
  readonly grossWpm: number;
  readonly netWpm: number;
  readonly accuracy: number;
  readonly elapsedTimeMs: number;
  readonly status: SessionStatus;
  readonly uncorrectedErrors?: number;
  readonly className?: string;
}

export function formatElapsedTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({
  grossWpm,
  netWpm,
  accuracy,
  elapsedTimeMs,
  status,
  uncorrectedErrors = 0,
  className = '',
}) => {
  const statusBadges: Record<
    SessionStatus,
    { label: string; variant: 'outline' | 'accent' | 'warning' | 'success' }
  > = {
    idle: { label: 'Idle', variant: 'outline' },
    active: { label: 'Typing', variant: 'accent' },
    paused: { label: 'Paused', variant: 'warning' },
    completed: { label: 'Finished', variant: 'success' },
  };

  const currentBadge = statusBadges[status];

  return (
    <div
      role="region"
      aria-label="Typing metrics HUD"
      className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border text-card-foreground shadow-xs ${className}`}
    >
      <div className="flex items-center gap-6 sm:gap-8">
        {/* Net WPM */}
        <div className="flex flex-col">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Net WPM
          </span>
          <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-foreground">
            {Math.round(netWpm)}
          </span>
        </div>

        {/* Gross WPM */}
        <div className="flex flex-col">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Gross WPM
          </span>
          <span className="text-xl sm:text-2xl font-semibold font-mono tabular-nums text-muted-foreground">
            {Math.round(grossWpm)}
          </span>
        </div>

        {/* Accuracy */}
        <div className="flex flex-col">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Accuracy
          </span>
          <span
            className={`text-xl sm:text-2xl font-semibold font-mono tabular-nums ${
              accuracy >= 95
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {accuracy === 100 ? '100%' : `${accuracy.toFixed(1)}%`}
          </span>
        </div>

        {/* Elapsed Time */}
        <div className="flex flex-col">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Time
          </span>
          <span className="text-xl sm:text-2xl font-semibold font-mono tabular-nums text-foreground">
            {formatElapsedTime(elapsedTimeMs)}
          </span>
        </div>
      </div>

      {/* Status Badge & Uncorrected Errors */}
      <div className="flex items-center gap-3">
        {uncorrectedErrors > 0 && (
          <Badge variant="error" size="sm">
            {uncorrectedErrors} uncorrected
          </Badge>
        )}
        <Badge variant={currentBadge.variant} size="md">
          {currentBadge.label}
        </Badge>
      </div>
    </div>
  );
};
