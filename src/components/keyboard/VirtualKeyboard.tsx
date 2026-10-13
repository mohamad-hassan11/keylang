'use client';

import React, { useMemo, memo } from 'react';
import type { KeyboardLayout, Finger, Hand } from '@/lib/types';
import { getKeyboardLayout } from '@/content/keyboards';
import { findKeyForChar } from '@/hooks/useKeyboard';
import { KeyCap, type KeyVisualState } from './KeyCap';
import { HandGuide } from './HandGuide';

export interface VirtualKeyboardProps {
  readonly layout?: KeyboardLayout;
  readonly layoutId?: string;
  readonly targetChar?: string;
  readonly pressedKeyCodes?: readonly string[];
  readonly activeFinger?: Finger | null;
  readonly showFingerIndicators?: boolean;
  readonly showHandGuide?: boolean;
  readonly errorKeyCode?: string | null;
  readonly className?: string;
}

// Memoized KeyCap wrapper to prevent unnecessary re-renders
const MemoizedKeyCap = memo(KeyCap);

export const VirtualKeyboard = memo(function VirtualKeyboard({
  layout,
  layoutId = 'qwerty-us',
  targetChar,
  pressedKeyCodes = [],
  activeFinger,
  showFingerIndicators = false,
  showHandGuide = true,
  errorKeyCode,
  className = '',
}: VirtualKeyboardProps) {
  const activeLayout = useMemo(() => {
    if (layout) return layout;
    return getKeyboardLayout(layoutId);
  }, [layout, layoutId]);

  // Target key resolution
  const resolution = useMemo(() => {
    return findKeyForChar(activeLayout, targetChar);
  }, [activeLayout, targetChar]);

  const targetKeyDef = resolution.keyDef;
  const shiftKeyToHighlight = resolution.shiftKeyToHighlight;
  const requiresAltGr = resolution.requiresAltGr;

  const currentActiveFinger = activeFinger ?? targetKeyDef?.finger ?? null;
  const currentActiveHand = targetKeyDef?.hand ?? null;

  // Convert pressedKeyCodes to Set for O(1) lookup
  const pressedKeySet = useMemo(() => new Set(pressedKeyCodes), [pressedKeyCodes]);

  return (
    <div
      dir="ltr"
      role="region"
      aria-label={`Virtual Keyboard: ${activeLayout.name}`}
      className={`w-full max-w-4xl mx-auto p-2 sm:p-4 rounded-2xl bg-card/60 backdrop-blur-xs border border-border select-none text-left ${className}`}
    >
      {/* Keyboard rows container */}
      <div className="flex flex-col gap-1 sm:gap-1.5 w-full">
        {activeLayout.rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex flex-row gap-1 sm:gap-1.5 w-full"
            role="row"
          >
            {row.keys.map((key) => {
              // Determine visual state
              let keyState: KeyVisualState = 'idle';

              if (pressedKeySet.has(key.code)) {
                keyState = 'pressed';
              } else if (errorKeyCode === key.code) {
                keyState = 'error';
              } else if (targetKeyDef?.code === key.code) {
                keyState = 'target';
              } else if (shiftKeyToHighlight === key.code) {
                keyState = 'modifier-target';
              } else if (requiresAltGr && key.code === 'AltRight') {
                keyState = 'modifier-target';
              }

              return (
                <MemoizedKeyCap
                  key={key.code}
                  definition={key}
                  state={keyState}
                  showFingerIndicator={showFingerIndicators}
                  activeFinger={currentActiveFinger}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Optional HandGuide HUD */}
      {showHandGuide && (
        <HandGuide
          activeHand={currentActiveHand}
          activeFinger={currentActiveFinger}
        />
      )}
    </div>
  );
});
