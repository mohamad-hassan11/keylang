'use client';

import React from 'react';
import type { Finger, Hand } from '@/lib/types';

export interface HandGuideProps {
  readonly activeHand?: Hand | null;
  readonly activeFinger?: Finger | null;
  readonly className?: string;
}

interface FingerMeta {
  readonly id: Finger;
  readonly label: string;
  readonly colorClass: string;
  readonly activeClass: string;
}

const FINGERS_LEFT: readonly FingerMeta[] = [
  { id: 'pinky', label: 'Pinky', colorClass: 'bg-purple-500/20 text-purple-700 dark:text-purple-300', activeClass: 'bg-purple-500 text-white ring-2 ring-purple-400 font-bold scale-105' },
  { id: 'ring', label: 'Ring', colorClass: 'bg-blue-500/20 text-blue-700 dark:text-blue-300', activeClass: 'bg-blue-500 text-white ring-2 ring-blue-400 font-bold scale-105' },
  { id: 'middle', label: 'Mid', colorClass: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300', activeClass: 'bg-emerald-500 text-white ring-2 ring-emerald-400 font-bold scale-105' },
  { id: 'index', label: 'Index', colorClass: 'bg-amber-500/20 text-amber-700 dark:text-amber-300', activeClass: 'bg-amber-500 text-white ring-2 ring-amber-400 font-bold scale-105' },
  { id: 'thumb', label: 'Thumb', colorClass: 'bg-slate-400/20 text-slate-700 dark:text-slate-300', activeClass: 'bg-slate-500 text-white ring-2 ring-slate-400 font-bold scale-105' },
];

const FINGERS_RIGHT: readonly FingerMeta[] = [
  { id: 'thumb', label: 'Thumb', colorClass: 'bg-slate-400/20 text-slate-700 dark:text-slate-300', activeClass: 'bg-slate-500 text-white ring-2 ring-slate-400 font-bold scale-105' },
  { id: 'index', label: 'Index', colorClass: 'bg-amber-500/20 text-amber-700 dark:text-amber-300', activeClass: 'bg-amber-500 text-white ring-2 ring-amber-400 font-bold scale-105' },
  { id: 'middle', label: 'Mid', colorClass: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300', activeClass: 'bg-emerald-500 text-white ring-2 ring-emerald-400 font-bold scale-105' },
  { id: 'ring', label: 'Ring', colorClass: 'bg-blue-500/20 text-blue-700 dark:text-blue-300', activeClass: 'bg-blue-500 text-white ring-2 ring-blue-400 font-bold scale-105' },
  { id: 'pinky', label: 'Pinky', colorClass: 'bg-purple-500/20 text-purple-700 dark:text-purple-300', activeClass: 'bg-purple-500 text-white ring-2 ring-purple-400 font-bold scale-105' },
];

export function HandGuide({ activeHand, activeFinger, className = '' }: HandGuideProps) {
  const renderHand = (handName: Hand, fingers: readonly FingerMeta[]) => {
    const isHandActive = activeHand === handName;

    return (
      <div
        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
          isHandActive
            ? 'border-primary/40 bg-card/80 shadow-xs'
            : 'border-border/60 bg-card/30 opacity-80'
        }`}
        data-hand={handName}
        data-active={isHandActive}
      >
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {handName === 'left' ? 'Left Hand' : 'Right Hand'}
        </span>
        <div className="flex items-center gap-1 sm:gap-1.5">
          {fingers.map((f) => {
            const isFingerActive = isHandActive && activeFinger === f.id;
            return (
              <div
                key={f.id}
                data-finger={f.id}
                data-active={isFingerActive}
                className={`flex flex-col items-center justify-center w-8 sm:w-10 h-10 sm:h-12 rounded-lg text-[10px] sm:text-xs transition-all duration-150 ${
                  isFingerActive ? f.activeClass : f.colorClass
                }`}
              >
                <span>{f.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      role="region"
      aria-label="Hand and Finger Placement Guide"
      className={`flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-3 select-none ${className}`}
    >
      {renderHand('left', FINGERS_LEFT)}
      {renderHand('right', FINGERS_RIGHT)}
    </div>
  );
}
