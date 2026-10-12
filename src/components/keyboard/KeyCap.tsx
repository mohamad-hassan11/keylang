'use client';

import React from 'react';
import type { KeyDefinition, Finger } from '@/lib/types';

export type KeyVisualState = 'idle' | 'target' | 'pressed' | 'error' | 'modifier-target';

export interface KeyCapProps {
  readonly definition: KeyDefinition;
  readonly state?: KeyVisualState;
  readonly isTarget?: boolean;
  readonly isPressed?: boolean;
  readonly isError?: boolean;
  readonly isModifierTarget?: boolean;
  readonly showFingerIndicator?: boolean;
  readonly activeFinger?: Finger | null;
  readonly className?: string;
}

const FINGER_COLORS: Record<Finger, string> = {
  pinky: 'bg-purple-500',
  ring: 'bg-blue-500',
  middle: 'bg-emerald-500',
  index: 'bg-amber-500',
  thumb: 'bg-slate-400',
};

export function KeyCap({
  definition,
  state,
  isTarget = false,
  isPressed = false,
  isError = false,
  isModifierTarget = false,
  showFingerIndicator = false,
  activeFinger,
  className = '',
}: KeyCapProps) {
  // Resolve active visual state
  const resolvedState: KeyVisualState =
    state ??
    (isPressed
      ? 'pressed'
      : isError
      ? 'error'
      : isTarget
      ? 'target'
      : isModifierTarget
      ? 'modifier-target'
      : 'idle');

  const stateStyles: Record<KeyVisualState, string> = {
    idle: 'bg-card border-border text-foreground hover:bg-muted/80 shadow-xs',
    target: 'bg-primary text-primary-foreground border-primary font-bold shadow-md ring-2 ring-primary/40 scale-[1.02]',
    pressed: 'bg-primary/80 text-primary-foreground border-primary translate-y-0.5 shadow-inner scale-[0.98]',
    error: 'bg-destructive/20 border-destructive text-destructive font-bold animate-pulse',
    'modifier-target': 'bg-primary/20 text-primary border-primary font-semibold ring-2 ring-primary/30',
  };

  const hasTactileNub = definition.code === 'KeyF' || definition.code === 'KeyJ';
  const widthFlex = definition.width ?? 1.0;

  // Accessible label
  const ariaLabel = [
    definition.primary || definition.code,
    definition.shift ? `shift: ${definition.shift}` : null,
    definition.altGr ? `altgr: ${definition.altGr}` : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div
      role="button"
      aria-label={ariaLabel}
      data-code={definition.code}
      data-state={resolvedState}
      style={{
        flexGrow: widthFlex,
        flexBasis: 0,
        minWidth: 0,
      }}
      className={`relative flex flex-col justify-between items-center rounded-md border text-center transition-all select-none p-1 sm:p-1.5 h-10 sm:h-12 md:h-14 ${stateStyles[resolvedState]} ${className}`}
    >
      {/* Top row: Shift label & AltGr label */}
      <div className="w-full flex justify-between items-center text-[10px] sm:text-xs leading-none">
        <span className="text-muted-foreground/90 font-sans">{definition.shift ?? ''}</span>
        {definition.altGr && (
          <span className="text-[9px] sm:text-[10px] text-muted-foreground/80 font-sans ms-auto">
            {definition.altGr}
          </span>
        )}
      </div>

      {/* Center: Primary character */}
      <span className="text-xs sm:text-base md:text-lg font-medium leading-none my-auto">
        {definition.primary === ' ' ? 'Space' : definition.primary}
      </span>

      {/* Tactile Nub for tactile home-row guidance */}
      {hasTactileNub && (
        <span
          className="absolute bottom-1 w-2.5 h-0.5 rounded-full bg-current opacity-60"
          aria-hidden="true"
        />
      )}

      {/* Optional Finger Dot Indicator */}
      {showFingerIndicator && (
        <span
          className={`absolute top-1 right-1 h-1.5 w-1.5 rounded-full ${FINGER_COLORS[definition.finger]} ${
            activeFinger === definition.finger ? 'ring-2 ring-primary ring-offset-1' : 'opacity-60'
          }`}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
