'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type {
  KeyboardLayout,
  KeyboardLayoutId,
  KeyDefinition,
  Finger,
  Hand,
} from '@/lib/types';
import { getKeyboardLayout, US_INTERNATIONAL_DEAD_KEYS } from '@/content/keyboards';

export interface KeyResolution {
  readonly keyDef: KeyDefinition | null;
  readonly requiresShift: boolean;
  readonly requiresAltGr: boolean;
  readonly requiresShiftAltGr: boolean;
  readonly shiftKeyToHighlight: 'ShiftLeft' | 'ShiftRight' | null;
  readonly isDeadKey?: boolean;
  readonly deadKeyCode?: string | null;
}

export function findKeyByCode(
  layout: KeyboardLayout,
  code: string
): KeyDefinition | null {
  for (const row of layout.rows) {
    for (const key of row.keys) {
      if (key.code === code) return key;
    }
  }
  return null;
}

/**
 * Pure NFC-normalized lookup function to locate the physical key and modifiers
 * required to type a given character on a specified keyboard layout.
 */
export function findKeyForChar(
  layout: KeyboardLayout,
  char?: string | null
): KeyResolution {
  if (!char) {
    return {
      keyDef: null,
      requiresShift: false,
      requiresAltGr: false,
      requiresShiftAltGr: false,
      shiftKeyToHighlight: null,
    };
  }

  const nfcChar = char.normalize('NFC');

  // Step 1: Direct key scan across all rows
  for (const row of layout.rows) {
    for (const key of row.keys) {
      // Primary match (unmodified)
      if (key.primary === nfcChar) {
        return {
          keyDef: key,
          requiresShift: false,
          requiresAltGr: false,
          requiresShiftAltGr: false,
          shiftKeyToHighlight: null,
        };
      }

      // Shift match (Opposite-Hand Shift Rule!)
      if (key.shift === nfcChar) {
        const shiftKeyToHighlight = key.hand === 'left' ? 'ShiftRight' : 'ShiftLeft';
        return {
          keyDef: key,
          requiresShift: true,
          requiresAltGr: false,
          requiresShiftAltGr: false,
          shiftKeyToHighlight,
        };
      }

      // AltGr match
      if (key.altGr === nfcChar) {
        return {
          keyDef: key,
          requiresShift: false,
          requiresAltGr: true,
          requiresShiftAltGr: false,
          shiftKeyToHighlight: null,
        };
      }

      // Shift + AltGr match
      if (key.shiftAltGr === nfcChar) {
        const shiftKeyToHighlight = key.hand === 'left' ? 'ShiftRight' : 'ShiftLeft';
        return {
          keyDef: key,
          requiresShift: true,
          requiresAltGr: true,
          requiresShiftAltGr: true,
          shiftKeyToHighlight,
        };
      }
    }
  }

  // Step 2: US-International Dead-Key Fallback
  if (layout.id === 'us-international') {
    const deadKeyEntry = US_INTERNATIONAL_DEAD_KEYS[nfcChar];
    if (deadKeyEntry) {
      const deadKeyDef =
        findKeyByCode(layout, deadKeyEntry.deadCode) ??
        findKeyByCode(layout, deadKeyEntry.baseCode);
      const shiftKeyToHighlight = deadKeyEntry.requiresShift
        ? deadKeyDef?.hand === 'left'
          ? 'ShiftRight'
          : 'ShiftLeft'
        : null;

      return {
        keyDef: deadKeyDef,
        requiresShift: deadKeyEntry.requiresShift,
        requiresAltGr: false,
        requiresShiftAltGr: false,
        shiftKeyToHighlight,
        isDeadKey: true,
        deadKeyCode: deadKeyEntry.deadCode,
      };
    }
  }

  // Step 3: Unmapped character
  return {
    keyDef: null,
    requiresShift: false,
    requiresAltGr: false,
    requiresShiftAltGr: false,
    shiftKeyToHighlight: null,
  };
}

export interface UseKeyboardOptions {
  readonly layoutId?: KeyboardLayoutId | string;
  readonly targetChar?: string;
  readonly trackPhysicalPresses?: boolean;
}

export interface UseKeyboardReturn {
  readonly layout: KeyboardLayout;
  readonly targetKeyDef: KeyDefinition | null;
  readonly requiresShift: boolean;
  readonly requiresAltGr: boolean;
  readonly shiftKeyToHighlight: 'ShiftLeft' | 'ShiftRight' | null;
  readonly activeFinger: Finger | null;
  readonly activeHand: Hand | null;
  readonly pressedCodes: readonly string[];
  readonly resolveChar: (char: string) => KeyResolution;
  readonly setLayoutId: (layoutId: string) => void;
}

export function useKeyboard(options?: UseKeyboardOptions): UseKeyboardReturn {
  const [layoutId, setLayoutId] = useState<string>(options?.layoutId ?? 'qwerty-us');
  const [pressedCodes, setPressedCodes] = useState<readonly string[]>([]);
  const prevPropLayoutId = useRef(options?.layoutId);

  // Update layoutId if prop changes from outside
  useEffect(() => {
    if (options?.layoutId && options.layoutId !== prevPropLayoutId.current) {
      prevPropLayoutId.current = options.layoutId;
      setLayoutId(options.layoutId);
    }
  }, [options?.layoutId]);

  const layout = useMemo(() => getKeyboardLayout(layoutId), [layoutId]);

  const resolveChar = useCallback(
    (char: string): KeyResolution => {
      return findKeyForChar(layout, char);
    },
    [layout]
  );

  const targetResolution = useMemo(
    () => resolveChar(options?.targetChar ?? ''),
    [resolveChar, options?.targetChar]
  );

  // Physical keystroke tracking
  const trackPresses = options?.trackPhysicalPresses ?? false;
  useEffect(() => {
    if (!trackPresses || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      setPressedCodes((prev) => (prev.includes(e.code) ? prev : [...prev, e.code]));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setPressedCodes((prev) => prev.filter((code) => code !== e.code));
    };

    const handleBlur = () => {
      setPressedCodes([]);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [trackPresses]);

  return {
    layout,
    targetKeyDef: targetResolution.keyDef,
    requiresShift: targetResolution.requiresShift,
    requiresAltGr: targetResolution.requiresAltGr,
    shiftKeyToHighlight: targetResolution.shiftKeyToHighlight,
    activeFinger: targetResolution.keyDef?.finger ?? null,
    activeHand: targetResolution.keyDef?.hand ?? null,
    pressedCodes,
    resolveChar,
    setLayoutId,
  };
}
