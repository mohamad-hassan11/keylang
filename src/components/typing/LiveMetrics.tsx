'use client';

import React, { useState, useEffect, useRef, memo } from 'react';

interface LiveNumberProps {
  readonly value: number;
  readonly className?: string;
  readonly decimals?: number;
  readonly suffix?: string;
}

interface LiveProgressBarProps {
  readonly value: number; // 0-100
  readonly color?: 'primary' | 'success' | 'warning' | 'error';
  readonly height?: number;
  readonly className?: string;
}

const colorClasses = {
  primary: 'bg-primary',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-rose-500',
};

export const LiveNumber = memo(function LiveNumber({
  value,
  className = '',
  decimals = 0,
  suffix = '',
}: LiveNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef<number>(value);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (value === prevValueRef.current) return;

    const startValue = displayValue;
    const endValue = value;
    const startTime = Date.now();
    const duration = 300;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easedProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        prevValueRef.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current!);
  }, [value]);

  const formatted = displayValue.toFixed(decimals);
  const [intPart, decPart] = formatted.split('.');

  return (
    <span className={`inline-block tabular-nums ${className}`}>
      {intPart}
      {decPart && <span className="opacity-75">.{decPart}</span>}
      {suffix && <span className="text-sm font-normal text-muted-foreground ms-1">{suffix}</span>}
    </span>
  );
});

export const LiveProgressBar = memo(function LiveProgressBar({
  value,
  color = 'primary',
  height = 4,
  className = '',
}: LiveProgressBarProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const startValue = displayValue;
    const endValue = value;
    const startTime = Date.now();
    const duration = 200;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easedProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
      }
    };

    animate();
  }, [value]);

  const percentage = Math.min(Math.max(displayValue, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      <div className={`h-1 rounded-full bg-muted/50 overflow-hidden ${height !== 4 ? `h-[${height}px]` : ''}`}>
        <div
          className={`${colorClasses[color]} h-full rounded-full transition-all duration-200 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});