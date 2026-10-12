/**
 * src/engine/__tests__/typing-engine.test.ts
 *
 * Exhaustive unit tests for KeyLingo typing engine state machine.
 * Covers all branches, guards, and edge cases to guarantee >=95% branch coverage.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  init,
  inputCharacter,
  deleteCharacter,
  pause,
  resume,
  complete,
  restart,
  getMetrics,
  getCharacterStates,
  getCurrentPosition,
  typingEngine,
  TypingEngine,
  DEFAULT_OPTIONS,
} from '../typing-engine';
import { TypingOptions, TypingSession } from '@/lib/types';

const defaultOptions: TypingOptions = {
  diacriticMatching: 'strict',
  layoutId: 'qwerty-us',
  language: 'en',
};

const lenientArabicOptions: TypingOptions = {
  diacriticMatching: 'lenient',
  layoutId: 'arabic-101',
  language: 'ar',
};

describe('Typing Engine State Machine', () => {
  // ==========================================================================
  // Suite 1: Initialization (init)
  // ==========================================================================
  describe('init()', () => {
    it('T1: initializes session with standard target and options in idle state', () => {
      const session = init('Hello', defaultOptions);

      expect(session.id).toBeDefined();
      expect(session.target).toBe('Hello');
      expect(session.graphemes).toEqual(['H', 'e', 'l', 'l', 'o']);
      expect(session.currentIndex).toBe(0);
      expect(session.characterStates).toEqual([
        'pending',
        'pending',
        'pending',
        'pending',
        'pending',
      ]);
      expect(session.status).toBe('idle');
      expect(session.startTime).toBeNull();
      expect(session.endTime).toBeNull();
      expect(session.pausedDuration).toBe(0);
      expect(session.lastPauseTime).toBeNull();
      expect(session.errors).toEqual({});
      expect(session.uncorrectedErrors).toBe(0);
      expect(session.totalKeystrokes).toBe(0);
      expect(session.options).toEqual(defaultOptions);
    });

    it('T2: normalizes Unicode decomposed characters to canonical NFC', () => {
      const decomposed = 'e\u0308';
      const session = init(decomposed, defaultOptions);

      expect(session.target).toBe('ë');
      expect(session.graphemes.length).toBe(1);
      expect(session.graphemes[0]).toBe('ë');
    });

    it('T3: segments Arabic text clusters correctly', () => {
      const arabic = 'كِتَابٌ';
      const session = init(arabic, lenientArabicOptions);

      expect(session.graphemes.length).toBeGreaterThan(0);
      expect(session.status).toBe('idle');
      expect(session.characterStates.every((s) => s === 'pending')).toBe(true);
    });

    it('T4: handles empty string and non-string target gracefully', () => {
      const sEmpty = init('', defaultOptions);
      expect(sEmpty.target).toBe('');
      expect(sEmpty.graphemes).toEqual([]);
      expect(sEmpty.characterStates).toEqual([]);
      expect(sEmpty.currentIndex).toBe(0);

      // Non-string fallback
      const sNull = init(null as unknown as string, defaultOptions);
      expect(sNull.target).toBe('');
      expect(sNull.graphemes).toEqual([]);

      const sNum = init(12345 as unknown as string, defaultOptions);
      expect(sNum.target).toBe('');
    });

    it('T5: applies fallback default options when options parameter is omitted', () => {
      const session = init('test');
      expect(session.options.diacriticMatching).toBe('strict');
      expect(session.options.language).toBe('en');
      expect(session.options.layoutId).toBe('qwerty-us');
    });

    it('T6: enforces strict immutability (frozen objects and arrays)', () => {
      const session = init('abc', defaultOptions);

      expect(Object.isFrozen(session)).toBe(true);
      expect(Object.isFrozen(session.graphemes)).toBe(true);
      expect(Object.isFrozen(session.characterStates)).toBe(true);
      expect(Object.isFrozen(session.errors)).toBe(true);
      if (session.previouslyIncorrect) {
        expect(Object.isFrozen(session.previouslyIncorrect)).toBe(true);
      }

      expect(() => {
        // @ts-expect-error runtime mutation test
        session.currentIndex = 99;
      }).toThrow();
    });
  });

  // ==========================================================================
  // Suite 2: Character Input (inputCharacter)
  // ==========================================================================
  describe('inputCharacter()', () => {
    it('T7: starts timer and transitions status from idle to active on first keystroke', () => {
      const initial = init('cat', defaultOptions);
      const t1 = 1000;
      const s1 = inputCharacter(initial, 'c', t1);

      expect(s1.status).toBe('active');
      expect(s1.startTime).toBe(t1);
      expect(s1.currentIndex).toBe(1);
      expect(s1.characterStates[0]).toBe('correct');
      expect(s1.totalKeystrokes).toBe(1);
      expect(s1.uncorrectedErrors).toBe(0);
    });

    it('T8: processes consecutive correct keystrokes preserving initial startTime', () => {
      const initial = init('cat', defaultOptions);
      const s1 = inputCharacter(initial, 'c', 1000);
      const s2 = inputCharacter(s1, 'a', 1500);

      expect(s2.status).toBe('active');
      expect(s2.startTime).toBe(1000);
      expect(s2.currentIndex).toBe(2);
      expect(s2.characterStates[0]).toBe('correct');
      expect(s2.characterStates[1]).toBe('correct');
      expect(s2.totalKeystrokes).toBe(2);
    });

    it('T9: records error and marks state incorrect on mismatched character', () => {
      const initial = init('cat', defaultOptions);
      const s1 = inputCharacter(initial, 'x', 1000);

      expect(s1.status).toBe('active');
      expect(s1.currentIndex).toBe(1);
      expect(s1.characterStates[0]).toBe('incorrect');
      expect(s1.errors['c']).toBe(1);
      expect(s1.uncorrectedErrors).toBe(1);
      expect(s1.totalKeystrokes).toBe(1);
    });

    it('T10: accumulates multiple errors on the same target key', () => {
      const s0 = init('cc', defaultOptions);
      const s1 = inputCharacter(s0, 'x', 1000);
      const s2 = inputCharacter(s1, 'z', 1200);

      expect(s2.errors['c']).toBe(2);
      expect(s2.uncorrectedErrors).toBe(2);
    });

    it('T11: single-character target completes immediately on first keystroke', () => {
      const initial = init('a', defaultOptions);
      const completed = inputCharacter(initial, 'a', 2000);

      expect(completed.currentIndex).toBe(1);
      expect(completed.status).toBe('completed');
      expect(completed.startTime).toBe(2000);
      expect(completed.endTime).toBe(2000);
    });

    it('T12: completes session on final keystroke of multi-character target', () => {
      const s0 = init('hi', defaultOptions);
      const s1 = inputCharacter(s0, 'h', 1000);
      const s2 = inputCharacter(s1, 'i', 2000);

      expect(s2.currentIndex).toBe(2);
      expect(s2.status).toBe('completed');
      expect(s2.startTime).toBe(1000);
      expect(s2.endTime).toBe(2000);
    });

    it('T13: completes session when final keystroke is an error', () => {
      const s0 = init('hi', defaultOptions);
      const s1 = inputCharacter(s0, 'h', 1000);
      const s2 = inputCharacter(s1, 'x', 2000);

      expect(s2.currentIndex).toBe(2);
      expect(s2.status).toBe('completed');
      expect(s2.characterStates[1]).toBe('incorrect');
      expect(s2.uncorrectedErrors).toBe(1);
      expect(s2.endTime).toBe(2000);
    });

    it('T14: rejects input when session is completed (guard branch)', () => {
      const s0 = init('a', defaultOptions);
      const completed = inputCharacter(s0, 'a', 1000);
      const rejected = inputCharacter(completed, 'b', 2000);

      expect(rejected).toBe(completed);
      expect(rejected.currentIndex).toBe(1);
    });

    it('T15: rejects input when session is paused (guard branch)', () => {
      const s0 = init('cat', defaultOptions);
      const s1 = inputCharacter(s0, 'c', 1000);
      const paused = pause(s1, 1500);
      const rejected = inputCharacter(paused, 'a', 2000);

      expect(rejected).toBe(paused);
      expect(rejected.currentIndex).toBe(1);
    });

    it('T16: rejects empty character string (guard branch)', () => {
      const s0 = init('cat', defaultOptions);
      const rejectedEmpty = inputCharacter(s0, '', 1000);
      expect(rejectedEmpty).toBe(s0);

      // Falsy char
      const rejectedNull = inputCharacter(s0, null as unknown as string, 1000);
      expect(rejectedNull).toBe(s0);
    });

    it('T17: rejects input when currentIndex is already at graphemes.length', () => {
      const s0 = init('', defaultOptions);
      const rejected = inputCharacter(s0, 'a', 1000);

      expect(rejected).toBe(s0);
    });

    it('T18: returned session is frozen and immutably decoupled from input session', () => {
      const s0 = init('cat', defaultOptions);
      const s1 = inputCharacter(s0, 'c', 1000);

      expect(Object.isFrozen(s1)).toBe(true);
      expect(Object.isFrozen(s1.characterStates)).toBe(true);
      expect(Object.isFrozen(s1.errors)).toBe(true);
      expect(s0.currentIndex).toBe(0);
      expect(s1.currentIndex).toBe(1);
    });

    it('T18b: uses default Date.now() when timestamp is not passed', () => {
      const s0 = init('cat', defaultOptions);
      const s1 = inputCharacter(s0, 'c');
      expect(s1.startTime).toBeTypeOf('number');
    });

    it('T18c: handles session missing previouslyIncorrect array defensively', () => {
      const rawSession: TypingSession = {
        id: '123',
        target: 'a',
        graphemes: ['a'],
        currentIndex: 0,
        characterStates: ['pending'],
        status: 'idle',
        startTime: null,
        pausedDuration: 0,
        lastPauseTime: null,
        endTime: null,
        errors: {},
        uncorrectedErrors: 0,
        totalKeystrokes: 0,
        options: defaultOptions,
        previouslyIncorrect: undefined,
      };

      const res = inputCharacter(rawSession, 'a', 1000);
      expect(res.characterStates[0]).toBe('correct');
    });

    it('T18d: handles session missing options diacriticMatching defensively', () => {
      const rawSession: TypingSession = {
        id: '123',
        target: 'a',
        graphemes: ['a'],
        currentIndex: 0,
        characterStates: ['pending'],
        status: 'idle',
        startTime: null,
        pausedDuration: 0,
        lastPauseTime: null,
        endTime: null,
        errors: {},
        uncorrectedErrors: 0,
        totalKeystrokes: 0,
        // @ts-expect-error partial options
        options: { language: 'en', layoutId: 'qwerty-us' },
      };

      const res = inputCharacter(rawSession, 'a', 1000);
      expect(res.characterStates[0]).toBe('correct');
    });
  });

  // ==========================================================================
  // Suite 3: Character Deletion & State Lifecycle (deleteCharacter)
  // ==========================================================================
  describe('deleteCharacter()', () => {
    it('T19: backspace at currentIndex 0 is a no-op', () => {
      const s0 = init('cat', defaultOptions);
      const result = deleteCharacter(s0);

      expect(result).toBe(s0);
    });

    it('T20: backspace when session is idle is a no-op', () => {
      const s0 = init('cat', defaultOptions);
      const result = deleteCharacter(s0);

      expect(result).toBe(s0);
      expect(result.status).toBe('idle');
    });

    it('T21: backspace when session is completed is a no-op', () => {
      const s0 = init('a', defaultOptions);
      const completed = inputCharacter(s0, 'a', 1000);
      const result = deleteCharacter(completed);

      expect(result).toBe(completed);
    });

    it('T22: backspace when session is paused is a no-op', () => {
      const s0 = init('cat', defaultOptions);
      const s1 = inputCharacter(s0, 'c', 1000);
      const paused = pause(s1, 1500);
      const result = deleteCharacter(paused);

      expect(result).toBe(paused);
    });

    it('T23: backspacing over incorrect character decrements uncorrectedErrors and reverts state', () => {
      const s0 = init('cat', defaultOptions);
      const s1 = inputCharacter(s0, 'x', 1000);
      expect(s1.uncorrectedErrors).toBe(1);

      const s2 = deleteCharacter(s1);
      expect(s2.currentIndex).toBe(0);
      expect(s2.characterStates[0]).toBe('pending');
      expect(s2.uncorrectedErrors).toBe(0);
      // Historical error map retains mistake
      expect(s2.errors['c']).toBe(1);
    });

    it('T24: backspacing over correct character reverts state without decrementing uncorrectedErrors', () => {
      const s0 = init('cat', defaultOptions);
      const s1 = inputCharacter(s0, 'c', 1000);
      expect(s1.characterStates[0]).toBe('correct');
      expect(s1.uncorrectedErrors).toBe(0);

      const s2 = deleteCharacter(s1);
      expect(s2.currentIndex).toBe(0);
      expect(s2.characterStates[0]).toBe('pending');
      expect(s2.uncorrectedErrors).toBe(0);
    });

    it('T25: backspacing over corrected character reverts state without decrementing uncorrectedErrors', () => {
      const s0 = init('cat', defaultOptions);
      const s1 = inputCharacter(s0, 'x', 1000); // error
      const s2 = deleteCharacter(s1); // backspace
      const s3 = inputCharacter(s2, 'c', 2000); // corrected
      expect(s3.characterStates[0]).toBe('corrected');
      expect(s3.uncorrectedErrors).toBe(0);

      const s4 = deleteCharacter(s3); // backspace over corrected
      expect(s4.currentIndex).toBe(0);
      expect(s4.characterStates[0]).toBe('pending');
      expect(s4.uncorrectedErrors).toBe(0);
    });

    it('T26: retyping correct character after backspace marks character as corrected', () => {
      const s0 = init('cat', defaultOptions);
      const s1 = inputCharacter(s0, 'x', 1000); // incorrect
      expect(s1.characterStates[0]).toBe('incorrect');

      const s2 = deleteCharacter(s1); // backspace
      expect(s2.characterStates[0]).toBe('pending');

      const s3 = inputCharacter(s2, 'c', 2000); // type correct
      expect(s3.characterStates[0]).toBe('corrected');
      expect(s3.uncorrectedErrors).toBe(0);
    });

    it('T27: retyping incorrect character after backspace marks character as incorrect and increments errors', () => {
      const s0 = init('cat', defaultOptions);
      const s1 = inputCharacter(s0, 'x', 1000); // mistake 1
      const s2 = deleteCharacter(s1);
      const s3 = inputCharacter(s2, 'y', 2000); // mistake 2

      expect(s3.characterStates[0]).toBe('incorrect');
      expect(s3.uncorrectedErrors).toBe(1);
      expect(s3.errors['c']).toBe(2);
    });
  });

  // ==========================================================================
  // Suite 4: Pause and Resume Lifecycle
  // ==========================================================================
  describe('pause() and resume()', () => {
    it('T28: pause on active session sets status to paused and records lastPauseTime', () => {
      const s0 = init('cat', defaultOptions);
      const s1 = inputCharacter(s0, 'c', 1000);
      const sPaused = pause(s1, 1500);

      expect(sPaused.status).toBe('paused');
      expect(sPaused.lastPauseTime).toBe(1500);
    });

    it('T29: pause on idle session is a no-op guard', () => {
      const s0 = init('cat', defaultOptions);
      const result = pause(s0, 1000);

      expect(result).toBe(s0);
      expect(result.status).toBe('idle');
    });

    it('T30: pause on already paused session is a no-op guard', () => {
      const s0 = init('cat', defaultOptions);
      const s1 = inputCharacter(s0, 'c', 1000);
      const sPaused = pause(s1, 1500);
      const sPausedAgain = pause(sPaused, 2000);

      expect(sPausedAgain).toBe(sPaused);
    });

    it('T31: pause on completed session is a no-op guard', () => {
      const s0 = init('a', defaultOptions);
      const completed = inputCharacter(s0, 'a', 1000);
      const result = pause(completed, 2000);

      expect(result).toBe(completed);
    });

    it('T32: resume on paused session accumulates paused duration and unsets lastPauseTime', () => {
      const s0 = init('cat', defaultOptions);
      const s1 = inputCharacter(s0, 'c', 1000);
      const sPaused = pause(s1, 1500);
      const sResumed = resume(sPaused, 3500); // paused for 2000ms

      expect(sResumed.status).toBe('active');
      expect(sResumed.pausedDuration).toBe(2000);
      expect(sResumed.lastPauseTime).toBeNull();
    });

    it('T33: resume on active session is a no-op guard', () => {
      const s0 = init('cat', defaultOptions);
      const s1 = inputCharacter(s0, 'c', 1000);
      const result = resume(s1, 1500);

      expect(result).toBe(s1);
      expect(result.status).toBe('active');
    });

    it('T34: resume on idle session is a no-op guard', () => {
      const s0 = init('cat', defaultOptions);
      const result = resume(s0, 1000);

      expect(result).toBe(s0);
      expect(result.status).toBe('idle');
    });

    it('T35: resume on completed session is a no-op guard', () => {
      const s0 = init('a', defaultOptions);
      const completed = inputCharacter(s0, 'a', 1000);
      const result = resume(completed, 2000);

      expect(result).toBe(completed);
    });

    it('T36: multiple pause/resume cycles accumulate pausedDuration cleanly', () => {
      const s0 = init('cat', defaultOptions);
      const s1 = inputCharacter(s0, 'c', 1000);
      // First pause: 1500 to 2500 (1000ms)
      const p1 = pause(s1, 1500);
      const r1 = resume(p1, 2500);
      expect(r1.pausedDuration).toBe(1000);

      // Second pause: 4000 to 7000 (3000ms)
      const p2 = pause(r1, 4000);
      const r2 = resume(p2, 7000);
      expect(r2.pausedDuration).toBe(4000);
    });

    it('T37: resume handles defensive null lastPauseTime', () => {
      const mockPaused: TypingSession = {
        id: '123',
        target: 'a',
        graphemes: ['a'],
        currentIndex: 0,
        characterStates: ['pending'],
        status: 'paused',
        startTime: 1000,
        pausedDuration: 500,
        lastPauseTime: null,
        endTime: null,
        errors: {},
        uncorrectedErrors: 0,
        totalKeystrokes: 0,
        options: defaultOptions,
      };

      const res = resume(mockPaused, 2000);
      expect(res.status).toBe('active');
      expect(res.pausedDuration).toBe(500);
    });

    it('T37b: uses default Date.now() when timestamp is omitted for pause/resume', () => {
      const s0 = init('cat', defaultOptions);
      const s1 = inputCharacter(s0, 'c', 1000);
      const sPaused = pause(s1);
      expect(sPaused.lastPauseTime).toBeTypeOf('number');

      const sResumed = resume(sPaused);
      expect(sResumed.status).toBe('active');
    });
  });

  // ==========================================================================
  // Suite 5: Session Completion (complete)
  // ==========================================================================
  describe('complete()', () => {
    it('T38: complete transitions active session to completed and records endTime', () => {
      const s0 = init('cat', defaultOptions);
      const s1 = inputCharacter(s0, 'c', 1000);
      const sDone = complete(s1, 5000);

      expect(sDone.status).toBe('completed');
      expect(sDone.endTime).toBe(5000);
    });

    it('T39: complete on paused session flushes active pause into pausedDuration', () => {
      const s0 = init('cat', defaultOptions);
      const s1 = inputCharacter(s0, 'c', 1000);
      const sPaused = pause(s1, 2000);
      const sDone = complete(sPaused, 5000); // 3000ms in pause

      expect(sDone.status).toBe('completed');
      expect(sDone.pausedDuration).toBe(3000);
      expect(sDone.lastPauseTime).toBeNull();
      expect(sDone.endTime).toBe(5000);
    });

    it('T40: complete on already completed session is a no-op guard', () => {
      const s0 = init('a', defaultOptions);
      const completed = inputCharacter(s0, 'a', 1000);
      const result = complete(completed, 2000);

      expect(result).toBe(completed);
    });

    it('T41: complete preserves existing endTime if already set', () => {
      const s0 = init('a', defaultOptions);
      const s1 = inputCharacter(s0, 'a', 1000); // completed with endTime = 1000
      expect(s1.endTime).toBe(1000);

      const manuallyCompleted = complete(s1, 9999);
      expect(manuallyCompleted).toBe(s1);
      expect(manuallyCompleted.endTime).toBe(1000);
    });

    it('T41b: complete on paused session with null lastPauseTime handles duration cleanly', () => {
      const mockPaused: TypingSession = {
        id: '123',
        target: 'a',
        graphemes: ['a'],
        currentIndex: 0,
        characterStates: ['pending'],
        status: 'paused',
        startTime: 1000,
        pausedDuration: 500,
        lastPauseTime: null,
        endTime: null,
        errors: {},
        uncorrectedErrors: 0,
        totalKeystrokes: 0,
        options: defaultOptions,
      };

      const res = complete(mockPaused, 2000);
      expect(res.status).toBe('completed');
      expect(res.pausedDuration).toBe(500);
    });

    it('T41c: uses default Date.now() when timestamp is omitted in complete', () => {
      const s0 = init('cat', defaultOptions);
      const s1 = inputCharacter(s0, 'c', 1000);
      const sDone = complete(s1);
      expect(sDone.endTime).toBeTypeOf('number');
    });
  });

  // ==========================================================================
  // Suite 6: Session Restart (restart)
  // ==========================================================================
  describe('restart()', () => {
    it('T42: restart recreates fresh idle session with identical target and options', () => {
      const s0 = init('cat', defaultOptions);
      const s1 = inputCharacter(s0, 'x', 1000); // error
      const s2 = inputCharacter(s1, 'a', 1500);
      const restarted = restart(s2);

      expect(restarted.id).not.toBe(s2.id);
      expect(restarted.target).toBe('cat');
      expect(restarted.currentIndex).toBe(0);
      expect(restarted.status).toBe('idle');
      expect(restarted.errors).toEqual({});
      expect(restarted.totalKeystrokes).toBe(0);
      expect(restarted.characterStates.every((s) => s === 'pending')).toBe(true);
      expect(restarted.options).toEqual(defaultOptions);
    });

    it('T43: restart preserves custom Arabic diacritic options', () => {
      const s0 = init('كَتَبَ', lenientArabicOptions);
      const s1 = inputCharacter(s0, 'ك', 1000);
      const restarted = restart(s1);

      expect(restarted.target).toBe('كَتَبَ');
      expect(restarted.options.language).toBe('ar');
      expect(restarted.options.diacriticMatching).toBe('lenient');
    });
  });

  // ==========================================================================
  // Suite 7: Accessors & Singleton Interface
  // ==========================================================================
  describe('Metrics, Accessors & Interface singleton', () => {
    it('T44: getMetrics computes accurate live metrics matching session state', () => {
      const s0 = init('cat', defaultOptions);
      const s1 = inputCharacter(s0, 'c', 1000);
      const metrics = getMetrics(s1, 2000);

      expect(metrics.accuracy).toBe(100.0);
      expect(metrics.elapsedTimeMs).toBe(1000);
      expect(metrics.errorCount).toBe(0);
    });

    it('T44b: getMetrics uses default Date.now() when timestamp is omitted', () => {
      const s0 = init('cat', defaultOptions);
      const s1 = inputCharacter(s0, 'c', Date.now() - 500);
      const metrics = getMetrics(s1);
      expect(metrics.elapsedTimeMs).toBeGreaterThan(0);
    });

    it('T45: getCharacterStates returns read-only characterStates array', () => {
      const s0 = init('cat', defaultOptions);
      const s1 = inputCharacter(s0, 'c', 1000);

      expect(getCharacterStates(s1)).toEqual(['correct', 'pending', 'pending']);
    });

    it('T46: getCurrentPosition returns current cursor index', () => {
      const s0 = init('cat', defaultOptions);
      expect(getCurrentPosition(s0)).toBe(0);

      const s1 = inputCharacter(s0, 'c', 1000);
      expect(getCurrentPosition(s1)).toBe(1);
    });

    it('T47: typingEngine singleton correctly delegates all interface methods', () => {
      expect(typingEngine.init).toBe(init);
      expect(typingEngine.inputCharacter).toBe(inputCharacter);
      expect(typingEngine.deleteCharacter).toBe(deleteCharacter);
      expect(typingEngine.pause).toBe(pause);
      expect(typingEngine.resume).toBe(resume);
      expect(typingEngine.complete).toBe(complete);
      expect(typingEngine.restart).toBe(restart);
      expect(typingEngine.getMetrics).toBe(getMetrics);
      expect(typingEngine.getCharacterStates).toBe(getCharacterStates);
      expect(typingEngine.getCurrentPosition).toBe(getCurrentPosition);
      expect(TypingEngine).toBe(typingEngine);
    });
  });

  // ==========================================================================
  // Suite 8: Session ID Generation & Fallback
  // ==========================================================================
  describe('Session ID generator fallback', () => {
    it('T48: falls back when crypto.randomUUID is not available', () => {
      vi.stubGlobal('crypto', { randomUUID: undefined });
      try {
        const session = init('abc', defaultOptions);
        expect(session.id).toMatch(/^session_\d+_[a-z0-9]+$/);
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });
});
