'use client';

import React, { useEffect, memo } from 'react';
import type { TypingMetrics } from '@/lib/types';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatElapsedTime } from './MetricsBar';
import { AnimatedNumber, AnimatedProgressBar } from './AnimatedMetrics';

export interface ResultsCardProps {
  readonly metrics: TypingMetrics;
  readonly onRestart: () => void;
  readonly onNext?: () => void;
  readonly title?: string;
  readonly description?: string;
  readonly className?: string;
}

export const ResultsCard = memo(function ResultsCard({
  metrics,
  onRestart,
  onNext,
  title = 'Session Complete!',
  description = 'Great job! Review your performance metrics below.',
  className = '',
}: ResultsCardProps) {
  // Shortcut: Enter key triggers onNext (or onRestart)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (onNext) {
          onNext();
        } else {
          onRestart();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onRestart]);

  // Sort error keys descending
  const errorKeyEntries = Object.entries(metrics.perKeyErrors).sort((a, b) => b[1] - a[1]);

  return (
    <Card variant="elevated" padding="lg" className={`w-full max-w-xl mx-auto shadow-xl animate-slide-up ${className}`}>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">{title}</CardTitle>
        <CardDescription className="text-center">{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Hero Metrics Grid */}
        <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-muted/40 border border-border text-center">
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase">Net Speed</div>
            <div className="text-3xl font-extrabold font-mono text-primary mt-1">
              <AnimatedNumber value={Math.round(metrics.netWpm)} suffix="WPM" duration={800} />
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase">Accuracy</div>
            <div className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              <AnimatedNumber value={metrics.accuracy} decimals={1} suffix="%" duration={800} />
            </div>
            <AnimatedProgressBar value={metrics.accuracy} color="success" className="mt-2" />
          </div>

          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase">Time</div>
            <div className="text-3xl font-extrabold font-mono text-foreground mt-1">
              {formatElapsedTime(metrics.elapsedTimeMs)}
            </div>
          </div>
        </div>

        {/* Secondary Metrics Breakdown */}
        <div className="grid grid-cols-3 gap-2 text-sm text-center">
          <div className="p-2.5 rounded-lg border border-border bg-card">
            <span className="text-muted-foreground block text-xs">Gross Speed</span>
            <AnimatedNumber value={Math.round(metrics.grossWpm)} suffix="WPM" duration={600} className="font-mono text-base" />
          </div>

          <div className="p-2.5 rounded-lg border border-border bg-card">
            <span className="text-muted-foreground block text-xs">Total Errors</span>
            <AnimatedNumber value={metrics.errorCount} duration={500} className="font-mono text-base" />
          </div>

          <div className="p-2.5 rounded-lg border border-border bg-card">
            <span className="text-muted-foreground block text-xs">Uncorrected</span>
            <AnimatedNumber value={metrics.uncorrectedErrors} duration={500} className="font-mono text-base" />
          </div>
        </div>

        {/* Weak Keys Section */}
        <div>
          <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">
            Key Accuracy Breakdown
          </h4>
          {errorKeyEntries.length === 0 ? (
            <Badge variant="success" size="md" className="animate-fade-in">
              Flawless! Zero errors recorded
            </Badge>
          ) : (
            <div className="flex flex-wrap gap-2">
              {errorKeyEntries.slice(0, 6).map(([key, count], idx) => (
                <Badge key={key} variant="error" size="sm" className="animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
                  '{key === ' ' ? 'Space' : key}': {count} {count === 1 ? 'error' : 'errors'}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-end gap-3 border-t border-border pt-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <Button variant="outline" size="md" onClick={onRestart}>
          Restart (Tab+Enter)
        </Button>
        {onNext && (
          <Button variant="primary" size="md" onClick={onNext}>
            Next Lesson (Enter)
          </Button>
        )}
      </CardFooter>
    </Card>
  );
});
