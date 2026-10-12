import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboard, findKeyForChar } from '../useKeyboard';
import { qwertyUsLayout } from '@/content/keyboards/qwerty-us';
import { usInternationalLayout } from '@/content/keyboards/us-international';
import { arabic101Layout } from '@/content/keyboards/arabic-101';

describe('useKeyboard Hook & Character Resolution', () => {
  describe('1. findKeyForChar Pure Function', () => {
    it('resolves lowercase character to physical key with correct touch finger', () => {
      const res = findKeyForChar(qwertyUsLayout, 'a');
      expect(res.keyDef?.code).toBe('KeyA');
      expect(res.keyDef?.finger).toBe('pinky');
      expect(res.keyDef?.hand).toBe('left');
      expect(res.requiresShift).toBe(false);
      expect(res.shiftKeyToHighlight).toBeNull();
    });

    it('enforces Opposite-Hand Shift rule for left-hand shifted keys', () => {
      // 'A' and '!' are left hand -> Right Shift highlighted
      const resA = findKeyForChar(qwertyUsLayout, 'A');
      expect(resA.keyDef?.code).toBe('KeyA');
      expect(resA.requiresShift).toBe(true);
      expect(resA.shiftKeyToHighlight).toBe('ShiftRight');

      const resExclamation = findKeyForChar(qwertyUsLayout, '!');
      expect(resExclamation.keyDef?.code).toBe('Digit1');
      expect(resExclamation.requiresShift).toBe(true);
      expect(resExclamation.shiftKeyToHighlight).toBe('ShiftRight');
    });

    it('enforces Opposite-Hand Shift rule for right-hand shifted keys', () => {
      // 'J' and '?' are right hand -> Left Shift highlighted
      const resJ = findKeyForChar(qwertyUsLayout, 'J');
      expect(resJ.keyDef?.code).toBe('KeyJ');
      expect(resJ.requiresShift).toBe(true);
      expect(resJ.shiftKeyToHighlight).toBe('ShiftLeft');

      const resQuestion = findKeyForChar(qwertyUsLayout, '?');
      expect(resQuestion.keyDef?.code).toBe('Slash');
      expect(resQuestion.requiresShift).toBe(true);
      expect(resQuestion.shiftKeyToHighlight).toBe('ShiftLeft');
    });

    it('resolves Space character to Space key with thumb', () => {
      const res = findKeyForChar(qwertyUsLayout, ' ');
      expect(res.keyDef?.code).toBe('Space');
      expect(res.keyDef?.finger).toBe('thumb');
      expect(res.requiresShift).toBe(false);
    });

    it('resolves US-International AltGr characters', () => {
      const res = findKeyForChar(usInternationalLayout, 'é');
      expect(res.keyDef?.code).toBe('KeyE');
      expect(res.requiresAltGr).toBe(true);
      expect(res.requiresShift).toBe(false);
    });

    it('resolves US-International dead-key combinations', () => {
      const res = findKeyForChar(usInternationalLayout, 'ë');
      expect(res.isDeadKey).toBe(true);
      expect(res.deadKeyCode).toBe('Quote');
      expect(res.requiresShift).toBe(true);
      expect(res.shiftKeyToHighlight).toBe('ShiftLeft'); // Quote is right hand -> Left Shift
    });

    it('resolves Arabic 101 base characters and Tashkeel diacritics', () => {
      const resBaa = findKeyForChar(arabic101Layout, 'ب');
      expect(resBaa.keyDef?.code).toBe('KeyF');
      expect(resBaa.keyDef?.homeRow).toBe(true);
      expect(resBaa.requiresShift).toBe(false);

      const resFatha = findKeyForChar(arabic101Layout, '\u064E');
      expect(resFatha.keyDef?.code).toBe('KeyQ');
      expect(resFatha.requiresShift).toBe(true);
    });

    it('handles empty, null, or unmapped characters gracefully', () => {
      expect(findKeyForChar(qwertyUsLayout, null).keyDef).toBeNull();
      expect(findKeyForChar(qwertyUsLayout, '').keyDef).toBeNull();
      expect(findKeyForChar(qwertyUsLayout, '🚀').keyDef).toBeNull();
    });
  });

  describe('2. useKeyboard Hook Lifecycle & Keystroke Tracking', () => {
    it('initializes with specified layout and target character', () => {
      const { result } = renderHook(() =>
        useKeyboard({ layoutId: 'qwerty-us', targetChar: 'f' })
      );

      expect(result.current.layout.id).toBe('qwerty-us');
      expect(result.current.targetKeyDef?.code).toBe('KeyF');
      expect(result.current.activeFinger).toBe('index');
      expect(result.current.activeHand).toBe('left');
    });

    it('switches layout dynamically via setLayoutId', () => {
      const { result } = renderHook(() => useKeyboard({ layoutId: 'qwerty-us' }));
      expect(result.current.layout.id).toBe('qwerty-us');

      act(() => {
        result.current.setLayoutId('arabic-101');
      });

      expect(result.current.layout.id).toBe('arabic-101');
    });

    it('tracks physical key presses and releases when trackPhysicalPresses is true', () => {
      const { result } = renderHook(() =>
        useKeyboard({ trackPhysicalPresses: true })
      );

      expect(result.current.pressedCodes).toEqual([]);

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));
      });
      expect(result.current.pressedCodes).toContain('KeyA');

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ShiftLeft' }));
      });
      expect(result.current.pressedCodes).toContain('KeyA');
      expect(result.current.pressedCodes).toContain('ShiftLeft');

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyA' }));
      });
      expect(result.current.pressedCodes).not.toContain('KeyA');
      expect(result.current.pressedCodes).toContain('ShiftLeft');

      act(() => {
        window.dispatchEvent(new Event('blur'));
      });
      expect(result.current.pressedCodes).toEqual([]);
    });
  });
});
