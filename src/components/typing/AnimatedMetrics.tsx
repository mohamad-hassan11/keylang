'use client';

import React, { useState, useEffect, memo } from 'react';

interface AnimatedNumberProps {
  readonly value: number;
  readonly duration?: number;
  readonly decimals?: number;
  readonly suffix?: string;
  readonly className?: string;
  readonly onComplete?: () => void;
}

interface AnimatedProgressBarProps {
  readonly value: number; // 0-100
  readonly max?: number;
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

export const AnimatedNumber = memo(function AnimatedNumber({
  value,
  duration = 600,
  decimals = 0,
  suffix = '',
  className = '',
  onComplete,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const currentValue = easedProgress * value;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
        onComplete?.();
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  const formatted = displayValue.toFixed(decimals);
  const [intPart, decPart] = formatted.split('.');

  return (
    <span className={`inline-block animate-count-up ${className}`}>
      {intPart}
      {decPart && <span className="opacity-75">.{decPart}</span>}
      {suffix && <span className="text-sm font-normal text-muted-foreground ms-1">{suffix}</span>}
    </span>
  );
});

export const AnimatedProgressBar = memo(function AnimatedProgressBar({
  value,
  max = 100,
  color = 'primary',
  height = 6,
  className = '',
}: AnimatedProgressBarProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / 800, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = easedProgress * value;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value]);

  const percentage = Math.min((displayValue / max) * 100, 100);

  return (
    <div className={`w-full ${className}`}>
      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
        <div
          className={`${colorClasses[color]} h-full rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});